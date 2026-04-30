-- ============================================
-- FreshTrack AI — Supabase Database Schema
-- ============================================
-- Users table is handled by Supabase Auth (auth.users) automatically

-- Inventory items
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Other',
  expiry_date DATE NOT NULL,
  quantity INTEGER DEFAULT 1,
  status TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN expiry_date < CURRENT_DATE THEN 'expired'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'critical'
      WHEN expiry_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
      ELSE 'fresh'
    END
  ) STORED,
  days_remaining INTEGER GENERATED ALWAYS AS (
    (expiry_date - CURRENT_DATE)::INTEGER
  ) STORED,
  ocr_confidence FLOAT DEFAULT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  consumed_at TIMESTAMPTZ DEFAULT NULL,
  is_consumed BOOLEAN DEFAULT FALSE
);

-- Consumption tracking
CREATE TABLE consumption_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('consumed', 'expired', 'discarded')),
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- Generated recipes (cache + history)
CREATE TABLE recipe_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  ingredients_used TEXT[] NOT NULL,
  recipe_markdown TEXT NOT NULL,
  urgency_score FLOAT NOT NULL,
  items_saved INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Row Level Security (CRITICAL — enable on all tables)
-- ============================================
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies — users can only access their own data
CREATE POLICY "Users own inventory" ON inventory_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own logs" ON consumption_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own recipes" ON recipe_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
