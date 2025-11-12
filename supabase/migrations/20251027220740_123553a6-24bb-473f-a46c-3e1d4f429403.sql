-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'tecnico');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create parts_inventory table (Gestão de Peças e Materiais)
CREATE TABLE public.parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name TEXT NOT NULL,
  part_code TEXT UNIQUE NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 10,
  unit_price NUMERIC(10,2),
  supplier TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view parts"
ON public.parts_inventory
FOR SELECT
USING (true);

CREATE POLICY "Gestores and admins can manage parts"
ON public.parts_inventory
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'gestor')
);

-- Create maintenance_schedule table (Planejamento Sistemático)
CREATE TABLE public.maintenance_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  schedule_type TEXT NOT NULL, -- 'mensal', 'semestral', 'anual'
  frequency_months INTEGER NOT NULL, -- 1 for monthly, 6 for semestral
  last_maintenance DATE,
  next_maintenance DATE NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.maintenance_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view schedules"
ON public.maintenance_schedule
FOR SELECT
USING (true);

CREATE POLICY "Gestores and admins can manage schedules"
ON public.maintenance_schedule
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'gestor')
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'work_order', 'maintenance', 'alert'
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger to update timestamps
CREATE TRIGGER update_parts_inventory_updated_at
BEFORE UPDATE ON public.parts_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_schedule_updated_at
BEFORE UPDATE ON public.maintenance_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin role for first user (update with actual user ID after first signup)
-- This is a placeholder - admin should be assigned manually after user creation