import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormularioOSProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
  ativos?: any[];
}

export default function FormularioOS({ onSubmit, initialData, isLoading, ativos = [] }: FormularioOSProps) {
  const [formData, setFormData] = useState({
    order_number: initialData?.order_number || `OS-${Date.now()}`,
    asset_id: initialData?.asset_id || '',
    order_type: initialData?.order_type || 'preventiva',
    priority: initialData?.priority || 'normal',
    status: initialData?.status || 'pendente',
    scheduled_date: initialData?.scheduled_date || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="order_number">Número da OS *</Label>
          <Input
            id="order_number"
            value={formData.order_number}
            onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="asset_id">Ativo *</Label>
          <Select value={formData.asset_id} onValueChange={(value) => setFormData({ ...formData, asset_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ativo" />
            </SelectTrigger>
            <SelectContent>
              {ativos.map((ativo) => (
                <SelectItem key={ativo.id} value={ativo.id}>
                  {ativo.asset_code} - {ativo.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="order_type">Tipo *</Label>
          <Select value={formData.order_type} onValueChange={(value) => setFormData({ ...formData, order_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preventiva">Preventiva</SelectItem>
              <SelectItem value="corretiva">Corretiva</SelectItem>
              <SelectItem value="preditiva">Preditiva</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="scheduled_date">Data Prevista *</Label>
        <Input
          id="scheduled_date"
          type="date"
          value={formData.scheduled_date}
          onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar OS'}
        </Button>
      </div>
    </form>
  );
}
