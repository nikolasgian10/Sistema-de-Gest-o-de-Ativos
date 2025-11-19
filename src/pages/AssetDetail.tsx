import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FormularioCadastro from "@/components/ativos/FormularioCadastro";
import { ArrowLeft, Edit, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AssetChecklistEditor from "@/components/ativos/AssetChecklistEditor";
import { generateAssetCode, isUniqueViolation } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  operacional: "bg-accent text-accent-foreground",
  manutencao: "bg-warning text-warning-foreground",
  quebrado: "bg-destructive text-destructive-foreground",
  desativado: "bg-muted text-muted-foreground",
  inativo: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  operacional: "Operacional",
  manutencao: "Em Manutenção",
  quebrado: "Quebrado",
  desativado: "Desativado",
  inativo: "Inativo",
};

const typeLabels: Record<string, string> = {
  ar_condicionado: "Ar Condicionado",
  mecalor: "Mecalor",
  ar_maquina: "Ar Máquina",
  chiller: "Chiller",
  split: "Split",
  outro: "Outro",
};

interface Asset {
  id: string;
  asset_code: string;
  asset_type: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  location: string;
  sector: string | null;
  capacity: string | null;
  operational_status: string;
  installation_date: string | null;
  maintenance_frequency: string | null;
  warranty_expiration: string | null;
  last_maintenance: string | null;
  purchase_cost: number | null;
  technical_specs: string | null;
  notes: string | null;
  bem_patrimonial?: string | null;
  sigla_local?: string | null;
  altura_option?: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAsset();
    }
  }, [id]);

  useEffect(() => {
    if (searchParams.get("edit") === "1") {
      setIsEditing(true);
    }
  }, [searchParams]);

  const fetchAsset = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setAsset(data);
    } catch (error: any) {
      console.error("Error fetching asset:", error);
      toast.error("Erro ao carregar ativo: " + (error?.message || "Erro desconhecido"));
      navigate("/ativos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!asset) return;

    try {
      setIsSubmitting(true);
      const updateData: any = {
        ...formData,
        sigla_local: formData.sigla_local?.trim?.() || null,
        bem_patrimonial: formData.bem_patrimonial && formData.bem_patrimonial !== 'none' ? formData.bem_patrimonial?.trim() : null,
        altura_option: formData.altura_option && formData.altura_option !== 'none' ? formData.altura_option : null,
      };

      // Normalizar e validar tipo (mesma lógica usada ao criar)
      let newType = updateData.asset_type;
      if (newType === 'chiller' || newType === 'split' || newType === 'outro') {
        newType = 'ar_condicionado';
        updateData.asset_type = newType;
      }

      // Verificar se algum dos campos que compõem o código mudou
      const fieldsToCompare = ['asset_type', 'sigla_local', 'sector', 'altura_option', 'bem_patrimonial'];
      const composingChanged = fieldsToCompare.some((f) => {
        const newVal = (updateData as any)[f] ?? (asset as any)[f];
        const oldVal = (asset as any)[f];
        return String(newVal ?? '').trim() !== String(oldVal ?? '').trim();
      });

      // Normalizar campos de data e numéricos: não envie string vazia para colunas DATE/NUMERIC
      const dateFields = ['installation_date', 'warranty_expiration', 'last_maintenance'];
      dateFields.forEach((df) => {
        if (updateData[df] === "" || updateData[df] === undefined) {
          updateData[df] = null;
        }
      });

      if (updateData.purchase_cost === "" || updateData.purchase_cost === undefined) {
        updateData.purchase_cost = null;
      } else if (updateData.purchase_cost !== null) {
        const n = Number(String(updateData.purchase_cost).replace(',', '.'));
        updateData.purchase_cost = Number.isFinite(n) ? n : null;
      }

      // Campos textuais opcionais: normalize empty -> null
      const textOptionals = ['maintenance_frequency', 'technical_specs', 'notes'];
      textOptionals.forEach((t) => {
        if (updateData[t] === "" || updateData[t] === undefined) updateData[t] = null;
      });

      // Se o usuário não editou manualmente o asset_code (ou deixou igual ao anterior) e os campos
      // que compõem o código mudaram, gere um novo código automaticamente.
      if (( !formData.asset_code || String(formData.asset_code).trim() === String(asset.asset_code).trim() ) && composingChanged) {
        updateData.asset_code = generateAssetCode(
          updateData.asset_type || asset.asset_type,
          updateData.sigla_local ?? asset.sigla_local,
          updateData.sector ?? asset.sector,
          updateData.altura_option ?? asset.altura_option,
          updateData.bem_patrimonial ?? asset.bem_patrimonial
        );
      } else if (formData.asset_code && String(formData.asset_code).trim() !== String(asset.asset_code).trim()) {
        // Usuário especificou código manualmente
        updateData.asset_code = String(formData.asset_code).trim();
      }

      // Tentar atualizar com retry em caso de violação de unique constraint do asset_code
      // e tentar novamente sem `last_maintenance` se o PostgREST reclamar que a coluna não existe.
      let attempts = 0;
      let lastError: any = null;
      const removedColumns = new Set<string>();
      while (attempts < 5) {
        attempts++;
        const { error } = await supabase.from("assets").update(updateData).eq("id", asset.id);
        if (!error) {
          lastError = null;
          break;
        }
        lastError = error;

        // Se for violação de unique constraint, gere outro código e continue
        if (isUniqueViolation(error)) {
          updateData.asset_code = generateAssetCode(
            updateData.asset_type || asset.asset_type,
            updateData.sigla_local ?? asset.sigla_local,
            updateData.sector ?? asset.sector,
            updateData.altura_option ?? asset.altura_option,
            (updateData.bem_patrimonial ?? asset.bem_patrimonial) ? String(updateData.bem_patrimonial ?? asset.bem_patrimonial).trim() + `-${attempts}` : undefined
          );
          continue;
        }

        // Se o PostgREST reclamar que uma coluna não existe (ex: "Could not find the 'X' column..."),
        // remova essa coluna do payload e tente novamente. Isso permite salvar mesmo sem aplicar todas as migrations.
        const msg = String(error?.message || error?.error || error?.details || '');
        const missingColMatch = msg.match(/Could not find the '([^']+)' column/i);
        if (missingColMatch) {
          const col = missingColMatch[1];
          if (!removedColumns.has(col)) {
            removedColumns.add(col);
            delete (updateData as any)[col as any];
            continue;
          }
        }
        // Também aceite identificação via código PGRST204 ou menções diretas (fallback):
        const lower = msg.toLowerCase();
        if (!removedColumns.has('last_maintenance') && (lower.includes('pgrst204') && lower.includes('last_maintenance'))) {
          removedColumns.add('last_maintenance');
          delete (updateData as any).last_maintenance;
          continue;
        }

        // outro erro: parar e repassar
        break;
      }

      if (lastError) throw lastError;

      toast.success("Ativo atualizado com sucesso!");
      setIsEditing(false);
      await fetchAsset(); // Recarrega os dados
    } catch (error: any) {
      console.error("Error updating asset:", error);
      toast.error("Erro ao atualizar ativo: " + (error?.message || "Erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!asset) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("assets")
        .delete()
        .eq("id", asset.id);

      if (error) throw error;

      toast.success("Ativo excluído com sucesso!");
      navigate("/ativos");
    } catch (error: any) {
      console.error("Error deleting asset:", error);
      toast.error("Erro ao excluir ativo: " + (error?.message || "Erro desconhecido"));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!asset) {
    return (
      <Layout>
        <div className="p-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ativo não encontrado</h3>
              <Button onClick={() => navigate("/ativos")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Ativos
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isEditing) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Editar Ativo</h1>
              <p className="text-muted-foreground mt-1">
                Atualize as informações do ativo {asset.asset_code}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações do Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioCadastro
                onSubmit={handleUpdate}
                initialData={asset}
                isLoading={isSubmitting}
              />
            </CardContent>
          </Card>

          <AssetChecklistEditor assetId={asset.id} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/ativos")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Ativos
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{asset.asset_code}</h1>
            <p className="text-muted-foreground mt-1">
              Detalhes completos do equipamento
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o ativo <strong>{asset.asset_code}</strong>?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informações Básicas</span>
                <Badge className={statusColors[asset.operational_status]}>
                  {statusLabels[asset.operational_status]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Código do Ativo</p>
                <p className="font-medium">{asset.asset_code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">
                  {typeLabels[asset.asset_type] || asset.asset_type}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Localização</p>
                <p className="font-medium">{asset.location}</p>
              </div>
              {asset.sigla_local && (
                <div>
                  <p className="text-sm text-muted-foreground">Sigla do Local</p>
                  <p className="font-medium">{asset.sigla_local}</p>
                </div>
              )}
              {asset.sector && (
                <div>
                  <p className="text-sm text-muted-foreground">Setor</p>
                  <p className="font-medium">{asset.sector}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especificações Técnicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.brand && (
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{asset.brand}</p>
                </div>
              )}
              {asset.model && (
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{asset.model}</p>
                </div>
              )}
              {asset.serial_number && (
                <div>
                  <p className="text-sm text-muted-foreground">Número de Série</p>
                  <p className="font-medium">{asset.serial_number}</p>
                </div>
              )}
              {asset.capacity && (
                <div>
                  <p className="text-sm text-muted-foreground">Capacidade</p>
                  <p className="font-medium">{asset.capacity}</p>
                </div>
              )}
              {asset.altura_option && (
                <div>
                  <p className="text-sm text-muted-foreground">Altura</p>
                  <p className="font-medium">{asset.altura_option}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.maintenance_frequency && (
                <div>
                  <p className="text-sm text-muted-foreground">Frequência</p>
                  <p className="font-medium capitalize">{asset.maintenance_frequency}</p>
                </div>
              )}
              {asset.last_maintenance && (
                <div>
                  <p className="text-sm text-muted-foreground">Última Manutenção</p>
                  <p className="font-medium">
                    {new Date(asset.last_maintenance).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
              {asset.installation_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Instalação</p>
                  <p className="font-medium">
                    {new Date(asset.installation_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
              {asset.warranty_expiration && (
                <div>
                  <p className="text-sm text-muted-foreground">Garantia até</p>
                  <p className="font-medium">
                    {new Date(asset.warranty_expiration).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.purchase_cost && (
                <div>
                  <p className="text-sm text-muted-foreground">Custo de Aquisição</p>
                  <p className="font-medium">
                    R$ {asset.purchase_cost.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              )}
              {asset.bem_patrimonial && (
                <div>
                  <p className="text-sm text-muted-foreground">Bem Patrimonial</p>
                  <p className="font-medium">{asset.bem_patrimonial}</p>
                </div>
              )}
              {asset.technical_specs && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Especificações Técnicas</p>
                  <p className="text-sm whitespace-pre-wrap">{asset.technical_specs}</p>
                </div>
              )}
              {asset.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{asset.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick summary section placeholder for checklist count; can be enhanced to list items */}
          <Card>
            <CardHeader>
              <CardTitle>Checklist de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Gerencie o checklist clicando em Editar.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

