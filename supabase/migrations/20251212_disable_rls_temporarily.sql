-- Temporarily disable RLS on all tables to debug the 406 error
-- We will re-enable with proper policies after testing

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programacao_manutencao DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory DISABLE ROW LEVEL SECURITY;
