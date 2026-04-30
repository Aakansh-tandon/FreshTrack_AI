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

// PATCH /api/inventory/[id] — mark item as consumed or discarded
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { action } = body // 'consumed' | 'discarded'

    if (!action || !["consumed", "discarded"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'consumed' or 'discarded'" },
        { status: 400 }
      )
    }

    // Fetch the item first to get product_name and category for the log
    const { data: item, error: fetchError } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Soft delete: mark as consumed
    const { error: updateError } = await supabaseAdmin
      .from("inventory_items")
      .update({ is_consumed: true, consumed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) throw updateError

    // Insert consumption log
    const logAction = action === "consumed" ? "consumed" : "discarded"
    const { error: logError } = await supabaseAdmin
      .from("consumption_logs")
      .insert({
        user_id: user.id,
        item_id: id,
        product_name: item.product_name,
        category: item.category,
        action: logAction,
      })

    if (logError) throw logError

    return NextResponse.json({
      success: true,
      message: `Item marked as ${logAction}`,
    })
  } catch (error) {
    console.error("Inventory PATCH error:", error)
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    )
  }
}

// DELETE /api/inventory/[id] — soft delete (consumed)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Fetch item for log data
    const { data: item, error: fetchError } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Soft delete
    const { error: updateError } = await supabaseAdmin
      .from("inventory_items")
      .update({ is_consumed: true, consumed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)

    if (updateError) throw updateError

    // Insert consumption log
    const { error: logError } = await supabaseAdmin
      .from("consumption_logs")
      .insert({
        user_id: user.id,
        item_id: id,
        product_name: item.product_name,
        category: item.category,
        action: "consumed",
      })

    if (logError) throw logError

    return NextResponse.json({ success: true, message: "Item removed" })
  } catch (error) {
    console.error("Inventory DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    )
  }
}
