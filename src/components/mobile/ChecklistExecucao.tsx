import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Camera, ArrowLeft } from 'lucide-react';

type ChecklistExecucaoProps = {
  checklist: any;
  ativo?: any;
  onSalvar: (dados: any) => void;
  onVoltar?: () => void;
};

export default function ChecklistExecucao({ checklist, ativo, onSalvar, onVoltar }: ChecklistExecucaoProps) {
  const itens: any[] = checklist?.itens || checklist?.items || checklist?.perguntas || [];
  const [respostas, setRespostas] = useState<any[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [fotos, setFotos] = useState<File[]>([]);

  useEffect(() => {
    // initialize respostas with default values
    setRespostas(itens.map((it) => ({ id: it.id || it.key || Math.random().toString(36).slice(2), label: it.label || it.title || it.text || 'Item', status: 'ok', nota: '' })));
  }, [checklist, itens]);

  const toggleResposta = (idx: number, status?: string) => {
    setRespostas((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], status: status || (copy[idx].status === 'ok' ? 'nok' : 'ok') };
      return copy;
    });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFotos((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  const handleSalvar = () => {
    const dados = {
      respostas,
      observacoes_gerais: observacoes,
      fotos: fotos.map((f) => f.name),
      timestamp: new Date().toISOString(),
    };
    onSalvar(dados);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-6">
        {onVoltar && (
          <Button variant="ghost" size="icon" onClick={onVoltar} className="text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h2 className="text-xl font-bold">{checklist?.name || checklist?.nome || 'Checklist'}</h2>
          {ativo && <p className="text-sm text-muted-foreground">{ativo.asset_code || ativo.name}</p>}
        </div>
      </div>

      <Card className="mb-4">
        <CardContent>
          <div className="space-y-4">
            {itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item no checklist.</p>}
            {itens.map((it, idx) => (
              <div key={respostas[idx]?.id || idx} className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="font-medium">{it.label || it.title || it.text || `Item ${idx+1}`}</p>
                  {it.hint && <p className="text-xs text-muted-foreground">{it.hint}</p>}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant={respostas[idx]?.status === 'ok' ? 'default' : 'outline'} onClick={() => toggleResposta(idx, 'ok')}>OK</Button>
                    <Button size="sm" variant={respostas[idx]?.status === 'nok' ? 'destructive' : 'outline'} onClick={() => toggleResposta(idx, 'nok')}>NOK</Button>
                    <Input placeholder="Nota (opcional)" value={respostas[idx]?.nota || ''} onChange={(e) => {
                      const val = e.target.value;
                      setRespostas((prev) => { const copy = [...prev]; copy[idx] = { ...copy[idx], nota: val }; return copy; });
                    }} className="ml-2" />
                  </div>
                </div>
              </div>
            ))}

            <div>
              <p className="font-medium mb-2">Observações gerais</p>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações, passos realizados, recomendações..." />
            </div>

            <div>
              <p className="font-medium mb-2">Fotos</p>
              <div className="flex gap-2 items-center">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <Camera className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleFotoChange} multiple className="hidden" />
                </label>
                <div className="text-sm text-muted-foreground">{fotos.length} foto(s) selecionada(s)</div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSalvar} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Salvar Checklist</Button>
              <Button variant="ghost" onClick={() => { if (onVoltar) onVoltar(); }}>Cancelar</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
