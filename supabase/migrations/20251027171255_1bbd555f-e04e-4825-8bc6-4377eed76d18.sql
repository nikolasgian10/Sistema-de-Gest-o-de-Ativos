-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'gestor', 'tecnico')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to insert profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NULL
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT UNIQUE NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('ar_condicionado', 'mecalor', 'ar_maquina')),
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  capacity TEXT,
  location TEXT NOT NULL,
  sector TEXT,
  installation_date DATE,
  operational_status TEXT DEFAULT 'operacional' CHECK (operational_status IN ('operacional', 'manutencao', 'quebrado', 'desativado')),
  qr_code TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Assets policies - all authenticated users can view
CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert assets"
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update assets"
  ON public.assets FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete assets"
  ON public.assets FOR DELETE
  TO authenticated
  USING (true);

-- Create work orders table
CREATE TABLE public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('preventiva', 'corretiva')),
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  scheduled_date DATE NOT NULL,
  completed_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id),
  description TEXT,
  notes TEXT,
  cost DECIMAL(10,2),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Work orders policies
CREATE POLICY "Authenticated users can view work orders"
  ON public.work_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work orders"
  ON public.work_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update work orders"
  ON public.work_orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete work orders"
  ON public.work_orders FOR DELETE
  TO authenticated
  USING (true);

-- Create asset history table
CREATE TABLE public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('manutencao', 'reparo', 'inspecao', 'instalacao', 'desativacao')),
  description TEXT,
  technician_id UUID REFERENCES public.profiles(id),
  photos JSONB DEFAULT '[]'::jsonb,
  checklist_data JSONB,
  signature_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;

-- Asset history policies
CREATE POLICY "Authenticated users can view asset history"
  ON public.asset_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert asset history"
  ON public.asset_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX idx_assets_location ON public.assets(location);
CREATE INDEX idx_assets_operational_status ON public.assets(operational_status);
CREATE INDEX idx_work_orders_asset_id ON public.work_orders(asset_id);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);
CREATE INDEX idx_work_orders_scheduled_date ON public.work_orders(scheduled_date);
CREATE INDEX idx_asset_history_asset_id ON public.asset_history(asset_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();