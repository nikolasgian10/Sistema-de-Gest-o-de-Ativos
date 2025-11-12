import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, ScanBarcode, Search } from "lucide-react";

interface ScannerQRProps {
  onScan: (codigo: string) => void;
}

export default function ScannerQR({ onScan }: ScannerQRProps) {
  const [codigo, setCodigo] = useState("");

  const handleBuscar = () => {
    if (codigo.trim()) {
      onScan(codigo.trim());
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/50">
            <div className="text-center space-y-2">
              <ScanBarcode className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Código de Barras</p>
              <p className="text-xs text-muted-foreground">
                Use leitor USB ou digite manualmente
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/50">
            <div className="text-center space-y-2">
              <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">QR Code / RFID</p>
              <p className="text-xs text-muted-foreground">
                Aproxime o tag do leitor
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Digite ou escaneie o código..."
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
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
            O código será inserido automaticamente no campo acima.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
