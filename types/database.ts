// ============================================
// FreshTrack AI — Database TypeScript Types
// ============================================
// These types mirror the Supabase PostgreSQL schema exactly.

export type ItemStatus = 'fresh' | 'expiring_soon' | 'critical' | 'expired'

export type ConsumptionAction = 'consumed' | 'expired' | 'discarded'

export type NotificationType = 'critical' | 'warning' | 'info'

export interface InventoryItem {
  id: string
  user_id: string
  product_name: string
  category: string
  expiry_date: string          // DATE as ISO string (YYYY-MM-DD)
  quantity: number
  status: ItemStatus           // Generated column — read-only
  days_remaining: number       // Generated column — read-only
  ocr_confidence: number | null
  added_at: string             // TIMESTAMPTZ as ISO string
  consumed_at: string | null   // TIMESTAMPTZ as ISO string
  is_consumed: boolean
}

export interface ConsumptionLog {
  id: string
  user_id: string
  item_id: string | null       // nullable due to ON DELETE SET NULL
  product_name: string
  category: string
  action: ConsumptionAction
  logged_at: string            // TIMESTAMPTZ as ISO string
}

export interface RecipeHistory {
  id: string
  user_id: string
  title: string
  ingredients_used: string[]
  recipe_markdown: string
  urgency_score: number
  items_saved: number
  generated_at: string         // TIMESTAMPTZ as ISO string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type: NotificationType
  item_id: string | null
  is_read: boolean
  created_at: string           // TIMESTAMPTZ as ISO string
}

// Insert types (omit generated/default columns)
export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'status' | 'days_remaining' | 'added_at'>

export type ConsumptionLogInsert = Omit<ConsumptionLog, 'id' | 'logged_at'>

export type RecipeHistoryInsert = Omit<RecipeHistory, 'id' | 'generated_at'>

export type NotificationInsert = Omit<Notification, 'id' | 'is_read' | 'created_at'>
