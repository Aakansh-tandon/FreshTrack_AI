-- FreshTrack AI demo inventory seed.
-- To find the demo user UUID in Supabase: Authentication > Users, open demo@freshtrack.ai, and copy the user ID.

INSERT INTO inventory_items (
  user_id,
  product_name,
  category,
  expiry_date,
  quantity,
  ocr_confidence,
  is_consumed
)
VALUES
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Milk', 'Dairy', CURRENT_DATE + INTERVAL '1 day', 1, 92.4, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Bread', 'Bakery', CURRENT_DATE + INTERVAL '2 days', 1, 88.1, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Chicken', 'Meat', CURRENT_DATE + INTERVAL '1 day', 2, 84.7, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Spinach', 'Produce', CURRENT_DATE + INTERVAL '3 days', 1, 79.3, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Yogurt', 'Dairy', CURRENT_DATE + INTERVAL '4 days', 3, 90.2, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Tomatoes', 'Produce', CURRENT_DATE + INTERVAL '5 days', 4, 86.5, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Cheese', 'Dairy', CURRENT_DATE + INTERVAL '6 days', 1, 91.0, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Eggs', 'Dairy', CURRENT_DATE + INTERVAL '7 days', 12, 93.1, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Salmon', 'Seafood', CURRENT_DATE + INTERVAL '2 days', 1, 82.6, FALSE),
  ('d8ee9b05-c049-4bae-ae58-331e2fec6e60', 'Apples', 'Produce', CURRENT_DATE + INTERVAL '10 days', 6, 77.8, FALSE);
