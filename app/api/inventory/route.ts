import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Helper: get authenticated user from request
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

// GET /api/inventory — fetch user's active inventory
export async function GET(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_consumed", false)
      .order("expiry_date", { ascending: true })

    if (error) throw error

    return NextResponse.json({ items: data })
  } catch (error) {
    console.error("Inventory GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    )
  }
}

// POST /api/inventory — add a new item
export async function POST(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { product_name, category, expiry_date, quantity, ocr_confidence } = body

    if (!product_name || !expiry_date) {
      return NextResponse.json(
        { error: "product_name and expiry_date are required" },
        { status: 400 }
      )
    }

    // Insert item
    const { data: item, error } = await supabaseAdmin
      .from("inventory_items")
      .insert({
        user_id: user.id,
        product_name,
        category: category || "Other",
        expiry_date,
        quantity: quantity || 1,
        ocr_confidence: ocr_confidence ?? null,
      })
      .select()
      .single()

    if (error) throw error

    // Check if expiry is within 3 days — create notification
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiry_date)
    expiry.setHours(0, 0, 0, 0)
    const diffMs = expiry.getTime() - today.getTime()
    const daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 3) {
      const notifType = daysUntilExpiry <= 1 ? "critical" : "warning"
      const message =
        daysUntilExpiry <= 0
          ? `${product_name} has expired → Generate a recipe now`
          : `${product_name} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} → Generate a recipe now`

      await supabaseAdmin.from("notifications").insert({
        user_id: user.id,
        message,
        type: notifType,
        item_id: item.id,
      })
    }

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error("Inventory POST error:", error)
    return NextResponse.json(
      { error: "Failed to add item" },
      { status: 500 }
    )
  }
}
