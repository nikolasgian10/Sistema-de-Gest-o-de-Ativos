-- Create inventories table
CREATE TABLE IF NOT EXISTS inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by TEXT,
  description TEXT,
  total_items INT DEFAULT 0
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  asset_code TEXT NOT NULL,
  asset_name TEXT,
  location TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_inventories_user_id ON inventories(user_id);
CREATE INDEX IF NOT EXISTS idx_inventories_created_at ON inventories(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_items_inventory_id ON inventory_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_asset_code ON inventory_items(asset_code);

-- Enable RLS
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventories
CREATE POLICY "Users can view their own inventories" ON inventories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create inventories" ON inventories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventories" ON inventories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventories" ON inventories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for inventory_items
CREATE POLICY "Users can view items of their inventories" ON inventory_items
  FOR SELECT USING (
    inventory_id IN (SELECT id FROM inventories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create items in their inventories" ON inventory_items
  FOR INSERT WITH CHECK (
    inventory_id IN (SELECT id FROM inventories WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete items from their inventories" ON inventory_items
  FOR DELETE USING (
    inventory_id IN (SELECT id FROM inventories WHERE user_id = auth.uid())
  );
