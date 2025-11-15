-- Create asset_checklists table
CREATE TABLE IF NOT EXISTS public.asset_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.asset_checklists ENABLE ROW LEVEL SECURITY;

-- Asset checklists policies
CREATE POLICY "Authenticated users can view asset checklists"
  ON public.asset_checklists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert asset checklists"
  ON public.asset_checklists FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update asset checklists"
  ON public.asset_checklists FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete asset checklists"
  ON public.asset_checklists FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_asset_checklists_asset_id ON public.asset_checklists(asset_id);
CREATE INDEX idx_asset_checklists_created_at ON public.asset_checklists(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_asset_checklists_updated_at
  BEFORE UPDATE ON public.asset_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

