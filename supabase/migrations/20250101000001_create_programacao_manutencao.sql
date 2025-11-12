-- Create ProgramacaoManutencao table for systematic maintenance planning
CREATE TABLE public.programacao_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  localizacao TEXT NOT NULL,
  ano INTEGER NOT NULL,
  semanas_programadas INTEGER[] NOT NULL, -- Array of week indices (0-51)
  semanas_semestrais INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Array of semestral week indices
  observacoes TEXT,
  criado_por TEXT, -- Email do usuário
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
  -- Constraint: Only one active program per location/year
  -- This is enforced by application logic, not a unique constraint
);

-- Create index for faster queries
CREATE INDEX idx_programacao_manutencao_localizacao_ano ON public.programacao_manutencao(localizacao, ano);
CREATE INDEX idx_programacao_manutencao_ativa ON public.programacao_manutencao(ativa) WHERE ativa = true;

-- Enable RLS
ALTER TABLE public.programacao_manutencao ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view programacoes"
ON public.programacao_manutencao
FOR SELECT
USING (true);

CREATE POLICY "Gestores and admins can manage programacoes"
ON public.programacao_manutencao
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'gestor')
  )
);

-- Add trigger to update updated_at
CREATE TRIGGER update_programacao_manutencao_updated_at
BEFORE UPDATE ON public.programacao_manutencao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

