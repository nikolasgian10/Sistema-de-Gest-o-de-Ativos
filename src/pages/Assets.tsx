import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Package, Download, Clock, QrCode, Pencil, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import FormularioCadastro from "@/components/ativos/FormularioCadastro";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import QRCodeModal from "@/components/ativos/QRCodeModal";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateAssetCode, isUniqueViolation } from "@/lib/utils";

// generateAssetCode moved to utils and imported above

interface Asset {
  id: string;
  asset_code: string;
  asset_type: string;
  brand: string;
  model: string;
  location: string;
  operational_status: string;
  qr_code?: string | null;
  sigla_local?: string | null;
  bem_patrimonial?: string | null;
  altura_option?: string | null;
}

const statusColors: Record<string, string> = {
  operacional: "bg-accent text-accent-foreground",
  manutencao: "bg-warning text-warning-foreground",
  quebrado: "bg-destructive text-destructive-foreground",
  desativado: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  operacional: "Operacional",
  manutencao: "Em Manutenção",
  quebrado: "Quebrado",
  desativado: "Desativado",
};

const typeLabels: Record<string, string> = {
  ar_condicionado: "Ar Condicionado",
  mecalor: "Mecalor",
  ar_maquina: "Ar Máquina",
};

export default function Assets() {
  const navigate = useNavigate();
  const [qrAsset, setQrAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Insere um ativo com retry (em caso de violação de unique constraint gera novo código e tenta novamente)
  async function insertWithRetry(asset: any, maxAttempts = 5) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        const { data: insertedData, error } = await supabase.from('assets').insert([asset]).select();
        if (error) throw error;
        return { insertedData, error: null };
      } catch (err: any) {
        if (isUniqueViolation(err)) {
          // gerar novo código e tentar novamente
          asset.asset_code = generateAssetCode(asset.asset_type, asset.sigla_local, asset.location, asset.altura_option, asset.bem_patrimonial);
          // loop continuará e tentará novamente
          continue;
        }
        return { insertedData: null, error: err };
      }
    }
    return { insertedData: null, error: new Error('Max attempts reached when inserting asset (possible duplicate).') };
  }

  const exportarAtivos = () => {
    const rows = [
      ['Código', 'Tipo', 'Marca', 'Modelo', 'Localização', 'Status'],
      ...assets.map(a => [
        a.asset_code,
        a.asset_type,
        a.brand || '',
        a.model || '',
        a.location,
        a.operational_status
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ativos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const filteredAssets = assets.filter(
    (asset) =>
      asset.asset_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Ativos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie todos os equipamentos de climatização
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')}>
              Lista
            </Button>
            <Button variant={viewMode === 'cards' ? 'default' : 'outline'} onClick={() => setViewMode('cards')}>
              Cartões
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Ativo
            </Button>
            <Button variant="outline" onClick={exportarAtivos} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar em Massa
            </Button>
          </div>
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>Cadastrar Novo Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <FormularioCadastro
                onSubmit={async (data) => {
                  try {
                    setIsSubmitting(true);
                    
                    // Obter usuário atual
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      throw new Error('Usuário não autenticado');
                    }

                    // Obter perfil do usuário para pegar o ID
                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('id', user.id)
                      .single();

                    // Validar asset_type (a tabela só aceita: 'ar_condicionado', 'mecalor', 'ar_maquina')
                    const validAssetTypes = ['ar_condicionado', 'mecalor', 'ar_maquina'];
                    let assetType = data.asset_type;
                    
                    // Mapear tipos inválidos para válidos
                    if (assetType === 'chiller' || assetType === 'split' || assetType === 'outro') {
                      assetType = 'ar_condicionado'; // Default para ar_condicionado
                    }
                    
                    if (!validAssetTypes.includes(assetType)) {
                      throw new Error(`Tipo de ativo inválido: ${assetType}. Use: ar_condicionado, mecalor ou ar_maquina`);
                    }

                    // Preparar dados para inserção (apenas campos válidos da tabela)
                    const assetData: any = {
                      asset_code: data.asset_code?.trim(),
                      asset_type: assetType,
                      brand: data.brand?.trim() || null,
                      model: data.model?.trim() || null,
                      serial_number: data.serial_number?.trim() || null,
                      location: data.location?.trim(),
                      sector: data.sector?.trim() || null,
                      sigla_local: data.sigla_local?.trim() || null,
                      bem_patrimonial: data.bem_patrimonial?.trim() || null,
                      altura_option: data.altura_option && data.altura_option !== 'none' ? data.altura_option : null,
                      capacity: data.capacity?.trim() || null,
                      operational_status: data.operational_status || 'operacional',
                      notes: data.notes?.trim() || null,
                      created_by: profile?.id || null,
                    };

                    // Validar operational_status (a tabela só aceita: 'operacional', 'manutencao', 'quebrado', 'desativado')
                    const validStatuses = ['operacional', 'manutencao', 'quebrado', 'desativado'];
                    if (assetData.operational_status === 'inativo') {
                      assetData.operational_status = 'desativado'; // Mapear inativo para desativado
                    }
                    if (!validStatuses.includes(assetData.operational_status)) {
                      assetData.operational_status = 'operacional'; // Default
                    }

                    // Gerar código automaticamente se não fornecido (usa 'bem_patrimonial' quando disponível)
                    if (!assetData.asset_code) {
                        assetData.asset_code = generateAssetCode(
                          assetType,
                          assetData.sigla_local,
                          assetData.location,
                          assetData.altura_option,
                          assetData.bem_patrimonial
                        );
                    }
                    if (!assetData.location) {
                      throw new Error('Localização é obrigatória');
                    }

                    // Adicionar installation_date se fornecido
                    if (data.installation_date) {
                      assetData.installation_date = data.installation_date;
                    }

                    // Inserir no banco com retry para tratar colisões de asset_code
                    const { insertedData, error: insertError } = await insertWithRetry(assetData, 5);

                    if (insertError) {
                      console.error('Erro do Supabase ao inserir ativo:', insertError);
                      throw insertError;
                    }

                    if (!insertedData || insertedData.length === 0) {
                      throw new Error('Nenhum dado foi inserido');
                    }

                    // Recarregar lista e fechar formulário
                    await fetchAssets();
                    setShowForm(false);
                    
                    // Mostrar mensagem de sucesso
                    toast.success('Ativo salvo com sucesso!');
                  } catch (err: any) {
                    console.error('Erro ao salvar ativo', err);
                    const errorMessage = err?.message || err?.error?.message || 'Erro ao salvar ativo. Verifique o console para mais detalhes.';
                    toast.error(errorMessage);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                isLoading={isSubmitting}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por código, localização, marca ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        {viewMode === 'table' ? (
          <Card>
            <CardContent>
              {loading ? (
                <div className="space-y-2 p-4">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum ativo encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "Tente ajustar sua busca" : "Comece adicionando seu primeiro ativo"}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Ativo
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow key={asset.id} className="cursor-pointer" onClick={() => navigate(`/ativos/${asset.id}`)}>
                        <TableCell className="font-medium">{asset.asset_code}</TableCell>
                        <TableCell>{[asset.brand, asset.model].filter(Boolean).join(' ') || '-'}</TableCell>
                        <TableCell>{typeLabels[asset.asset_type]}</TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[asset.operational_status]}>
                            {statusLabels[asset.operational_status]}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => navigate(`/historico/${asset.id}`)}>
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setQrAsset(asset)}>
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => navigate(`/ativos/${asset.id}?edit=1`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-6 w-[100px] mt-2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow group"
                  onClick={() => navigate(`/ativos/${asset.id}`)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-bold">{asset.asset_code}</span>
                      <Badge className={statusColors[asset.operational_status]}>
                        {statusLabels[asset.operational_status]}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Tipo</p>
                      <p className="font-medium">{typeLabels[asset.asset_type]}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Localização</p>
                      <p className="font-medium">{asset.location}</p>
                    </div>
                    {(asset.brand || asset.model) && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Marca/Modelo</p>
                        <p className="font-medium">
                          {asset.brand} {asset.model}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        {qrAsset && (
          <QRCodeModal
            open={!!qrAsset}
            onOpenChange={(open) => !open && setQrAsset(null)}
            title={`QR Code - ${qrAsset.asset_code}`}
            code={qrAsset.qr_code || qrAsset.id || qrAsset.asset_code}
            subtitle={`${[qrAsset.brand, qrAsset.model].filter(Boolean).join(' ')} - ${qrAsset.location}`}
          />
        )}

        {/* Dialog de Importação em Massa */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Importar Ativos em Massa
              </DialogTitle>
              <DialogDescription className="space-y-2">
                <div>Cole os dados dos ativos no formato CSV. Um ativo por linha.</div>
                <div>
                  <strong>Formato:</strong> Código;Tipo;Marca;Modelo;Localização;Setor;Sigla;BemPatrimonial;Altura;Status
                </div>
                <div>
                  <strong>Obrigatórios:</strong> Tipo, Localização
                  <br />
                  <strong>Código:</strong> Opcional — será gerado automaticamente se estiver vazio (usa BemPatrimonial quando disponível)
                  <br />
                  <strong>Opcionais:</strong> Marca, Modelo, Setor, Sigla, BemPatrimonial, Altura (A/B), Status
                </div>
                <div>
                  <strong>Exemplo completo:</strong> AC-001;ar_condicionado;LG;Split 12k;Sala 101;Administração;SL-01;BM-123;A;operacional
                  <br />
                  <strong>Exemplo mínimo:</strong> AC-001;ar_condicionado;;;Sala 101;;;;
                </div>
                <div>
                  <strong>Tipos válidos:</strong> ar_condicionado, mecalor, ar_maquina
                  <br />
                  <strong>Status válidos:</strong> operacional, manutencao, quebrado, desativado (padrão: operacional)
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  💡 Para campos vazios, use dois separadores consecutivos (;;)
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="import-data">Dados dos Ativos (CSV)</Label>
                <Textarea
                  id="import-data"
                  placeholder="AC-001;ar_condicionado;LG;Split 12k;Sala 101;Administração;SL-01;BM-123;A;operacional&#10;AC-002;mecalor;York;Chiller 50TR;Sala 102;TI;;;operacional"
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(false)}
                disabled={isImporting}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  const textarea = document.getElementById('import-data') as HTMLTextAreaElement;
                  const data = textarea.value.trim();
                  
                  if (!data) {
                    toast.error('Por favor, cole os dados dos ativos');
                    return;
                  }

                  setIsImporting(true);
                  try {
                    // Obter usuário atual
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                      throw new Error('Usuário não autenticado');
                    }

                    const { data: profile } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('id', user.id)
                      .single();

                    // Parse dos dados
                    const lines = data.split('\n').filter(line => line.trim());
                    const assetsToInsert: any[] = [];
                    const errors: string[] = [];

                    for (let i = 0; i < lines.length; i++) {
                      const line = lines[i].trim();
                      if (!line) continue;

                      try {
                        // Tentar parsear como CSV (separado por ; ou ,)
                        const parts = line.split(/[;,]/).map(p => p.trim());

                        // Mapear posições (compatível com formato antigo)
                        // Detecta linhas em que foi adicionado um separador a mais no início (ex: ";;ar_condicionado;...")
                        // e realinha removendo a célula vazia extra.
                        if ((parts[1] === undefined || parts[1] === '') && parts[2]) {
                          const raw = String(parts[2]).toLowerCase();
                          // normalizar removendo caracteres não alfanuméricos para detectar variações
                          const tNorm = raw.replace(/[^a-z0-9]/g, '');
                          // checar se parts[2] parece ser um tipo conhecido
                          if (
                            tNorm.startsWith('arcond') ||
                            tNorm.startsWith('chill') ||
                            tNorm.startsWith('split') ||
                            tNorm.startsWith('mecalor') ||
                            tNorm.startsWith('armaq') ||
                            tNorm.startsWith('outro')
                          ) {
                            // remover a célula vazia na posição 1 para realinhar
                            parts.splice(1, 1);
                          }
                        }

                        const asset_code = parts[0];
                        const asset_type = parts[1];
                        const brand = parts[2] || '';
                        const model = parts[3] || '';
                        const location = parts[4] || '';
                        const sector = parts[5] || '';
                        const sigla_local = parts[6] || '';
                        const bem_patrimonial = parts[7] || '';
                        const altura_option = parts[8] || '';
                        const operational_status = parts[9] || '';

                        // Validar campos obrigatórios (tipo e localização são obrigatórios)
                        if (!asset_type || !location) {
                          errors.push(`Linha ${i + 1}: Campos obrigatórios faltando (tipo, localização)`);
                          continue;
                        }

                        // Validar asset_type
                        const validAssetTypes = ['ar_condicionado', 'mecalor', 'ar_maquina'];
                        let validAssetType = asset_type.toLowerCase();
                        if (validAssetType === 'chiller' || validAssetType === 'split' || validAssetType === 'outro') {
                          validAssetType = 'ar_condicionado';
                        }
                        if (!validAssetTypes.includes(validAssetType)) {
                          validAssetType = 'ar_condicionado';
                        }

                        // Gerar código se não informado (usar validAssetType e bem_patrimonial quando houver)
                        const finalAssetCode = asset_code && asset_code.trim()
                          ? asset_code.trim()
                          : generateAssetCode(validAssetType, sigla_local, location, altura_option, bem_patrimonial);

                        // Validar status
                        const validStatuses = ['operacional', 'manutencao', 'quebrado', 'desativado'];
                        let validStatus = (operational_status || 'operacional').toLowerCase();
                        if (validStatus === 'inativo') validStatus = 'desativado';
                        if (!validStatuses.includes(validStatus)) {
                          validStatus = 'operacional';
                        }

                        assetsToInsert.push({
                          asset_code: finalAssetCode,
                          asset_type: validAssetType,
                          brand: brand?.trim() || null,
                          model: model?.trim() || null,
                          location: location.trim(),
                          sector: sector?.trim() || null,
                          sigla_local: sigla_local?.trim() || null,
                          bem_patrimonial: bem_patrimonial?.trim() || null,
                          altura_option: altura_option && altura_option !== 'none' ? altura_option : null,
                          operational_status: validStatus,
                          created_by: profile?.id || null,
                        });
                      } catch (err: any) {
                        errors.push(`Linha ${i + 1}: ${err.message || 'Erro ao processar'}`);
                      }
                    }

                    if (assetsToInsert.length === 0) {
                      toast.error('Nenhum ativo válido encontrado nos dados');
                      setIsImporting(false);
                      return;
                    }

                    // Inserir em lotes de 50
                    const batchSize = 50;
                    let inserted = 0;
                    let failed = 0;

                    for (let i = 0; i < assetsToInsert.length; i += batchSize) {
                      const batch = assetsToInsert.slice(i, i + batchSize);
                      // Tentar inserir em lote primeiro
                      const { data: insertedData, error } = await supabase.from('assets').insert(batch).select();

                      if (error) {
                        console.error(`Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error);
                        // Se for violação de unique constraint, tentar inserir cada item individualmente com retry
                        if (isUniqueViolation(error)) {
                          for (const item of batch) {
                            const res = await insertWithRetry(item, 5);
                            if (res.error) {
                              failed += 1;
                              console.error('Erro ao inserir item durante retry:', res.error, item);
                            } else {
                              inserted += res.insertedData?.length || 0;
                            }
                          }
                        } else {
                          failed += batch.length;
                        }
                      } else {
                        inserted += insertedData?.length || 0;
                      }
                    }

                    // Recarregar lista
                    await fetchAssets();
                    setShowImportDialog(false);
                    textarea.value = ''; // Limpar campo
                    
                    if (errors.length > 0) {
                      toast.warning(`${inserted} ativos inseridos, mas ${errors.length} erros encontrados. Verifique o console.`);
                      console.warn('Erros na importação:', errors);
                    } else {
                      toast.success(`${inserted} ativos importados com sucesso!`);
                    }
                  } catch (err: any) {
                    console.error('Erro ao importar ativos', err);
                    toast.error(`Erro ao importar: ${err.message || 'Erro desconhecido'}`);
                  } finally {
                    setIsImporting(false);
                  }
                }}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
