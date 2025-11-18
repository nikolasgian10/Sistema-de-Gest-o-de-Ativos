import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface FormularioCadastroProps {
  onSubmit: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function FormularioCadastro({
  onSubmit,
  initialData,
  isLoading,
}: FormularioCadastroProps) {
  const [formData, setFormData] = useState({
    asset_code: initialData?.asset_code || "",
    asset_type: initialData?.asset_type || "",
    brand: initialData?.brand || "",
    model: initialData?.model || "",
    serial_number: initialData?.serial_number || "",
    location: initialData?.location || "",
    sector: initialData?.sector || "",
    capacity: initialData?.capacity || "",
    operational_status: initialData?.operational_status || "operacional",
    installation_date: initialData?.installation_date || "",
    maintenance_frequency: initialData?.maintenance_frequency || "",
    warranty_expiration: initialData?.warranty_expiration || "",
    last_maintenance: initialData?.last_maintenance || "",
    purchase_cost: initialData?.purchase_cost || "",
    technical_specs: initialData?.technical_specs || "",
    notes: initialData?.notes || "",
    bem_matrimonial: initialData?.bem_matrimonial || "",
    sigla_local: initialData?.sigla_local || "",
    altura_option: initialData?.altura_option || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="asset_code">Código do Ativo *</Label>
          <Input
            id="asset_code"
            value={formData.asset_code}
            onChange={(e) =>
              setFormData({ ...formData, asset_code: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="asset_type">Tipo de Ativo *</Label>
          <Select
            value={formData.asset_type}
            onValueChange={(value) =>
              setFormData({ ...formData, asset_type: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ar_condicionado">Ar Condicionado</SelectItem>
              <SelectItem value="chiller">Chiller</SelectItem>
              <SelectItem value="split">Split</SelectItem>
              <SelectItem value="mecalor">Mecalor</SelectItem>
              <SelectItem value="ar_maquina">Ar Máquina</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="serial_number">Número de Série</Label>
          <Input
            id="serial_number"
            value={formData.serial_number}
            onChange={(e) =>
              setFormData({ ...formData, serial_number: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="location">Localização *</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="sector">Setor</Label>
          <Input
            id="sector"
            value={formData.sector}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="sigla_local">Sigla do Local</Label>
          <Input
            id="sigla_local"
            value={formData.sigla_local}
            onChange={(e) => setFormData({ ...formData, sigla_local: e.target.value })}
            placeholder="Ex: SL-01"
          />
        </div>

        <div>
          <Label htmlFor="capacity">Capacidade</Label>
          <Input
            id="capacity"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({ ...formData, capacity: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="altura_option">Altura (Opção A / B)</Label>
          <Select
            value={formData.altura_option}
            onValueChange={(value) => setFormData({ ...formData, altura_option: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Não informado</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="operational_status">Status Operacional *</Label>
          <Select
            value={formData.operational_status}
            onValueChange={(value) =>
              setFormData({ ...formData, operational_status: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="operacional">Operacional</SelectItem>
              <SelectItem value="manutencao">Em Manutenção</SelectItem>
              <SelectItem value="quebrado">Quebrado</SelectItem>
              <SelectItem value="desativado">Desativado</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="bem_matrimonial">Bem Matrimonial</Label>
          <Input
            id="bem_matrimonial"
            value={formData.bem_matrimonial}
            onChange={(e) => setFormData({ ...formData, bem_matrimonial: e.target.value })}
            placeholder="Código do bem (ex: BM-123)"
          />
        </div>

        <div>
          <Label htmlFor="installation_date">Data de Instalação</Label>
          <Input
            type="date"
            id="installation_date"
            value={formData.installation_date}
            onChange={(e) =>
              setFormData({ ...formData, installation_date: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="maintenance_frequency">
            Frequência de Manutenção *
          </Label>
          <Select
            value={formData.maintenance_frequency}
            onValueChange={(value) =>
              setFormData({ ...formData, maintenance_frequency: value })
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensal">Mensal</SelectItem>
              <SelectItem value="bimestral">Bimestral</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="semestral">Semestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="warranty_expiration">Data Fim da Garantia</Label>
          <Input
            type="date"
            id="warranty_expiration"
            value={formData.warranty_expiration}
            onChange={(e) =>
              setFormData({ ...formData, warranty_expiration: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="last_maintenance">Última Manutenção</Label>
          <Input
            type="date"
            id="last_maintenance"
            value={formData.last_maintenance}
            onChange={(e) =>
              setFormData({ ...formData, last_maintenance: e.target.value })
            }
          />
        </div>

        <div>
          <Label htmlFor="purchase_cost">Custo de Aquisição (R$)</Label>
          <Input
            type="number"
            id="purchase_cost"
            value={formData.purchase_cost}
            onChange={(e) =>
              setFormData({ ...formData, purchase_cost: e.target.value })
            }
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="technical_specs">Especificações Técnicas</Label>
          <Textarea
            id="technical_specs"
            value={formData.technical_specs}
            onChange={(e) =>
              setFormData({ ...formData, technical_specs: e.target.value })
            }
            placeholder="Descreva as especificações técnicas do equipamento"
          />
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Observações adicionais"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}