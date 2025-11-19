import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  Download,
  Settings,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Upload,
  FileSpreadsheet,
} from "lucide-react";
import { format, startOfYear, addWeeks, getWeek, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Interfaces
interface ProgramacaoManutencao {
  id: string;
  localizacao: string;
  ano: number;
  semanas_programadas: number[];
  semanas_semestrais: number[];
  observacoes?: string;
  criado_por?: string;
  ativa: boolean;
}

// Local fallback storage helpers for demo/offline mode
function getProgramacaoStorageKey(): string {
  return "programacao_manutencao_v1";
}

function readAllLocalProgramacoes(): ProgramacaoManutencao[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getProgramacaoStorageKey());
    return raw ? (JSON.parse(raw) as ProgramacaoManutencao[]) : [];
  } catch {
    return [];
  }
}

function writeAllLocalProgramacoes(items: ProgramacaoManutencao[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getProgramacaoStorageKey(), JSON.stringify(items));
  } catch {
    // ignore storage errors in demo mode
  }
}

function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `local_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  }
}

function upsertLocalProgramacao(
  payload: Omit<ProgramacaoManutencao, "id"> & { id?: string }
): void {
  const all = readAllLocalProgramacoes();
  // deactivate existing active for same local/year
  for (const p of all) {
    if (p.localizacao === payload.localizacao && p.ano === payload.ano && p.ativa) {
      p.ativa = false;
    }
  }
  const id = payload.id || generateId();
  const novo: ProgramacaoManutencao = {
    id,
    localizacao: payload.localizacao,
    ano: payload.ano,
    semanas_programadas: [...payload.semanas_programadas],
    semanas_semestrais: [...payload.semanas_semestrais],
    observacoes: payload.observacoes,
    criado_por: payload.criado_por,
    ativa: true,
  };
  all.push(novo);
  writeAllLocalProgramacoes(all);
}

function queryLocalProgramacoes(ano: number): ProgramacaoManutencao[] {
  const all = readAllLocalProgramacoes();
  return all.filter((p) => p.ano === ano && p.ativa);
}

function isSchemaCacheError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as any).message === "string" &&
    (err as any).message.toLowerCase().includes("schema cache")
  );
}

interface Ativo {
  id: string;
    asset_code: string;
    asset_type: string;
  brand?: string;
  model?: string;
    location: string;
  sector?: string | null;
}

interface WorkOrder {
  id: string;
  order_number: string;
  asset_id: string;
  status: string;
  scheduled_date?: string;
  data_prevista?: string;
}

interface StatusSemana {
  status: "concluida" | "em_andamento" | "agendada" | "pendente" | "vazio";
  os_id?: string;
  os_number?: string;
  tipo?: "mensal" | "semestral";
}

// Helper: Get weeks of the year
function getWeeksOfYear(year: number): Date[] {
  const weeks: Date[] = [];
  const start = startOfYear(new Date(year, 0, 1));
  for (let i = 0; i < 52; i++) {
    weeks.push(addWeeks(start, i));
      }
  return weeks;
}

// Helper: Create work orders map for fast lookup
function createWorkOrdersMap(workOrders: WorkOrder[], semanasDoAno: Date[]): Map<string, WorkOrder> {
  const map = new Map<string, WorkOrder>();
  workOrders.forEach((wo) => {
    if (wo.scheduled_date && wo.asset_id) {
      const woDate = format(new Date(wo.scheduled_date), "yyyy-MM-dd");
      semanasDoAno.forEach((semana, idx) => {
        const semanaDate = format(semana, "yyyy-MM-dd");
        if (woDate === semanaDate) {
          const key = `${wo.asset_id}_${idx}`;
          map.set(key, wo);
        }
      });
    }
  });
  return map;
}

// Helper: Get status of a week for an asset - optimized
function getStatusSemana(
  ativo: Ativo,
  semanaIdx: number,
  programacao: ProgramacaoManutencao | null,
  workOrdersMap: Map<string, WorkOrder>
): StatusSemana {
  if (!programacao || !programacao.semanas_programadas.includes(semanaIdx)) {
    return { status: "vazio" };
  }

  const key = `${ativo.id}_${semanaIdx}`;
  const os = workOrdersMap.get(key);

  if (os) {
    if (os.status === "concluida") {
      return { status: "concluida", os_id: os.id, os_number: os.order_number };
      }
    if (os.status === "em_andamento") {
      return {
        status: "em_andamento",
        os_id: os.id,
        os_number: os.order_number,
      };
    }
    return { status: "agendada", os_id: os.id, os_number: os.order_number };
  }

  // No OS created - pendente
  const isSemestral = programacao.semanas_semestrais.includes(semanaIdx);
  return {
    status: "pendente",
    tipo: isSemestral ? "semestral" : "mensal",
  };
}

export default function Planning() {
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2026);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [localSelecionado, setLocalSelecionado] = useState<string>("todos");
  const [semanasParaGerar, setSemanasParaGerar] = useState<number[]>([]);
  const [gerandoOS, setGerandoOS] = useState(false);
  const [mostrarDialogCriarPlano, setMostrarDialogCriarPlano] = useState(false);
  const [mostrarDialogProgramacao, setMostrarDialogProgramacao] = useState(false);
  const [localEmEdicao, setLocalEmEdicao] = useState<string>("");
  const [semanasSelecionadas, setSemanasSelecionadas] = useState<number[]>([]);
  const [semanasSemestrais, setSemanasSemestrais] = useState<number[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [mostrarDialogImportar, setMostrarDialogImportar] = useState(false);
  const [dadosImportados, setDadosImportados] = useState<any[]>([]);
  const [editandoDados, setEditandoDados] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();


  // Get user and role
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch user role from profiles
  useEffect(() => {
    const fetchRole = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    };
    fetchRole();
  }, [user]);

  // Fetch assets - with cache
  const { data: ativos = [], isLoading: loadingAtivos } = useQuery({
    queryKey: ["ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("asset_code");
      if (error) throw error;
      return data as Ativo[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch programacoes - with cache
  const { data: programacoes = [], isLoading: loadingProgramacoes } = useQuery({
    queryKey: ["programacoes", anoSelecionado],
    queryFn: async (): Promise<ProgramacaoManutencao[]> => {
      const supabaseClient = supabase as any;
      try {
        const { data, error } = await supabaseClient
          .from("programacao_manutencao")
          .select("*")
          .eq("ano", anoSelecionado)
          .eq("ativa", true);
        if (error) throw error;
        return (data || []) as ProgramacaoManutencao[];
      } catch (err) {
        if (isSchemaCacheError(err)) {
          // Fallback to local storage for demo
          return queryLocalProgramacoes(anoSelecionado);
        }
        throw err as Error;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Fetch work orders - apenas do ano selecionado para melhor performance
  const { data: workOrders = [] } = useQuery({
    queryKey: ["work_orders", anoSelecionado],
    queryFn: async () => {
      const startYear = new Date(anoSelecionado, 0, 1).toISOString().split('T')[0];
      const endYear = new Date(anoSelecionado, 11, 31).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .eq("order_type", "preventiva")
        .gte("scheduled_date", startYear)
        .lte("scheduled_date", endYear);
      if (error) throw error;
      return data as WorkOrder[];
    },
    staleTime: 2 * 60 * 1000, // Cache por 2 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Memoize weeks of year
  const semanasDoAno = useMemo(() => getWeeksOfYear(anoSelecionado), [anoSelecionado]);

  // Group assets by prédio (sector) - memoized
  // Extrai o prédio do location ou usa o sector
  const ativosPorPredio = useMemo(() => {
    const grouped: Record<string, Ativo[]> = {};
    ativos.forEach((ativo) => {
      // Tentar usar sector primeiro, depois extrair do location
      let predio = ativo.sector || null;
      
      if (!predio && ativo.location) {
        // Se location tem formato "PRÉDIO - LOCAL", pegar só o PRÉDIO
        const parts = ativo.location.split(' - ');
        predio = parts[0] || ativo.location;
      }
      
      predio = predio || "Sem Prédio";
      
      if (!grouped[predio]) {
        grouped[predio] = [];
      }
      grouped[predio].push(ativo);
    });
    return grouped;
  }, [ativos]);

  const prediosDisponiveis = useMemo(() => Object.keys(ativosPorPredio).sort(), [ativosPorPredio]);
  const prediosFiltrados = useMemo(
    () => (localSelecionado === "todos" ? prediosDisponiveis : [localSelecionado]),
    [localSelecionado, prediosDisponiveis]
  );

  // Get programacao for a prédio - memoized
  const programacoesPorPredio = useMemo(() => {
    const map = new Map<string, ProgramacaoManutencao>();
    programacoes.forEach((p) => {
      if (p.ativa) {
        map.set(p.localizacao, p);
      }
    });
    return map;
  }, [programacoes]);

  const getProgramacao = useCallback(
    (predio: string): ProgramacaoManutencao | null => {
      return programacoesPorPredio.get(predio) || null;
    },
    [programacoesPorPredio]
  );

  // Create work orders map for fast lookup - memoized
  const workOrdersMap = useMemo(
    () => createWorkOrdersMap(workOrders, semanasDoAno),
    [workOrders, semanasDoAno]
  );

  // Calculate statistics - memoized
  const estatisticas = useMemo(() => {
    let concluidas = 0;
    let pendentes = 0;

    const totalEquipamentos = prediosFiltrados.reduce(
      (acc, predio) => acc + (ativosPorPredio[predio]?.length || 0),
      0
    );

    const totalManutencoes = prediosFiltrados.reduce((acc, predio) => {
      const prog = getProgramacao(predio);
      const qtdEquip = ativosPorPredio[predio]?.length || 0;
      return acc + (prog ? prog.semanas_programadas.length * qtdEquip : 0);
    }, 0);

    const prediosComProgramacao = prediosFiltrados.filter((predio) =>
      getProgramacao(predio)
    ).length;

    // Calculate concluidas and pendentes
    prediosFiltrados.forEach((predio) => {
      const prog = getProgramacao(predio);
      if (!prog) return;

      ativosPorPredio[predio]?.forEach((ativo) => {
        prog.semanas_programadas.forEach((semanaIdx) => {
          const status = getStatusSemana(ativo, semanaIdx, prog, workOrdersMap);
          if (status.status === "concluida") concluidas++;
          if (status.status === "pendente") pendentes++;
        });
      });
    });

    return {
      totalEquipamentos,
      totalManutencoes,
      concluidas,
      pendentes,
      locaisComProgramacao: prediosComProgramacao,
    };
  }, [prediosFiltrados, ativosPorPredio, getProgramacao, workOrdersMap]);

  // Toggle semana selection for OS generation
  const handleToggleSemanaGerar = (semanaIdx: number) => {
    setSemanasParaGerar((prev) => {
      if (prev.includes(semanaIdx)) {
        return prev.filter((s) => s !== semanaIdx);
      }
      return [...prev, semanaIdx].sort((a, b) => a - b);
    });
  };

  // Count pending OSs for selected weeks - memoized
  const contarOSPendentes = useMemo(() => {
    let count = 0;
    semanasParaGerar.forEach((semanaIdx) => {
      prediosFiltrados.forEach((predio) => {
        const prog = getProgramacao(predio);
        if (!prog) return;

        ativosPorPredio[predio]?.forEach((ativo) => {
          const status = getStatusSemana(ativo, semanaIdx, prog, workOrdersMap);
          if (status.status === "pendente") count++;
        });
      });
    });
    return count;
  }, [semanasParaGerar, prediosFiltrados, ativosPorPredio, getProgramacao, workOrdersMap]);

  // Create plan mutation
  const criarPlanoMutation = useMutation({
    mutationFn: async () => {
      const semanasPadrao = [0, 3, 7, 11, 15, 19, 23, 26, 30, 34, 38, 42];
      const semanasSemestraisPadrao = [0, 26];

      const prediosParaCriar = prediosDisponiveis.filter((predio) => {
        const existe = programacoes.some(
          (p) => p.localizacao === predio && p.ano === anoSelecionado && p.ativa
        );
        return !existe;
      });

      if (prediosParaCriar.length === 0) {
        throw new Error("Plano já existe para todos os prédios");
      }

      const inserts = prediosParaCriar.map((predio) => ({
        localizacao: predio,
        ano: anoSelecionado,
        semanas_programadas: semanasPadrao,
        semanas_semestrais: semanasSemestraisPadrao,
        criado_por: user?.email || "",
        ativa: true,
      }));

      const supabaseClient = supabase as any;
      try {
        const { error } = await supabaseClient
          .from("programacao_manutencao")
          .insert(inserts);
        if (error) throw error;
        return prediosParaCriar.length;
      } catch (err) {
        if (isSchemaCacheError(err)) {
          // Save locally for demo
          inserts.forEach((p) =>
            upsertLocalProgramacao({
              localizacao: p.localizacao,
              ano: p.ano,
              semanas_programadas: p.semanas_programadas,
              semanas_semestrais: p.semanas_semestrais,
              observacoes: p.observacoes,
              criado_por: p.criado_por,
              ativa: true,
            })
          );
          return prediosParaCriar.length;
        }
        throw err as Error;
      }
    },
    onSuccess: (count) => {
      toast.success(`✅ Plano ${anoSelecionado} criado para ${count} prédios!`);
      setMostrarDialogCriarPlano(false);
      queryClient.invalidateQueries({ queryKey: ["programacoes"] });
    },
    onError: (error: Error) => {
      if (error.message.includes("já existe")) {
        toast.info("ℹ️ " + error.message);
      } else {
        toast.error("Erro ao criar plano: " + error.message);
      }
    },
  });

  // Generate OS mutation
  const gerarOSMutation = useMutation({
    mutationFn: async () => {
      if (semanasParaGerar.length === 0) {
        throw new Error("Selecione pelo menos uma semana");
      }

      let totalGeradas = 0;
      const osToCreate: any[] = [];

      prediosFiltrados.forEach((predio) => {
        const prog = getProgramacao(predio);
        if (!prog) return;

        semanasParaGerar.forEach((semanaIdx) => {
          const isSemestral = prog.semanas_semestrais.includes(semanaIdx);
          const tipoManutencao = isSemestral ? "semestral" : "mensal";
          const prioridade = isSemestral ? "alta" : "media";

          const semana = semanasDoAno[semanaIdx];
          const dataPrevista = format(semana, "yyyy-MM-dd");

          ativosPorPredio[predio]?.forEach((ativo) => {
            const status = getStatusSemana(ativo, semanaIdx, prog, workOrdersMap);

            if (status.status === "pendente") {
              osToCreate.push({
                order_number: `OS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                asset_id: ativo.id,
                order_type: "preventiva",
                status: "pendente",
                priority: prioridade,
                scheduled_date: dataPrevista,
                data_prevista: dataPrevista,
                description: `Manutenção ${tipoManutencao} - Semana ${semanaIdx + 1}/${anoSelecionado}`,
                observacoes: `Plano Sistemático ${anoSelecionado} - ${predio}`,
              });
            }
          });
        });
      });

      if (osToCreate.length === 0) {
        throw new Error("Todas as OSs das semanas selecionadas já foram geradas");
      }

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < osToCreate.length; i += batchSize) {
        const { error } = await supabase
          .from("work_orders")
          .insert(osToCreate.slice(i, i + batchSize));
        if (error) throw error;
        totalGeradas += osToCreate.slice(i, i + batchSize).length;
      }

      return totalGeradas;
    },
    onSuccess: (count) => {
      toast.success(`✅ ${count} Ordens de Serviço geradas com sucesso!`);
      setSemanasParaGerar([]);
      // Invalidate apenas a query específica do ano
      queryClient.invalidateQueries({ queryKey: ["work_orders", anoSelecionado] });
    },
    onError: (error: Error) => {
      if (error.message.includes("já foram geradas")) {
        toast.info("ℹ️ " + error.message);
      } else {
        toast.error("Erro ao gerar OSs: " + error.message);
      }
    },
  });

  // Generate single OS - memoized callback
  const gerarOSLocal = useCallback(async (predio: string, semanaIdx: number, ativo: Ativo) => {
    const prog = getProgramacao(predio);
    if (!prog) return;

    const status = getStatusSemana(ativo, semanaIdx, prog, workOrdersMap);
    if (status.status !== "pendente") return;

    const isSemestral = prog.semanas_semestrais.includes(semanaIdx);
    const tipoManutencao = isSemestral ? "semestral" : "mensal";
    const prioridade = isSemestral ? "alta" : "media";

    const semana = semanasDoAno[semanaIdx];
    const dataPrevista = format(semana, "yyyy-MM-dd");

    const { error } = await supabase.from("work_orders").insert({
      order_number: `OS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      asset_id: ativo.id,
      order_type: "preventiva",
      status: "pendente",
      priority: prioridade,
      scheduled_date: dataPrevista,
      data_prevista: dataPrevista,
      description: `Manutenção ${tipoManutencao} - Semana ${semanaIdx + 1}/${anoSelecionado}`,
      observacoes: `Plano Sistemático ${anoSelecionado} - ${predio}`,
    });

    if (error) {
      toast.error("Erro ao gerar OS: " + error.message);
    } else {
      toast.success(`OS gerada para ${ativo.asset_code}`);
      // Invalidate apenas a query específica do ano
      queryClient.invalidateQueries({ queryKey: ["work_orders", anoSelecionado] });
    }
  }, [getProgramacao, workOrdersMap, semanasDoAno, anoSelecionado, queryClient]);

  // Open programacao dialog
  const abrirDialogProgramacao = (predio: string) => {
    const prog = getProgramacao(predio);
    setLocalEmEdicao(predio);
    if (prog) {
      setSemanasSelecionadas([...prog.semanas_programadas]);
      setSemanasSemestrais([...prog.semanas_semestrais]);
      setObservacoes(prog.observacoes || "");
    } else {
      setSemanasSelecionadas([]);
      setSemanasSemestrais([]);
      setObservacoes("");
    }
    setMostrarDialogProgramacao(true);
  };

  // Toggle semana in programacao dialog
  const handleToggleSemana = (semanaIdx: number) => {
    if (semanasSelecionadas.includes(semanaIdx)) {
      setSemanasSelecionadas(semanasSelecionadas.filter((s) => s !== semanaIdx));
      setSemanasSemestrais(semanasSemestrais.filter((s) => s !== semanaIdx));
    } else {
      if (semanasSelecionadas.length >= 12) {
        toast.warning("Selecione no máximo 12 semanas");
        return;
      }
      setSemanasSelecionadas([...semanasSelecionadas, semanaIdx].sort((a, b) => a - b));
    }
  };

  // Toggle semestral
  const handleToggleSemestral = (semanaIdx: number) => {
    if (!semanasSelecionadas.includes(semanaIdx)) {
      toast.warning("Selecione a semana primeiro");
      return;
    }

    if (semanasSemestrais.includes(semanaIdx)) {
      setSemanasSemestrais(semanasSemestrais.filter((s) => s !== semanaIdx));
    } else {
      if (semanasSemestrais.length >= 2) {
        toast.warning("Selecione no máximo 2 semanas semestrais");
        return;
      }
      setSemanasSemestrais([...semanasSemestrais, semanaIdx]);
    }
  };

  // Save programacao
  const salvarProgramacaoMutation = useMutation({
    mutationFn: async () => {
      if (semanasSelecionadas.length !== 12) {
        throw new Error("Selecione exatamente 12 semanas");
      }
      if (semanasSemestrais.length !== 2) {
        throw new Error("Marque exatamente 2 semanas como semestrais");
      }

      const progExistente = programacoes.find(
        (p) => p.localizacao === localEmEdicao && p.ano === anoSelecionado && p.ativa
      );

      const supabaseClient = supabase as any;
      try {
        if (progExistente) {
          await supabaseClient
            .from("programacao_manutencao")
            .update({ ativa: false })
            .eq("id", progExistente.id);

          const { error } = await supabaseClient
            .from("programacao_manutencao")
            .insert({
              localizacao: localEmEdicao,
              ano: anoSelecionado,
              semanas_programadas: semanasSelecionadas,
              semanas_semestrais: semanasSemestrais,
              observacoes: observacoes || null,
              criado_por: user?.email || "",
              ativa: true,
            });
          if (error) throw error;
        } else {
          const { error } = await supabaseClient
            .from("programacao_manutencao")
            .insert({
              localizacao: localEmEdicao,
              ano: anoSelecionado,
              semanas_programadas: semanasSelecionadas,
              semanas_semestrais: semanasSemestrais,
              observacoes: observacoes || null,
              criado_por: user?.email || "",
              ativa: true,
            });
          if (error) throw error;
        }
      } catch (err) {
        if (isSchemaCacheError(err)) {
          upsertLocalProgramacao({
            localizacao: localEmEdicao,
            ano: anoSelecionado,
            semanas_programadas: semanasSelecionadas,
            semanas_semestrais: semanasSemestrais,
            observacoes: observacoes || null,
            criado_por: user?.email || "",
            ativa: true,
          });
          return;
        }
        throw err as Error;
      }
    },
    onSuccess: () => {
      toast.success(`✅ Programação salva para ${localEmEdicao}!`);
      setMostrarDialogProgramacao(false);
      queryClient.invalidateQueries({ queryKey: ["programacoes"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      toast.error("Arquivo vazio ou inválido");
        return;
      }

    // Parse CSV (suporta ; ou , como separador)
    const separator = text.includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    
    // Procurar colunas esperadas
    const codigoIdx = headers.findIndex(h => 
      h.toLowerCase().includes('código') || 
      h.toLowerCase().includes('codigo') ||
      h.toLowerCase().includes('asset_code')
    );
    const dataIdx = headers.findIndex(h => 
      h.toLowerCase().includes('data') || 
      h.toLowerCase().includes('date') ||
      h.toLowerCase().includes('scheduled')
    );
    const descricaoIdx = headers.findIndex(h => 
      h.toLowerCase().includes('descrição') || 
      h.toLowerCase().includes('descricao') ||
      h.toLowerCase().includes('description')
    );

    if (codigoIdx === -1 || dataIdx === -1) {
      toast.error("Arquivo deve conter colunas: Código/Asset Code e Data/Date");
      return;
    }

    const dados: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
      if (values.length < headers.length) continue;

      const codigo = values[codigoIdx];
      const dataStr = values[dataIdx];
      
      if (!codigo || !dataStr) continue;

      // Tentar parsear data em vários formatos
      let data: Date | null = null;
      
      // Tentar parse direto primeiro
      data = new Date(dataStr);
      if (isNaN(data.getTime())) {
        // Tentar formatos brasileiros
        const parts = dataStr.split(/[\/\-]/);
        if (parts.length === 3) {
          // dd/MM/yyyy ou dd-MM-yyyy
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2]);
          data = new Date(year, month, day);
        }
      }

      if (!data || isNaN(data.getTime())) {
        continue; // Pular linha se data inválida
      }

      // Buscar ativo pelo código
      const ativo = ativos.find(a => 
        a.asset_code.toLowerCase() === codigo.toLowerCase() ||
        a.asset_code === codigo
      );

      if (!ativo) {
        toast.warning(`Ativo ${codigo} não encontrado`);
        continue;
      }

      dados.push({
        id: `import_${i}`,
        asset_id: ativo.id,
        asset_code: ativo.asset_code,
        asset_name: `${ativo.brand || ''} ${ativo.model || ''}`.trim() || ativo.asset_type,
        scheduled_date: format(data, 'yyyy-MM-dd'),
        data_original: dataStr,
        description: values[descricaoIdx] || `Manutenção preventiva - ${ativo.asset_code}`,
        priority: 'media',
        order_type: 'preventiva',
      });
    }

    if (dados.length === 0) {
      toast.error("Nenhum dado válido encontrado no arquivo");
      return;
    }

    setDadosImportados(dados);
    setEditandoDados([...dados]);
    setMostrarDialogImportar(true);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success(`${dados.length} registros importados. Revise e edite as datas antes de criar as OSs.`);
  };

  // Create OSs from imported data
  const criarOSsImportadasMutation = useMutation({
    mutationFn: async () => {
      const osToCreate = editandoDados.map((item) => ({
        order_number: `OS-${Date.now()}-${Math.floor(Math.random() * 10000)}-${item.id}`,
        asset_id: item.asset_id,
        order_type: item.order_type || 'preventiva',
        status: 'pendente',
        priority: item.priority || 'media',
        scheduled_date: item.scheduled_date,
        data_prevista: item.scheduled_date,
        description: item.description || `Manutenção preventiva - ${item.asset_code}`,
        observacoes: `Importado via Excel - ${format(new Date(), 'dd/MM/yyyy')}`,
      }));

      // Insert in batches
      const batchSize = 100;
      let totalCriadas = 0;
      for (let i = 0; i < osToCreate.length; i += batchSize) {
        const { error } = await supabase
          .from("work_orders")
          .insert(osToCreate.slice(i, i + batchSize));
        if (error) throw error;
        totalCriadas += osToCreate.slice(i, i + batchSize).length;
      }

      return totalCriadas;
    },
    onSuccess: (count) => {
      toast.success(`✅ ${count} Ordens de Serviço criadas com sucesso!`);
      setMostrarDialogImportar(false);
      setDadosImportados([]);
      setEditandoDados([]);
      // Invalidate apenas a query específica do ano
      queryClient.invalidateQueries({ queryKey: ["work_orders", anoSelecionado] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar OSs: " + error.message);
    },
  });

  // Update date in editing data
  const atualizarData = (id: string, novaData: string) => {
    setEditandoDados(prev => 
      prev.map(item => 
        item.id === id 
          ? { ...item, scheduled_date: novaData }
          : item
      )
    );
  };

  // Export CSV
  const handleExportarCSV = () => {
    const semanas = getWeeksOfYear(anoSelecionado);
    const dados: any[] = [];

    prediosFiltrados.forEach((predio) => {
      const prog = getProgramacao(predio);
      if (!prog) return;

      ativosPorPredio[predio]?.forEach((ativo) => {
        const linha: any = {
          Prédio: predio,
          Código: ativo.asset_code,
          Equipamento: `${ativo.brand || ""} ${ativo.model || ""}`.trim() || ativo.asset_type,
          Tipo: ativo.asset_type,
        };

        prog.semanas_programadas.forEach((semanaIdx) => {
          const status = getStatusSemana(ativo, semanaIdx, prog, workOrdersMap);
          const coluna = `S${semanaIdx + 1}`;
          linha[coluna] =
            status.status === "concluida"
              ? "OK"
              : status.status === "pendente"
              ? "PENDENTE"
              : status.status === "agendada"
              ? "AGENDADA"
              : status.status === "em_andamento"
              ? "EM_ANDAMENTO"
              : "-";
        });

        dados.push(linha);
      });
      });

    if (dados.length === 0) {
      toast.warning("Nenhum dado para exportar");
        return;
      }

    const headers = Object.keys(dados[0]);
    const csvContent = [
      headers.join(","),
      ...dados.map((row) =>
        headers.map((h) => JSON.stringify(row[h] || "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Plano_Sistematico_${anoSelecionado}_${
        localSelecionado === "todos" ? "todos" : localSelecionado.replace(/\s+/g, "_")
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exportado com sucesso!");
  };

  const isLoading = loadingAtivos || loadingProgramacoes;

  return (
    <Layout>
      <div className="space-y-4 bg-slate-50 min-h-screen relative z-0 -m-4 md:-m-8 p-4 md:p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              Planejamento Sistemático
            </h1>
            <p className="text-sm text-slate-600">
              12 manutenções/ano - Grade visual sincronizada por local
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(anoSelecionado)}
              onValueChange={(v) => setAnoSelecionado(Number(v))}
            >
              <SelectTrigger className="w-28 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2027">2027</SelectItem>
              </SelectContent>
            </Select>
            {userRole !== "tecnico" && (
              <Button
                onClick={() => setMostrarDialogCriarPlano(true)}
                className="bg-purple-600 hover:bg-purple-700 h-9 text-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Criar Novo Plano
              </Button>
            )}
            {semanasParaGerar.length > 0 && (
              <Button
                onClick={() => {
                  setGerandoOS(true);
                  gerarOSMutation.mutate();
                  setTimeout(() => setGerandoOS(false), 2000);
                }}
                disabled={gerandoOS}
                className="bg-green-600 hover:bg-green-700 h-9 text-sm"
              >
                {gerandoOS ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                )}
                Gerar OSs p/ {semanasParaGerar.length} Sem ({contarOSPendentes})
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setMostrarDialogImportar(true)}
              className="h-9 text-sm"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Importar Excel
            </Button>
            <Button variant="outline" onClick={handleExportarCSV} className="h-9 text-sm">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-3 md:grid-cols-5 mb-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-600 opacity-60 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-600">Equipamentos</p>
                  <p className="text-xl font-bold text-blue-900">
                    {estatisticas.totalEquipamentos}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-purple-600 opacity-60 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-purple-600">Manutenções</p>
                  <p className="text-xl font-bold text-purple-900">
                    {estatisticas.totalManutencoes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600 opacity-60 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-green-600">Concluídas</p>
                  <p className="text-xl font-bold text-green-900">
                    {estatisticas.concluidas}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-yellow-600 opacity-60 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-600">Pendentes</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {estatisticas.pendentes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-none shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-indigo-600 opacity-60 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-indigo-600">Locais Programados</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {estatisticas.locaisComProgramacao}/{prediosFiltrados.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
            <span className="text-sm font-medium">🔍 Filtrar:</span>
            <Select value={localSelecionado} onValueChange={setLocalSelecionado}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Todos os Prédios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">📍 Todos os Prédios</SelectItem>
                {prediosDisponiveis.map((predio) => (
                  <SelectItem key={predio} value={predio}>
                    📍 {predio} ({ativosPorPredio[predio]?.length || 0} equip.)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {semanasParaGerar.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSemanasParaGerar([])}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Seleção ({semanasParaGerar.length})
                        </Button>
          )}
                      </div>

        {/* Main Grid */}
        <TooltipProvider>
          {isLoading && ativos.length === 0 ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <div className="space-y-6">
              {prediosFiltrados.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Nenhum prédio encontrado. Verifique se há ativos cadastrados.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                prediosFiltrados.map((predio) => {
              const prog = getProgramacao(predio);
              const ativosLocal = ativosPorPredio[predio] || [];

              return (
                <Card
                  key={predio}
                  className="border-slate-200 bg-white shadow-sm mb-4"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-slate-200 py-2">
                    <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <CardTitle className="text-lg font-bold text-slate-900">
                          {predio}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs font-normal">
                          {ativosLocal.length} equipamentos
                        </Badge>
                        {prog && (
                          <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                            <Settings className="w-3 h-3 mr-1" />
                            Programado
                          </Badge>
                        )}
                          </div>
                      {userRole !== "tecnico" && (
                        <Button
                          size="sm"
                          onClick={() => abrirDialogProgramacao(predio)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
                        >
                          <Settings className="h-3 w-3 mr-1.5" />
                          Programar Semanas
                        </Button>
                      )}
                        </div>
                  </CardHeader>
                  <CardContent className="p-0">
                        <div className="overflow-x-auto relative md:max-w-[calc(100vw-16rem-4rem)]">
                          <div className="min-w-[2800px]">
                        {/* Header Row */}
                        <div className="grid gap-0.5 bg-slate-100 p-1 sticky top-0 z-[5]" style={{ gridTemplateColumns: '60px 150px 80px repeat(52, 40px)' }}>
                          <div className="font-bold text-slate-900 text-[10px] sticky left-0 bg-slate-100 z-[6] border-r pr-1">
                            Cód
                            </div>
                          <div className="font-bold text-slate-900 text-[10px] sticky left-[60px] bg-slate-100 z-[6] border-r pr-1">
                            Equipamento
                          </div>
                          <div className="font-bold text-slate-900 text-[10px]">Tipo</div>
                          {semanasDoAno.map((semana, idx) => {
                            const isSemestral =
                              prog?.semanas_semestrais.includes(idx) || false;
                            const isSelecionada = semanasParaGerar.includes(idx);

                              return (
                              <div
                                key={idx}
                                className={`text-center text-[10px] font-bold py-1 ${
                                  isSelecionada
                                    ? "bg-blue-200 border-blue-500 border-2"
                                    : "bg-slate-100"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                  <Checkbox
                                    checked={isSelecionada}
                                    onCheckedChange={() => handleToggleSemanaGerar(idx)}
                                    className="h-2.5 w-2.5"
                                  />
                                  <span className="text-[10px]">S{idx + 1}</span>
                                </div>
                                <div className="text-[9px] font-normal text-slate-500">
                                  {format(semana, "dd/MM")}
                                </div>
                                {isSemestral && (
                                  <div className="text-[9px] font-bold text-purple-700 mt-0.5">
                                    SEM
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                        {/* Data Rows */}
                        {ativosLocal.map((ativo) => (
                          <div
                            key={ativo.id}
                            className="grid gap-0.5 p-0.5 border-b hover:bg-slate-50"
                            style={{ gridTemplateColumns: '60px 150px 80px repeat(52, 40px)' }}
                          >
                            <div className="text-[10px] font-medium sticky left-0 bg-white z-[4] border-r pr-1 py-0.5">
                              {ativo.asset_code}
                                </div>
                            <div className="text-[10px] sticky left-[60px] bg-white z-[4] border-r pr-1 py-0.5">
                              <div className="font-medium text-slate-900 leading-tight">
                                {ativo.brand || ""} {ativo.model || ""}
                            </div>
                              <div className="text-[10px] text-slate-500">{ativo.asset_type}</div>
                          </div>
                            <div className="flex items-center py-1">
                              <Badge variant="outline" className="text-[10px] font-normal px-1 py-0">
                                {ativo.asset_type}
                              </Badge>
                        </div>
                            {semanasDoAno.map((semana, idx) => {
                              const status = getStatusSemana(ativo, idx, prog, workOrdersMap);
                              const isSelecionada = semanasParaGerar.includes(idx);
                              const tooltipText = 
                                status.status === "pendente"
                                  ? `Clique para Gerar OS ${status.tipo?.toUpperCase() || "MENSAL"}`
                                  : status.status === "agendada" && status.os_number
                                  ? `OS ${status.os_number} - agendada`
                                  : status.status === "em_andamento" && status.os_number
                                  ? `OS ${status.os_number} - em andamento`
                                  : status.status === "concluida" && status.os_number
                                  ? `OS ${status.os_number} - concluída`
                                  : status.status === "vazio"
                                  ? "Fora do Cronograma"
                                  : "";

                              return (
                                <Tooltip key={idx}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`h-6 w-6 flex items-center justify-center rounded transition-all ${
                                        status.status === "pendente" ? "cursor-pointer" : "cursor-default"
                                      } ${
                                        isSelecionada
                                          ? "bg-blue-200 border-2 border-blue-500"
                                          : status.status === "concluida"
                                          ? "bg-green-500 hover:bg-green-600 text-white"
                                          : status.status === "em_andamento"
                                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                                          : status.status === "agendada"
                                          ? "bg-orange-400 hover:bg-orange-500 text-white"
                                          : status.status === "pendente"
                                          ? "bg-yellow-400 hover:bg-yellow-500 text-white"
                                          : "bg-gray-100"
                                      }`}
                                        onClick={() => {
                                          if (status.status === "pendente") {
                                            gerarOSLocal(predio, idx, ativo);
                                          }
                                        }}
                                      title={tooltipText}
                                    >
                                      {status.status === "concluida" && (
                                        <span className="font-bold text-xs">✓</span>
                                      )}
                                      {status.status === "em_andamento" && (
                                        <span className="font-bold text-xs">⟳</span>
                                      )}
                                      {status.status === "agendada" && (
                                        <span className="font-bold text-xs">○</span>
                                      )}
                                      {status.status === "pendente" && (
                                        <span
                                          className={`font-bold ${
                                            status.tipo === "semestral"
                                              ? "text-xs"
                                              : "text-[10px]"
                                          }`}
                                        >
                                          {status.tipo === "semestral" ? "S!" : "M!"}
                                        </span>
                                      )}
                      </div>
                                  </TooltipTrigger>
                                  {tooltipText && (
                                    <TooltipContent>
                                      <p>{tooltipText}</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })
              )}
            </div>
          )}
        </TooltipProvider>

        {/* Legend */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-green-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                  ✓
                </div>
                <span className="text-xs">Concluída</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-blue-500 rounded flex items-center justify-center text-white text-[10px] font-bold">
                  ⟳
                </div>
                <span className="text-xs">Em Andamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-orange-400 rounded flex items-center justify-center text-white text-[10px] font-bold">
                  ○
                </div>
                <span className="text-xs">OS Criada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-yellow-400 rounded flex items-center justify-center text-white text-[10px] font-bold">
                  M!
                </div>
                <span className="text-xs">Mensal Pendente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-yellow-400 rounded flex items-center justify-center text-white text-[10px] font-bold">
                  S!
                </div>
                <span className="text-xs">Semestral Pendente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-5 w-5 bg-gray-100 rounded"></div>
                <span className="text-xs">Fora do Cronograma</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Criar Novo Plano */}
      <Dialog open={mostrarDialogCriarPlano} onOpenChange={setMostrarDialogCriarPlano}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano para {anoSelecionado}</DialogTitle>
            <DialogDescription>
              O que será criado:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Programação padrão para {prediosDisponiveis.length} prédios</li>
                <li>12 semanas de manutenção por prédio</li>
                <li>10 mensais + 2 semestrais</li>
                <li>Você poderá personalizar depois</li>
              </ul>
                  </div>
            <div>
              <p className="text-sm font-medium mb-2">
                Prédios que receberão programação:
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {prediosDisponiveis.map((predio) => {
                  const existe = programacoes.some(
                    (p) => p.localizacao === predio && p.ano === anoSelecionado && p.ativa
                  );
                  return (
                    <div
                      key={predio}
                      className="flex items-center justify-between p-2 bg-white rounded border"
                    >
                      <span className="text-sm">
                        📍 {predio} ({ativosPorPredio[predio]?.length || 0} equip.)
                      </span>
                      {existe ? (
                        <Badge variant="outline">Já existe</Badge>
                      ) : (
                        <Badge className="bg-green-500">✓</Badge>
                      )}
                        </div>
                  );
                })}
                      </div>
                  </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarDialogCriarPlano(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => criarPlanoMutation.mutate()}
              disabled={criarPlanoMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {criarPlanoMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Programar Semanas */}
      <Dialog
        open={mostrarDialogProgramacao}
        onOpenChange={setMostrarDialogProgramacao}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Programar Manutenções - {localEmEdicao}</DialogTitle>
            <DialogDescription>
              Selecione exatamente 12 semanas. Marque 2 como semestrais (mais completas).
              As outras 10 serão mensais (manutenções rápidas). Todos os equipamentos deste prédio seguirão esta programação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2 overflow-x-auto" style={{ gridTemplateColumns: 'repeat(52, minmax(100px, 1fr))' }}>
              {semanasDoAno.map((semana, idx) => {
                const isSelecionada = semanasSelecionadas.includes(idx);
                const isSemestral = semanasSemestrais.includes(idx);

                return (
                  <div
                    key={idx}
                    className={`p-2 rounded border-2 transition-all ${
                      isSelecionada
                        ? isSemestral
                          ? "bg-purple-200 border-purple-500"
                          : "bg-blue-200 border-blue-500"
                        : "bg-gray-100 border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Checkbox
                        checked={isSelecionada}
                        onCheckedChange={() => handleToggleSemana(idx)}
                        className="h-4 w-4"
                      />
                      <span className="text-xs font-bold">S{idx + 1}</span>
                  </div>
                    <div className="text-[10px] text-slate-600 mb-1">
                      {format(semana, "dd/MM")}
                    </div>
                    {isSelecionada && (
                      <Button
                        size="sm"
                        variant={isSemestral ? "default" : "outline"}
                        className="w-full h-6 text-xs"
                        onClick={() => handleToggleSemestral(idx)}
                      >
                        {isSemestral ? "SEM" : "MEN"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Selecionadas: </span>
                  <span className="font-bold">
                    {semanasSelecionadas.length}/12{" "}
                    {semanasSelecionadas.length === 12 ? "✓" : ""}
                    </span>
                  </div>
                <div>
                  <span className="font-medium">Semestrais: </span>
                  <span className="font-bold">
                    {semanasSemestrais.length}/2{" "}
                    {semanasSemestrais.length === 2 ? "✓" : ""}
                    </span>
                  </div>
                <div>
                  <span className="font-medium">Mensais: </span>
                  <span className="font-bold">
                    {semanasSelecionadas.length - semanasSemestrais.length}/10{" "}
                    {semanasSelecionadas.length - semanasSemestrais.length === 10
                      ? "✓"
                      : ""}
                    </span>
                  </div>
                </div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Equipamentos afetados: </span>
                <span className="font-bold">
                  {ativosPorPredio[localEmEdicao]?.length || 0}
                </span>
          </div>
        </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Observações (opcional):
              </label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Programação ajustada para otimizar visitas..."
                rows={3}
              />
      </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarDialogProgramacao(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => salvarProgramacaoMutation.mutate()}
              disabled={salvarProgramacaoMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {salvarProgramacaoMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Salvar Programação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Importar Excel */}
      <Dialog open={mostrarDialogImportar} onOpenChange={setMostrarDialogImportar}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Ordens de Serviço do Excel</DialogTitle>
            <DialogDescription>
              Revise e edite as datas antes de criar as OSs. Formato esperado: Código/Asset Code, Data/Date, Descrição (opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileImport}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                {editandoDados.length} registros
              </span>
            </div>

            {editandoDados.length > 0 && (
              <div className="border rounded-lg overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Data Prevista</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Prioridade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editandoDados.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.asset_code}</TableCell>
                        <TableCell>{item.asset_name}</TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={item.scheduled_date}
                            onChange={(e) => atualizarData(item.id, e.target.value)}
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              setEditandoDados(prev =>
                                prev.map(i =>
                                  i.id === item.id
                                    ? { ...i, description: e.target.value }
                                    : i
                                )
                              );
                            }}
                            className="w-64"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.priority}
                            onValueChange={(value) => {
                              setEditandoDados(prev =>
                                prev.map(i =>
                                  i.id === item.id
                                    ? { ...i, priority: value }
                                    : i
                                )
                              );
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="baixa">Baixa</SelectItem>
                              <SelectItem value="media">Média</SelectItem>
                              <SelectItem value="alta">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {editandoDados.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione um arquivo CSV ou Excel para importar</p>
                <p className="text-xs mt-2">
                  Formato: Código, Data (dd/MM/yyyy), Descrição (opcional)
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMostrarDialogImportar(false);
                setDadosImportados([]);
                setEditandoDados([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => criarOSsImportadasMutation.mutate()}
              disabled={criarOSsImportadasMutation.isPending || editandoDados.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {criarOSsImportadasMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Criar {editandoDados.length} OSs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
