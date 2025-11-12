import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanBarcode, QrCode, Search, X, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AssetChecklistEditor from "@/components/ativos/AssetChecklistEditor";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const [scanInput, setScanInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [ativoEncontrado, setAtivoEncontrado] = useState<any | null>(null);
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: ativos = [] } = useQuery<any[], Error>({ 
    queryKey: ['ativos'], 
    queryFn: async () => {
      const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      return (data as any[]) || [];
    } 
  });

  const iniciarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      toast.error("Não foi possível acessar a câmera.");
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleBuscar = () => {
    if (!scanInput.trim()) {
      toast.error("Digite ou escaneie um código");
      return;
    }

    const ativo = (ativos as any[]).find(a =>
      a.asset_code?.toLowerCase() === scanInput.toLowerCase() ||
      a.id === scanInput ||
      a.serial_number === scanInput
    );

    if (ativo) {
      setAtivoEncontrado(ativo);
      setMostrarChecklist(true);
      toast.success("Ativo encontrado!");
    } else {
      toast.error("Ativo não encontrado!");
    }
  };

  const resetarBusca = () => {
    setAtivoEncontrado(null);
    setMostrarChecklist(false);
    setScanInput("");
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Inventário Rápido</h1>
          <p className="text-muted-foreground mt-1">
            Confirme a localização e status dos ativos via código de barras ou RFID
          </p>
        </div>

        {!mostrarChecklist ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanBarcode className="h-5 w-5" />
                Leitura de Código
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={iniciarCamera}
                  className="space-y-2 flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                >
                  <div className="text-center space-y-2">
                    <ScanBarcode className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Código de Barras</p>
                    <p className="text-xs text-muted-foreground">
                      Clique para abrir câmera
                    </p>
                  </div>
                </button>

                <button
                  onClick={iniciarCamera}
                  className="space-y-2 flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                >
                  <div className="text-center space-y-2">
                    <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">QR Code / RFID</p>
                    <p className="text-xs text-muted-foreground">
                      Clique para abrir câmera
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Digite ou escaneie o código / RFID / número de série..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                  className="flex-1"
                />
                <Button onClick={handleBuscar}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>

              <div className="p-4 bg-primary/10 text-primary rounded-lg">
                <p className="text-sm">
                  <strong>Dica:</strong> Use um leitor de código de barras USB ou leitor RFID. 
                  O código será inserido automaticamente no campo acima. Ou clique nas opções acima para usar a câmera.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Ativo Encontrado
                  </CardTitle>
                  <Button variant="outline" onClick={resetarBusca}>
                    <X className="h-4 w-4 mr-2" />
                    Buscar Outro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-2xl font-bold">{ativoEncontrado.asset_code}</p>
                      <p className="text-muted-foreground">{ativoEncontrado.name || ativoEncontrado.asset_type}</p>
                    </div>
                    <Badge className={ativoEncontrado.operational_status === 'operacional' ? 'bg-green-500' : 'bg-red-500'}>
                      {ativoEncontrado.operational_status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">Localização</p>
                      <p className="font-medium">{ativoEncontrado.location || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Setor</p>
                      <p className="font-medium">{ativoEncontrado.sector || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <AssetChecklistEditor assetId={ativoEncontrado.id} />
          </div>
        )}

        {showCamera && (
          <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex-1 relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-4 border-white rounded-2xl shadow-lg"></div>
              </div>
            </div>
            <div className="p-6 bg-black">
              <p className="text-white text-center mb-4">Posicione o código no quadrado</p>
              <Button onClick={pararCamera} variant="outline" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Fechar Câmera
              </Button>
              <p className="text-xs text-center text-gray-400 mt-2">
                Use a busca manual para continuar
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
