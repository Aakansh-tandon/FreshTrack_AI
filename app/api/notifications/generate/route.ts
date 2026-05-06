import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

async function getUser(request: Request) {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.replace("Bearer ", "")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function POST(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Fetch active inventory items
    const { data: items, error: fetchError } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_consumed", false)

    if (fetchError) throw fetchError
    if (!items || items.length === 0) {
      return NextResponse.json({ generated: 0, skipped: 0, message: "No active items" })
    }

    // 2. Determine midnight for today in UTC to use for deduplication
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfDayISO = today.toISOString()

    // 3. Prepare notifications
    const notificationsToInsert = []
    let skipped = 0
    let generated = 0

    // Fetch existing notifications for today for this user to deduplicate efficiently
    const { data: existingNotifs, error: existingError } = await supabaseAdmin
      .from("notifications")
      .select("item_id")
      .eq("user_id", user.id)
      .gte("created_at", startOfDayISO)

    if (existingError) throw existingError
    const existingItemIds = new Set(existingNotifs?.map(n => n.item_id).filter(Boolean))

    for (const item of items) {
      // Calculate days_remaining
      const expiry = new Date(item.expiry_date)
      expiry.setHours(0, 0, 0, 0)
      const diffMs = expiry.getTime() - today.getTime()
      const days_remaining = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      let message = ""
      let type = ""

      if (days_remaining < 0) {
        message = `⚠️ ${item.product_name} has expired — remove it from your pantry`
        type = "critical"
      } else if (days_remaining === 0) {
        message = `⚠️ ${item.product_name} expires TODAY — remove it from your pantry`
        type = "critical"
      } else if (days_remaining === 1) {
        message = `🚨 ${item.product_name} expires TOMORROW — use it today!`
        type = "critical"
      } else if (days_remaining <= 3) {
        message = `⏰ ${item.product_name} expires in ${days_remaining} days — cook it soon`
        type = "warning"
      } else if (days_remaining <= 7) {
        message = `📅 ${item.product_name} expires in ${days_remaining} days — plan ahead`
        type = "info"
      } else {
        continue // Skip items further out than 7 days
      }

      // Check deduplication
      if (existingItemIds.has(item.id)) {
        skipped++
        continue
      }

      notificationsToInsert.push({
        user_id: user.id,
        item_id: item.id,
        message,
        type,
        is_read: false
      })
    }

    // 4. Insert new notifications
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("notifications")
        .insert(notificationsToInsert)

      if (insertError) throw insertError
      generated = notificationsToInsert.length
    }

    return NextResponse.json({ generated, skipped })
  } catch (error) {
    console.error("Generate Notifications POST error:", error)
    return NextResponse.json(
      { error: "Failed to generate notifications" },
      { status: 500 }
    )
  }
}
