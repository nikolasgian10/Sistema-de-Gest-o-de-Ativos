import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Database, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ChecklistItem = {
  id: string;
  label: string;
  type: "verificacao" | "texto";
};

type AssetChecklist = {
  id?: string;
  asset_id: string;
  name: string;
  items: ChecklistItem[];
  created_at?: string;
};

type Props = {
  assetId: string;
};

export default function AssetChecklistEditor({ assetId }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<AssetChecklist>({ asset_id: assetId, name: "", items: [] });

  // Função para salvar no Supabase
  const saveToSupabase = async (checklistData: AssetChecklist) => {
    const dataToSave = {
      asset_id: assetId,
      name: checklistData.name.trim(),
      items: checklistData.items || [],
    };

    if (checklistData.id) {
      // Atualizar existente
      const { error } = await supabase
        .from('asset_checklists')
        .update(dataToSave)
        .eq('id', checklistData.id);

      if (error) throw error;
      return checklistData.id;
    } else {
      // Criar novo
      const { data, error } = await supabase
        .from('asset_checklists')
        .insert([dataToSave])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    }
  };

  // Função para carregar do Supabase com fallback para localStorage
  const loadChecklist = async () => {
    setLoading(true);
    try {
      // Tentar carregar do Supabase primeiro
      const { data, error } = await supabase
        .from('asset_checklists')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // Converter do formato do banco para o formato do componente
        setChecklist({
          id: data.id,
          asset_id: data.asset_id,
          name: data.name,
          items: Array.isArray(data.items) ? data.items : [],
          created_at: data.created_at,
        });
        setLoading(false);
        return;
      }

      // Se não encontrou no Supabase, tentar localStorage (migração de dados antigos)
      try {
        const stored = localStorage.getItem(`checklist_${assetId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setChecklist(parsed);
          // Tentar migrar para o Supabase
          if (parsed.items && parsed.items.length > 0) {
            try {
              await saveToSupabase(parsed);
            } catch (migrateError) {
              console.error("Erro ao migrar para Supabase:", migrateError);
            }
          }
        }
      } catch (localError) {
        console.error("Erro ao carregar do localStorage:", localError);
      }
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
      // Fallback para localStorage
      try {
        const stored = localStorage.getItem(`checklist_${assetId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setChecklist(parsed);
        }
      } catch (localError) {
        console.error("Erro ao carregar do localStorage:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChecklist();
  }, [assetId]);

  const safeId = () => {
    try {
      // Some environments might not have crypto.randomUUID
      return (crypto as any)?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    } catch {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    }
  };

  const addItem = () => {
    setChecklist((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: safeId(), label: "", type: "verificacao" },
      ],
    }));
  };

  const updateItem = (idx: number, field: keyof ChecklistItem, value: string) => {
    setChecklist((prev) => {
      const next = [...prev.items];
      next[idx] = { ...next[idx], [field]: value } as ChecklistItem;
      return { ...prev, items: next };
    });
  };

  const removeItem = (idx: number) => {
    setChecklist((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    if (!checklist.name.trim()) {
      toast.error("Informe o nome do checklist");
      return;
    }
    setSaving(true);
    try {
      // Preparar dados para salvar
      const checklistToSave: AssetChecklist = {
        ...checklist,
        asset_id: assetId,
        name: checklist.name.trim(),
        items: checklist.items || [],
      };

      // Tentar salvar no Supabase
      try {
        const savedId = await saveToSupabase(checklistToSave);
        checklistToSave.id = savedId;
        checklistToSave.created_at = checklistToSave.created_at || new Date().toISOString();
        
        // Atualizar estado com o ID retornado
        setChecklist(checklistToSave);
        
        // Também salvar no localStorage como backup
        localStorage.setItem(`checklist_${assetId}`, JSON.stringify(checklistToSave));
        
        toast.success("Checklist salvo com sucesso no banco de dados!");
      } catch (supabaseError: any) {
        console.error("Erro ao salvar no Supabase:", supabaseError);
        
        // Fallback: salvar apenas no localStorage
        const fallbackData = {
          ...checklistToSave,
          id: checklistToSave.id || safeId(),
          created_at: checklistToSave.created_at || new Date().toISOString(),
        };
        localStorage.setItem(`checklist_${assetId}`, JSON.stringify(fallbackData));
        setChecklist(fallbackData);
        
        toast.warning("Salvo localmente. Erro ao conectar com o banco de dados.");
      }
    } catch (err: any) {
      console.error("Erro ao salvar checklist:", err);
      toast.error(`Falha ao salvar checklist: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Checklist de Manutenção
          {loading && <span className="text-xs text-muted-foreground">(carregando...)</span>}
        </CardTitle>
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded mt-2">
          <CheckCircle className="h-3 w-3" />
          <span>Conectado ao banco de dados - dados salvos automaticamente</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Checklist */}
        <div className="border rounded-lg p-6 bg-muted/30">
          <p className="text-sm font-medium mb-4">Tipo de Checklist</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
              type="button"
              className="rounded-lg border bg-background p-6 text-center hover:bg-muted transition-colors"
              onClick={() => {
                // Template padrão baseado no exemplo enviado
                const itens = [
                  "VERIFICAR INSUFLAÇÃO NO AMBIENTE",
                  "REALIZAR LIMPEZA DOS FILTROS DE AR",
                  "LIMPEZA DO EQUIPAMENTO",
                  "INSPECIONAR LIMPEZA DOS REGISTROS DE AR EXTERIOR E ATUADORES",
                  "INSPECIONAR LIMPEZA DOS UMIDIFICADORES",
                  "INSPECIONAR BANDEJAS DE CONDENSADOS E SUPERFÍCIES ADJACENTES ÚMIDAS",
                  "INSPECIONAR A LIMPEZA DAS HÉLICES E DO MOTOR",
                  "INSPECIONAR A LIMPEZA DAS VENEZIANAS E A INTEGRIDADE FÍSICA",
                  "INSPECIONAR INFILTRAÇÃO OU ACÚMULO DE ÁGUA NO AMBIENTE",
                  "VERIFICAR ESTADO DE CONSERVAÇÃO DO EQUIPAMENTO",
                  "INSPECIONAR A FIXAÇÃO DO EQUIPAMENTO",
                  "VERIFICAR OS SENSORES UTILIZADOS PARA CONTROLE DE VAZÃO DE AR",
                  "INSPECIONAR O FUNCIONAMENTO DO MOTOR E TURBINAS DE HÉLICE",
                  "VERIFICAR SERPENTINAS E ELIMINADORES DE GOTAS",
                ];
                setChecklist((prev) => ({
                  ...prev,
                  name: prev.name || "MP-0266R - AR CONDICIONADO JANELA (Mensal)",
                  items: itens.map((label) => ({ id: safeId(), label, type: "verificacao" })),
                }));
              }}
            >
              <p className="font-semibold">Usar Template</p>
              <p className="text-xs text-muted-foreground">Checklist padrão do sistema</p>
            </button>
            <div className="rounded-lg p-6 text-center bg-purple-600 text-white">
              <p className="font-semibold">Criar Personalizado</p>
              <p className="text-xs opacity-80">Checklist específico</p>
            </div>
          </div>
        </div>

        {/* Nome do Checklist */}
        <div>
          <label className="text-sm font-medium">Nome do Checklist *</label>
          <Input value={checklist.name} onChange={(e) => setChecklist((c) => ({ ...c, name: e.target.value }))} placeholder="Ex.: Preventiva Trimestral" className="mt-1" />
        </div>

        {/* Itens do Checklist */}
        <div className="border-2 border-dashed rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Itens do Checklist ({checklist.items.length})</p>
            <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar Item
            </Button>
          </div>

          <div className="space-y-3">
            {checklist.items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-600 text-white text-sm font-semibold">
                  {idx + 1}
                </div>
                <Input
                  value={item.label}
                  onChange={(e) => updateItem(idx, "label", e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                  className="flex-1"
                />
                <Select value={item.type} onValueChange={(v) => updateItem(idx, "type", v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verificacao">Verificação</SelectItem>
                    <SelectItem value="texto">Texto</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {checklist.items.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar Checklist"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}


