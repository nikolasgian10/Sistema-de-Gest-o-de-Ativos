import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { generateSingleLabel } from "@/lib/label-generator";
import { toast } from "sonner";

type QRCodeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  code: string; // value encoded in the QR / barcode
  subtitle?: string;
};

export default function QRCodeModal({ open, onOpenChange, title, code, subtitle }: QRCodeModalProps) {
  const providers = useMemo(() => [
    // Google Charts (ainda funciona para QR simples)
    `https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent(code)}`,
    `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`,
    `https://quickchart.io/qr?text=${encodeURIComponent(code)}&size=220&margin=1`,
    // fallback em código de barras
    `https://barcodeapi.org/api/auto/${encodeURIComponent(code)}?width=220&height=220`
  ], [code]);
  const [srcIndex, setSrcIndex] = useState(0);
  const currentSrc = providers[Math.min(srcIndex, providers.length - 1)];
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);

  // Try to generate QR locally (no network) using a dynamic import
  useEffect(() => {
    let mounted = true;
    const gen = async () => {
      try {
        const QR = await import("https://esm.sh/qrcode@1.5.1");
        const url = await QR.toDataURL(code, { width: 220, margin: 1 });
        if (mounted) setDataUrl(url);
      } catch (_) {
        // fallback to external providers handled below
        if (mounted) setDataUrl(null);
      }
    };
    gen();
    return () => { mounted = false; };
  }, [code]);

  const handleDownload = async () => {
    try {
      if (dataUrl) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${(title || "ativo").replace(/\s+/g, "-")}-qrcode.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      const response = await fetch(currentSrc);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "ativo").replace(/\s+/g, "-")}-qrcode.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (_) {
      // ignore
    }
  };

  const handleGenerateLabel = async () => {
    try {
      setIsGeneratingLabel(true);
      const qrToUse = dataUrl || currentSrc;
      await generateSingleLabel(title || code, qrToUse);
      toast.success('Etiqueta gerada com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar etiqueta:', error);
      toast.error('Erro ao gerar etiqueta');
    } finally {
      setIsGeneratingLabel(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            {title || "QR Code do Ativo"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {dataUrl ? (
            <img src={dataUrl} alt="QR Code" className="rounded bg-white p-2 border" />
          ) : (
            <img
              src={currentSrc}
              alt="QR Code"
              className="rounded bg-white p-2 border"
              onError={() => setSrcIndex((i) => i + 1)}
            />
          )}
          <Input readOnly value={code} className="text-center text-xs" />
          {subtitle && <p className="text-xs text-muted-foreground text-center">{subtitle}</p>}
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              Baixar PNG
            </Button>
            <Button onClick={handleGenerateLabel} disabled={isGeneratingLabel} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Tag className="w-4 h-4 mr-2" />
              Gerar Etiqueta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


