import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { History, Calendar, ArrowLeft, ChevronDown, Check, AlertCircle, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceDetail {
  id: string;
  action_type: string;
  description: string;
  created_at: string;
  workOrderId?: string;
  workOrderNumber?: string;
  workOrderType?: string;
  checklist?: any;
  checklistResponses?: any;
  notes?: string;
  technicianId?: string;
  technicianName?: string;
  photos?: string[];
}

export default function HistoricoAtivo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [assetCode, setAssetCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<MaintenanceDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Photo viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPhoto, setViewerPhoto] = useState<string | null>(null);

  const openPhoto = (photo: any) => {
    const url = typeof photo === 'string' ? photo : photo?.url || photo?.data || null;
    if (!url) return;
    console.log("🖼️ openPhoto called with URL:", url);
    setViewerPhoto(url);
    setViewerOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [assetRes, histRes, osRes] = await Promise.all([
          supabase.from("assets").select("asset_code").eq("id", id).single(),
          supabase
            .from("asset_history")
            .select("id, action_type, description, created_at, technician_id, work_order_id")
            .eq("asset_id", id)
            .order("created_at", { ascending: false }),
          supabase
            .from("work_orders")
            .select("id, order_number, order_type, completed_date, created_at, assigned_to, notes")
            .eq("asset_id", id),
        ]);

        setAssetCode(assetRes.data?.asset_code || "");

        const osMap = new Map((osRes.data || []).map((o: any) => [o.id, o]));

        const items = (histRes.data || []).map((h: any) => {
          const os = h.work_order_id ? osMap.get(h.work_order_id) : null;
          return {
            id: h.id,
            action_type: h.action_type,
            description: h.description || (os ? `OS ${os.order_number}` : ''),
            created_at: h.created_at,
            workOrderId: h.work_order_id,
            workOrderNumber: os?.order_number,
            workOrderType: os?.order_type,
            technicianId: h.technician_id,
          };
        });

        // fallback: also include concluded work orders as history entries
        const osItems = (osRes.data || [])
          .filter((o: any) => o.completed_date)
          .map((o: any) => ({
            id: `os-${o.id}`,
            action_type: "ordem_servico",
            description: `Ordem ${o.order_number} concluída`,
            created_at: o.completed_date || o.created_at,
            workOrderId: o.id,
            workOrderNumber: o.order_number,
            workOrderType: o.order_type,
            notes: o.notes,
          }));

        const merged = [...items, ...osItems].sort((a, b) => (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        setHistorico(merged);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const loadMaintenanceDetails = async (item: any) => {
    console.log("🔧 Clicou em item:", item);
    
    // Mostrar modal imediatamente com dados básicos
    setSelectedItem(item);
    setDetailsLoading(true);
    
    try {
      const detail: MaintenanceDetail = { ...item };

      // Se o item já tem fotos, usa elas direto
      if (item.photos && Array.isArray(item.photos) && item.photos.length > 0) {
        console.log("📸 Item já tem fotos:", item.photos);
        detail.photos = item.photos;
      }

      // Se tem work_order_id, carrega dados adicionais
      if (item.workOrderId) {
        const { data: osData } = await supabase
          .from("work_orders")
          .select("id, order_number, order_type, notes, assigned_to")
          .eq("id", item.workOrderId)
          .single();

        if (osData) {
          detail.notes = osData.notes;
          if (osData.assigned_to) {
            const { data: techData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", osData.assigned_to)
              .single();
            detail.technicianName = techData?.full_name;
          }
        }

        // Tenta carregar mais fotos de asset_history se existirem
        const { data: historyData } = await supabase
          .from("asset_history")
          .select("*")
          .eq("work_order_id", item.workOrderId)
          .limit(1);

        if (historyData && historyData.length > 0) {
          const hist = historyData[0];
          console.log("📋 Histórico completo:", hist);
          
          if (hist.checklist_data) {
            detail.checklist_data = hist.checklist_data;
            console.log("✅ checklist_data carregado:", detail.checklist_data);
          }
          if (hist.checklist_responses) {
            detail.checklistResponses = hist.checklist_responses;
          }
          // Se encontrou fotos no histórico e não tinha antes, usa elas
          if (!detail.photos && hist.photos && Array.isArray(hist.photos)) {
            detail.photos = hist.photos;
            console.log("📸 Fotos carregadas do histórico:", detail.photos);
          }
        }
      }

      // Carregar checklist do asset
      const { data: checklistData } = await supabase
        .from("asset_checklists")
        .select("id, name, items")
        .eq("asset_id", item.asset_id || id)
        .limit(1);

      if (checklistData && checklistData.length > 0) {
        detail.checklist = checklistData[0];
      }

      console.log("✅ Detail carregado:", detail);
      setSelectedItem(detail);
    } catch (error) {
      console.error("❌ Erro:", error);
    } finally {
      setDetailsLoading(false);
    }
  };  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground flex items-center gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-3xl font-bold">Histórico do Ativo {assetCode}</h1>
            <p className="text-muted-foreground mt-1">Manutenções e alterações recentes - Clique para ver detalhes</p>
          </div>
          <div className="w-64">
            <Input
              placeholder="Buscar na descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Histórico de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}
              {historico
                .filter((h) => h.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadMaintenanceDetails(item)}
                    className="w-full text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Badge>{item.action_type.replace(/_/g, ' ')}</Badge>
                        <p className="text-sm font-medium">{item.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                          {item.workOrderType && (
                            <Badge variant="outline">{item.workOrderType}</Badge>
                          )}
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </div>
                  </button>
                ))}
              {!loading && historico.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">Nenhuma manutenção registrada para este ativo</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={(open) => {
          console.log("📱 Dialog state changed:", open, "selectedItem:", selectedItem);
          if (!open) {
            setSelectedItem(null);
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Manutenção</DialogTitle>
              <DialogDescription>
                {selectedItem?.workOrderNumber && `Ordem ${selectedItem.workOrderNumber}`}
                {selectedItem?.description && !selectedItem?.workOrderNumber && selectedItem.description}
              </DialogDescription>
            </DialogHeader>

            {detailsLoading ? (
              <div className="p-4 text-center text-muted-foreground">Carregando detalhes...</div>
            ) : selectedItem ? (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">Data da Manutenção</h3>
                    <p className="text-base font-medium mt-1">
                      {selectedItem.created_at ? format(new Date(selectedItem.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground">Tipo</h3>
                    <p className="text-base font-medium mt-1 capitalize">
                      {selectedItem.workOrderType || selectedItem.action_type || "-"}
                    </p>
                  </div>
                  {selectedItem.technicianName && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground">Técnico</h3>
                      <p className="text-base font-medium mt-1">{selectedItem.technicianName}</p>
                    </div>
                  )}
                </div>

                {/* Observações */}
                {selectedItem.notes && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Observações Técnicas</h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedItem.notes}</p>
                  </div>
                )}

                {/* Checklist */}
                {selectedItem.checklist && selectedItem.checklist.items && selectedItem.checklist.items.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-3">✅ Checklist Executado: {selectedItem.checklist.name}</h3>
                    <div className="space-y-2">
                      {selectedItem.checklist.items.map((item: any, idx: number) => {
                        // Try to find response from checklist_data first (newly saved format)
                        let response = null;
                        if (selectedItem.checklist_data && Array.isArray(selectedItem.checklist_data)) {
                          response = selectedItem.checklist_data[idx] || null;
                        }
                        // Fallback to old format
                        if (!response && selectedItem.checklistResponses?.respostas) {
                          response = selectedItem.checklistResponses.respostas.find(
                            (r: any) => r.id === item.id || r.label === item.label
                          ) || null;
                        }
                        
                        const isOk = response?.status === 'ok';
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-start gap-3 p-3 rounded border-l-4 ${
                              isOk 
                                ? 'border-green-500 bg-green-50/50' 
                                : 'border-yellow-500 bg-yellow-50/50'
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {isOk ? (
                                <Check className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{item.label || item.text}</p>
                                <Badge variant={isOk ? "default" : "secondary"} className="text-xs">
                                  {isOk ? '✓ OK' : '⚠ NOK'}
                                </Badge>
                              </div>
                              {response?.nota && (
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                  Observação: {response.nota}
                                </p>
                              )}
                              {item.type === 'texto' && response?.response && (
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                                  Resposta: {response.response}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Fotos da Manutenção */}
                {selectedItem.photos && selectedItem.photos.length > 0 ? (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-semibold mb-3">📸 Fotos da Manutenção ({selectedItem.photos.length})</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {selectedItem.photos.map((photo: any, idx: number) => (
                        <div key={idx} className="relative group">
                          <img
                            src={typeof photo === 'string' ? photo : photo.url || photo.data}
                            alt={`Foto ${idx + 1}`}
                            onClick={() => openPhoto(photo)}
                            role="button"
                            className="w-full h-32 object-cover rounded border border-border cursor-pointer"
                          />
                          {typeof photo === 'object' && photo.timestamp && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b opacity-0 group-hover:opacity-100 transition-opacity">
                              {format(new Date(photo.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/20">
                    <h3 className="text-sm font-semibold mb-2">📸 Fotos da Manutenção</h3>
                    <p className="text-xs text-muted-foreground">
                      Nenhuma foto registrada para esta manutenção.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      )}
      {viewerOpen && (
        <Dialog open={viewerOpen} onOpenChange={(open) => setViewerOpen(open)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center justify-between w-full">
                <DialogTitle>Foto</DialogTitle>
                <div className="flex items-center gap-2">
                  {viewerPhoto && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        console.log("🔗 Opening photo URL:", viewerPhoto);
                        window.open(viewerPhoto, '_blank');
                      }}>
                        <ExternalLink className="w-4 h-4 mr-2" /> Abrir
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        if (!viewerPhoto) return;
                        console.log("💾 Downloading photo URL:", viewerPhoto);
                        const link = document.createElement('a');
                        link.href = viewerPhoto;
                        link.download = `foto-${Date.now()}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}>
                        <Download className="w-4 h-4 mr-2" /> Baixar
                      </Button>
                    </>
                  )}
                  <DialogClose />
                </div>
              </div>
            </DialogHeader>
            <div className="flex justify-center">
              {viewerPhoto && (
                <img src={viewerPhoto} alt="Foto" className="w-full h-auto max-h-[80vh] object-contain rounded" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
