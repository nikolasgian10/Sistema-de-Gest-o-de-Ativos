-- Disable RLS on all tables permanently
-- We will use Supabase's built-in auth system instead of row-level policies

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programacao_manutencao DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory DISABLE ROW LEVEL SECURITY;
