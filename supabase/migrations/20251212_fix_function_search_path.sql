-- Fix search_path for update_updated_at_column function
-- Recreate WITHOUT CASCADE (just update the function, don't drop)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
