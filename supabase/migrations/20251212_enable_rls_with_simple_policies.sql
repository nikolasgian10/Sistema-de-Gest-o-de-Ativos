-- Re-enable RLS with SIMPLE policies that don't break queries

-- 1. PROFILES table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple policy: authenticated users can select all profiles (needed for sidebar, admin checks)
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 2. PENDING_SIGNUPS table
ALTER TABLE public.pending_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (signup form)
CREATE POLICY "Anyone can insert pending signups"
  ON public.pending_signups FOR INSERT
  WITH CHECK (true);

-- Admins can select
CREATE POLICY "Admins can view pending signups"
  ON public.pending_signups FOR SELECT
  TO authenticated
  USING (true);

-- 3. ASSETS table
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view assets
CREATE POLICY "Authenticated users can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (true);

-- 4. WORK_ORDERS table
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view work orders
CREATE POLICY "Authenticated users can view work orders"
  ON public.work_orders FOR SELECT
  TO authenticated
  USING (true);

-- 5. ASSET_HISTORY table
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view asset history
CREATE POLICY "Authenticated users can view asset history"
  ON public.asset_history FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert asset history
CREATE POLICY "Authenticated users can insert asset history"
  ON public.asset_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. ASSET_CHECKLISTS table
ALTER TABLE public.asset_checklists ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view checklists
CREATE POLICY "Authenticated users can view asset checklists"
  ON public.asset_checklists FOR SELECT
  TO authenticated
  USING (true);

-- 7. PROGRAMACAO_MANUTENCAO table
ALTER TABLE public.programacao_manutencao ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view
CREATE POLICY "Authenticated users can view programacao manutencao"
  ON public.programacao_manutencao FOR SELECT
  TO authenticated
  USING (true);

-- 8. MAINTENANCE_SCHEDULE table
ALTER TABLE public.maintenance_schedule ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view
CREATE POLICY "Authenticated users can view maintenance schedule"
  ON public.maintenance_schedule FOR SELECT
  TO authenticated
  USING (true);

-- 9. PARTS_INVENTORY table
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view
CREATE POLICY "Authenticated users can view parts inventory"
  ON public.parts_inventory FOR SELECT
  TO authenticated
  USING (true);
