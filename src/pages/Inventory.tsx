import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanBarcode, QrCode, Search, X, CheckCircle, Download, ArrowLeft, History, Plus, Smartphone, RotateCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type InventoryStage = 'menu' | 'scanning' | 'history';
type InventoryItem = { code: string; assetId?: string; asset_code?: string; asset_name?: string; location?: string; scannedAt: string };
type CameraType = 'environment' | 'user';

export default function Inventory() {
  const [stage, setStage] = useState<InventoryStage>('menu');
  const [scanInput, setScanInput] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraSlow, setCameraSlow] = useState(false);
  const [readings, setReadings] = useState<InventoryItem[]>([]);
  const [currentInventoryId, setCurrentInventoryId] = useState<string | null>(null);
  const [cameraType, setCameraType] = useState<CameraType>('environment');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<InventoryItem | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any | null>(null);
  const scanningRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const lastDetectionRef = useRef<{ code: string; time: number } | null>(null);

  const { data: ativos = [] } = useQuery<any[], Error>({ 
    queryKey: ['ativos'], 
    queryFn: async () => {
      const { data } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
      return (data as any[]) || [];
    } 
  });

  const { data: inventories = [], refetch: refetchInventories } = useQuery<any[], Error>({
    queryKey: ['inventories'],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;
      if (!userId) return [];
      
      const { data } = await supabase
        .from('inventories')
        .select(`
          id,
          created_at,
          created_by,
          description,
          total_items,
          inventory_items(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return (data as any[]) || [];
    }
  });

  const iniciarCamera = async (cameraTypeOverride?: CameraType) => {
    // Indicar que a câmera está iniciando (UX)
    setCameraInitializing(true);
    setCameraSlow(false);
    let slowTimer: number | undefined = window.setTimeout(() => setCameraSlow(true), 2500);
    try {
      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      const useCamera = cameraTypeOverride || cameraType;
      // atualizar estado de cameraType para refletir a intenção
      try { setCameraType(useCamera); } catch (_) {}

      // Primeiro: tentar enumerar dispositivos e abrir explicitamente o deviceId da câmera traseira
      let openedStream: MediaStream | null = null;
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');

        // Se labels vazias, solicitar permissão genérica para preencher labels
        const labelsEmpty = videoDevices.length > 0 && videoDevices.every(d => !d.label);
        if (labelsEmpty) {
          try {
            const temp = await navigator.mediaDevices.getUserMedia({ video: true });
            temp.getTracks().forEach(t => t.stop());
            devices = await navigator.mediaDevices.enumerateDevices();
          } catch (err) {
            console.warn('Permissão de câmera negada no prompt inicial:', err);
          }
        }

        const videoDevices2 = devices.filter(d => d.kind === 'videoinput');
        if (videoDevices2.length > 0) {
          const preferred = videoDevices2.slice().sort((a, b) => {
            const rearRe = /back|rear|traseira|environment/i;
            const aRear = rearRe.test(a.label) ? 0 : 1;
            const bRear = rearRe.test(b.label) ? 0 : 1;
            return aRear - bRear;
          });

          for (const dev of preferred) {
            try {
              console.log('Tentando abrir deviceId', dev.deviceId, dev.label);
              const s = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: dev.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
              // testar rapidamente se entrega frames
              streamRef.current = s;
              if (videoRef.current) videoRef.current.srcObject = s;
              try { videoRef.current && (await videoRef.current.play()); } catch (e) { console.warn('play erro no deviceId:', e); }
              // aguardar loadeddata breve
              await new Promise<void>((resolve) => {
                if (!videoRef.current) return resolve();
                if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) return resolve();
                const onLoaded = () => { videoRef.current && videoRef.current.removeEventListener('loadeddata', onLoaded); resolve(); };
                videoRef.current.addEventListener('loadeddata', onLoaded);
                setTimeout(() => resolve(), 1200);
              });
              if (videoRef.current && videoRef.current.videoWidth > 0) {
                openedStream = s;
                break;
              }
              // caso não tenha frames, parar e tentar próximo
              s.getTracks().forEach(t => t.stop());
              streamRef.current = null;
            } catch (err) {
              console.warn('Falha ao abrir deviceId', dev.deviceId, err);
              continue;
            }
          }
        }
      } catch (err) {
        console.warn('Erro enumerando dispositivos:', err);
      }

      // Se não conseguiu abrir por deviceId, tenta usando facingMode como fallback
      if (!openedStream) {
        try {
          const s2 = await navigator.mediaDevices.getUserMedia({ video: { facingMode: useCamera, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
          openedStream = s2;
          streamRef.current = s2;
          if (videoRef.current) {
            videoRef.current.srcObject = s2;
            try { await videoRef.current.play(); } catch (err) { console.error('Erro ao reproduzir fallback facingMode:', err); }
            await new Promise<void>((resolve) => {
              if (!videoRef.current) return resolve();
              if (videoRef.current.readyState >= 2) return resolve();
              const onLoaded = () => { videoRef.current && videoRef.current.removeEventListener('loadeddata', onLoaded); resolve(); };
              videoRef.current.addEventListener('loadeddata', onLoaded);
              setTimeout(() => resolve(), 1000);
            });
          }
        } catch (err) {
          console.error('Falha ao abrir câmera por facingMode como fallback:', err);
        }
      }

      // Se mesmo assim não abriu, tentar um getUserMedia genérico como último recurso
      if (!openedStream) {
        try {
          console.warn('Abrindo stream genérico como último recurso');
          const generic = await navigator.mediaDevices.getUserMedia({ video: true });
          openedStream = generic;
          streamRef.current = generic;
          if (videoRef.current) {
            videoRef.current.srcObject = generic;
            try { videoRef.current.muted = true; } catch (_) {}
            try { await videoRef.current.play(); } catch (e) { console.warn('Erro play generic:', e); }
          }
        } catch (err) {
          console.error('Falha ao abrir stream genérico:', err);
          toast.error('Não foi possível iniciar a câmera. Verifique permissões e dispositivos.');
          return;
        }
      }
      // garantir streamRef atual
      streamRef.current = openedStream;
      if (videoRef.current) videoRef.current.srcObject = openedStream;
      // limpar indicador de inicialização
      try { if (typeof slowTimer !== 'undefined') clearTimeout(slowTimer); } catch(_) {}
      setCameraInitializing(false);
      setCameraSlow(false);
      // Se após o carregamento o vídeo continuar sem frames, tentar fallback por deviceId
      if (videoRef.current && (videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0)) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          if (videoDevices.length > 0) {
            // Ordenar preferindo câmeras traseiras quando possível
            const preferred = videoDevices.slice().sort((a, b) => {
              const rearRe = /back|rear|traseira|environment/i;
              const aRear = rearRe.test(a.label) ? 0 : 1;
              const bRear = rearRe.test(b.label) ? 0 : 1;
              return aRear - bRear;
            });

            let success = false;
            for (const dev of preferred) {
              try {
                const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: dev.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
                // parar stream anterior
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(t => t.stop());
                }
                streamRef.current = fallbackStream;
                if (videoRef.current) {
                  videoRef.current.srcObject = fallbackStream;
                  // garantir muted para permitir autoplay em alguns navegadores
                  try { videoRef.current.muted = true; } catch (_) {}
                  try { await videoRef.current.play(); } catch (e) { console.error('Erro play fallback:', e); }
                  // aguardar carregamento
                  await new Promise<void>((resolve) => {
                    if (!videoRef.current) return resolve();
                    if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) return resolve();
                    const onLoaded = () => { videoRef.current && videoRef.current.removeEventListener('loadeddata', onLoaded); resolve(); };
                    videoRef.current.addEventListener('loadeddata', onLoaded);
                    setTimeout(() => resolve(), 1200);
                  });
                  if (videoRef.current.videoWidth > 0) {
                    success = true;
                    break;
                  }
                }
              } catch (err) {
                // tentar próximo device
                console.warn('Tentativa com deviceId falhou:', dev.deviceId, err);
                continue;
              }
            }

            if (!success) {
              toast.info('Não foi possível iniciar o preview da câmera. Tente alternar a câmera manualmente.');
            }
          }
        } catch (err) {
          console.warn('Não foi possível enumerar dispositivos de mídia:', err);
        }
      }
      setShowCamera(true);

      // Ajustar espelhamento conforme câmera
      try {
        const track = streamRef.current?.getVideoTracks()[0];
        const settings: any = track && track.getSettings ? track.getSettings() : {};
        const facing = settings?.facingMode || useCamera;
        if (videoRef.current) {
          videoRef.current.style.transform = facing === 'user' ? 'scaleX(-1)' : 'none';
        }
      } catch (_) {}

      // Inicializar BarcodeDetector
      if ((window as any).BarcodeDetector) {
        try {
          const formats = ['qr_code', 'ean_13', 'code_128', 'code_39', 'ean_8'];
          detectorRef.current = new (window as any).BarcodeDetector({ formats });
          startScanning();
        } catch (err) {
          console.warn('BarcodeDetector não suportado:', err);
          detectorRef.current = null;
          toast.info('Detecção automática indisponível. Use busca manual.');
        }
      } else {
        detectorRef.current = null;
        toast.info('BarcodeDetector não disponível. Use busca manual.');
      }
    } catch (err: any) {
      try { if (typeof slowTimer !== 'undefined') clearTimeout(slowTimer); } catch (_) {}
      setCameraInitializing(false);
      setCameraSlow(false);
      console.error('Erro ao acessar câmera:', err);
      let errorMsg = 'Não foi possível acessar a câmera.';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Permissão de câmera negada. Por favor, permita o acesso.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'Nenhuma câmera encontrada no dispositivo.';
      } else if (err.name === 'ConstraintNotSatisfiedError') {
        errorMsg = 'As configurações da câmera não são suportadas. Tente outra câmera.';
      }
      
      toast.error(errorMsg);
    }
  };

  const alternarCamera = async () => {
    const novaCamera: CameraType = cameraType === 'environment' ? 'user' : 'environment';
    setCameraType(novaCamera);
    toast.info(`Alternando para câmera ${novaCamera === 'user' ? 'frontal' : 'traseira'}...`);
    // Reiniciar câmera com novo tipo (passa override para evitar dependência do state async)
    await iniciarCamera(novaCamera);
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraInitializing(false);
    setCameraSlow(false);
    stopScanning();
  };

  const scanFrame = async () => {
    if (!videoRef.current || !detectorRef.current) return;
    try {
      const results = await detectorRef.current.detect(videoRef.current);
      if (results && results.length > 0) {
        for (const r of results) {
          const raw = r.rawValue || (r.value && r.value.rawValue) || r.value || null;
          if (raw) {
            const code = raw.toString().trim();
            // Evitar detecção duplicada dentro de 500ms
            const now = Date.now();
            if (lastDetectionRef.current?.code === code && now - lastDetectionRef.current.time < 500) {
              continue;
            }
            lastDetectionRef.current = { code, time: now };
            await onDetected(code);
          }
        }
      }
    } catch (err) {
      // ignore
    }
  };

  const scanningLoop = async () => {
    if (!scanningRef.current) return;
    if (detectorRef.current && videoRef.current) {
      await scanFrame();
    }
    rafRef.current = requestAnimationFrame(scanningLoop);
  };

  const startScanning = () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    rafRef.current = requestAnimationFrame(scanningLoop);
  };

  const stopScanning = () => {
    scanningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const onDetected = async (raw: string) => {
    const code = raw?.trim();
    if (!code) return;
    if (readings.find(r => r.code === code)) {
      toast.info('Código já lido');
      return;
    }

    const ativo = (ativos as any[]).find(a =>
      a.asset_code?.toLowerCase() === code.toLowerCase() ||
      a.id === code ||
      a.serial_number === code ||
      a.qr_code === code
    );

    const newItem: InventoryItem = {
      code,
      assetId: ativo?.id,
      asset_code: ativo?.asset_code,
      asset_name: ativo?.name || ativo?.asset_type,
      location: ativo?.location,
      scannedAt: new Date().toISOString(),
    };
    
    // Abrir diálogo de confirmação
    setPendingItem(newItem);
    setConfirmationOpen(true);
    
    // Parar scanning temporariamente para evitar leituras duplas
    stopScanning();
  };

  const confirmAddItem = () => {
    if (pendingItem) {
      setReadings(prev => [pendingItem, ...prev]);
      toast.success(pendingItem.asset_name ? `✓ ${pendingItem.asset_code}` : 'Código adicionado');
    }
    setConfirmationOpen(false);
    setPendingItem(null);
    // Retomar scanning (usa startScanning para garantir requestAnimationFrame)
    if (showCamera && detectorRef.current) {
      startScanning();
    }
  };

  const cancelAddItem = () => {
    setConfirmationOpen(false);
    setPendingItem(null);
    // Retomar scanning (usa startScanning para garantir requestAnimationFrame)
    if (showCamera && detectorRef.current) {
      startScanning();
    }
  };

  const handleBuscar = () => {
    if (!scanInput.trim()) {
      toast.error("Digite ou escaneie um código");
      return;
    }
    onDetected(scanInput);
    setScanInput("");
  };

  const removerLeitura = (code: string) => {
    setReadings(prev => prev.filter(p => p.code !== code));
  };

  const iniciarNovoInventario = async () => {
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
    if (!userId) {
      toast.error("Usuário não autenticado");
      return;
    }

    // Criar registro de inventário
    const { data, error } = await supabase
      .from('inventories')
      .insert({
        user_id: userId,
        created_by: user?.data?.user?.email || null,
        description: `Inventário de ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao iniciar inventário");
      console.error(error);
      return;
    }

    setCurrentInventoryId(data.id);
    setReadings([]);
    setStage('scanning');
    // Forçar câmera traseira ao iniciar para evitar preview preto em alguns dispositivos
    await iniciarCamera('environment');
  };

  const finalizarInventario = async () => {
    if (readings.length === 0) {
      toast.error('Nenhuma leitura para salvar');
      return;
    }

    if (!currentInventoryId) {
      toast.error('ID do inventário não definido');
      return;
    }

    // Enriquecer leituras com dados do ativo (se disponíveis) antes de salvar
    const enriched = readings.map(r => {
      const code = (r.asset_code || r.code || '').toString();
      const match = (ativos as any[]).find(a => a.asset_code?.toLowerCase() === code.toLowerCase() || a.id === r.assetId);
      return {
        inventory_id: currentInventoryId,
        asset_id: r.assetId || match?.id || null,
        asset_code: (r.asset_code || match?.asset_code || r.code || '').toString(),
        asset_name: r.asset_name || match?.name || match?.asset_type || null,
        location: r.location || match?.location || null,
        scanned_at: r.scannedAt,
      };
    });

    const { error: insertError } = await supabase
      .from('inventory_items')
      .insert(enriched as any[]);

    if (insertError) {
      toast.error('Erro ao salvar itens do inventário');
      console.error(insertError);
      return;
    }

    // Atualizar total_items do inventário
    const { error: updateError } = await supabase
      .from('inventories')
      .update({ 
        total_items: readings.length,
        description: `Inventário com ${readings.length} ativo${readings.length !== 1 ? 's' : ''} - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`
      })
      .eq('id', currentInventoryId);

    if (updateError) {
      toast.error('Erro ao finalizar inventário');
      return;
    }

    // Gerar e fazer download do CSV (usar dados enriquecidos)
    generateAndDownloadCSV(enriched.map(e => ({
      code: e.asset_code,
      asset_code: e.asset_code,
      asset_name: e.asset_name || undefined,
      location: e.location || undefined,
      scannedAt: e.scanned_at,
    })));

    toast.success('Inventário finalizado com sucesso!');
    pararCamera();
    refetchInventories();
    setStage('menu');
    setCurrentInventoryId(null);
    setReadings([]);
  };

  const generateAndDownloadCSV = (items: InventoryItem[]) => {
    const headers = ['Código', 'Nome do Ativo', 'Localização', 'Data/Hora de Leitura'];
    const rows = items.map(item => [
      item.asset_code || item.code,
      item.asset_name || '-',
      item.location || '-',
      format(new Date(item.scannedAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadInventoryCSV = async (inventoryId: string) => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('asset_code, asset_name, location, scanned_at')
      .eq('inventory_id', inventoryId);

    if (error) {
      toast.error('Erro ao buscar itens do inventário');
      return;
    }

    const headers = ['Código', 'Nome do Ativo', 'Localização', 'Data/Hora de Leitura'];
    const rows = (data as any[]).map(item => [
      item.asset_code,
      item.asset_name || '-',
      item.location || '-',
      format(new Date(item.scanned_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_${inventoryId}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // MENU - Tela inicial com 2 opções
  if (stage === 'menu') {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Inventário Rápido</h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar leitura de ativos e histórico de inventários
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Iniciar novo inventário */}
            <button
              onClick={iniciarNovoInventario}
              className="h-64 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center p-6 space-y-4"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Iniciar Novo Inventário</h2>
                <p className="text-sm text-slate-600 mt-2">Abra a câmera e leia os QR codes dos ativos</p>
              </div>
            </button>

            {/* Ver inventários antigos */}
            <button
              onClick={() => setStage('history')}
              className="h-64 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100 transition-colors flex flex-col items-center justify-center p-6 space-y-4"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center">
                <History className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-slate-900">Ver Inventários Antigos</h2>
                <p className="text-sm text-slate-600 mt-2">Acesse histórico e baixe CSVs anteriores</p>
              </div>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // SCANNING - Tela de leitura
  if (stage === 'scanning') {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Leitura de Ativos</h1>
              <p className="text-muted-foreground mt-1">Total de leituras: {readings.length}</p>
            </div>
            <Button variant="outline" onClick={() => { pararCamera(); setStage('menu'); setReadings([]); setCurrentInventoryId(null); }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Câmera e busca manual */}
            <div className="md:col-span-2 space-y-4">
              {!showCamera ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Câmera de QR Code</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                    <ScanBarcode className="h-16 w-16 text-muted-foreground" />
                    <p className="text-center text-sm text-muted-foreground">Clique abaixo para abrir a câmera</p>
                    <Button onClick={() => iniciarCamera('environment')} className="w-full" disabled={cameraInitializing}>
                      <ScanBarcode className="h-4 w-4 mr-2" />
                      {cameraInitializing ? 'Abrindo câmera...' : 'Abrir Câmera'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Câmera Ativa ({cameraType === 'user' ? 'Frontal' : 'Traseira'})</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={alternarCamera} title="Alternar câmera">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={pararCamera}>
                        <X className="h-4 w-4 mr-2" />
                        Fechar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      {cameraInitializing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm">
                          <div className="text-center">
                            <p>Iniciando câmera... Pode demorar alguns segundos.</p>
                            {cameraSlow && <p className="text-xs text-muted-foreground mt-1">Se demorar, verifique permissões ou reinicie a câmera.</p>}
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 border-4 border-green-500 rounded-lg"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Busca manual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ou Buscar Manualmente</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Input
                    placeholder="Digite ou escaneie o código..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                  />
                  <Button onClick={handleBuscar}>
                    <Search className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Lista de leituras */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm">Leituras Registradas</CardTitle>
              </CardHeader>
              <CardContent>
                {readings.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma leitura ainda</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {readings.map((r) => (
                      <div key={r.code} className="p-2 bg-slate-50 rounded border border-slate-200">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{r.asset_code || r.code}</p>
                            {r.asset_name && <p className="text-xs text-slate-500 truncate">{r.asset_name}</p>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerLeitura(r.code)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => { pararCamera(); setStage('menu'); setReadings([]); setCurrentInventoryId(null); }} className="flex-1">
              Descartar
            </Button>
            <Button onClick={finalizarInventario} disabled={readings.length === 0} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar e Baixar CSV
            </Button>
          </div>
        </div>

        {/* Diálogo de confirmação */}
        <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Leitura</DialogTitle>
              <DialogDescription>
                Deseja adicionar este ativo ao inventário?
              </DialogDescription>
            </DialogHeader>
            
            {pendingItem && (
              <div className="space-y-4 py-4">
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Código</p>
                    <p className="font-mono font-semibold">{pendingItem.asset_code || pendingItem.code}</p>
                  </div>
                  {pendingItem.asset_name && (
                    <div>
                      <p className="text-xs text-muted-foreground">Ativo</p>
                      <p className="font-medium">{pendingItem.asset_name}</p>
                    </div>
                  )}
                  {pendingItem.location && (
                    <div>
                      <p className="text-xs text-muted-foreground">Localização</p>
                      <p className="text-sm">{pendingItem.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={cancelAddItem}>
                Cancelar
              </Button>
              <Button onClick={confirmAddItem} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Layout>
    );
  }

  // HISTORY - Histórico de inventários
  if (stage === 'history') {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Inventários Anteriores</h1>
              <p className="text-muted-foreground mt-1">Histórico de inventários realizados</p>
            </div>
            <Button onClick={() => setStage('menu')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>

          {inventories.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Nenhum inventário realizado</p>
                <p className="text-sm text-muted-foreground mt-2">Comece criando um novo inventário</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventories.map((inv: any) => (
                <Card key={inv.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(inv.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(inv.created_at), "HH:mm:ss")}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Completo</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">
                        <strong>{inv.total_items || inv.inventory_items?.length || 0}</strong> ativo{(inv.total_items || inv.inventory_items?.length || 0) !== 1 ? 's' : ''} lido{(inv.total_items || inv.inventory_items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      onClick={() => downloadInventoryCSV(inv.id)}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar CSV
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return null;
}

