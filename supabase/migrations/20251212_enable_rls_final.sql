-- DISABLE RLS COMPLETELY - Remove all problematic policies
-- The app is currently using Supabase auth for security, not RLS

-- Drop ALL policies from all tables
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.tablename || '_policy" ON ' || r.schemaname || '.' || r.tablename || ';';
  END LOOP;
END $$;

-- Disable RLS on all tables
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_signups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_checklists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programacao_manutencao DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory DISABLE ROW LEVEL SECURITY;
