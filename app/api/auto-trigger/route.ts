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

function deriveInventoryMeta(expiryDate: string) {
  const days_remaining = Math.floor(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const status = days_remaining < 0
    ? "expired"
    : days_remaining <= 3
      ? "critical"
      : days_remaining <= 7
        ? "expiring_soon"
        : "fresh"

  return { days_remaining, status }
}

// GET /api/auto-trigger — automatically generate recipe for critical items
export async function GET(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Get items and derive freshness metadata in JS
    const { data: inventoryItems, error: invError } = await supabaseAdmin
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_consumed", false)
      .order("expiry_date", { ascending: true })

    if (invError) throw invError

    const criticalItems = (inventoryItems || [])
      .map((item) => ({
        ...item,
        ...deriveInventoryMeta(item.expiry_date),
      }))
      .filter((item) => item.days_remaining <= 3)
      .sort((a, b) => a.days_remaining - b.days_remaining)

    if (!criticalItems || criticalItems.length === 0) {
      return NextResponse.json({
        triggered: false,
        message: "No critical items found",
      })
    }

    // 2. Check if a recipe was generated in the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    const { data: recentRecipes, error: recipeCheckError } = await supabaseAdmin
      .from("recipe_history")
      .select("id")
      .eq("user_id", user.id)
      .gte("generated_at", sixHoursAgo)
      .limit(1)

    if (recipeCheckError) throw recipeCheckError

    if (recentRecipes && recentRecipes.length > 0) {
      return NextResponse.json({
        triggered: false,
        message: "Recipe already generated recently",
      })
    }

    // 3. POST to FastAPI /auto-recipe
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000"
    const itemsPayload = criticalItems.map((item) => ({
      product_name: item.product_name,
      category: item.category,
      days_remaining: item.days_remaining,
      quantity: item.quantity,
    }))

    const fastApiResponse = await fetch(`${fastApiUrl}/auto-recipe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: itemsPayload }),
    })

    if (!fastApiResponse.ok) {
      throw new Error(`FastAPI responded with ${fastApiResponse.status}`)
    }

    const fastApiData = await fastApiResponse.json()

    if (!fastApiData.recipe || fastApiData.recipe.error) {
      return NextResponse.json({
        triggered: false,
        message: fastApiData.recipe?.message || "Recipe generation failed",
      })
    }

    const recipe = fastApiData.recipe

    // 4. Save recipe to recipe_history
    const usedItems = recipe.expiring_items_used || []
    const { error: saveError } = await supabaseAdmin
      .from("recipe_history")
      .insert({
        user_id: user.id,
        title: recipe.title,
        ingredients_used: usedItems,
        recipe_markdown: JSON.stringify(recipe),
        urgency_score: recipe.urgency_score || 0,
        items_saved: recipe.items_saved_count || 0,
      })

    if (saveError) throw saveError

    // 5. Create notification
    const itemNames = usedItems.slice(0, 3).join(", ")
    const { error: notifError } = await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: user.id,
        message: `🍳 Auto-recipe ready: ${recipe.title} — uses your ${itemNames} expiring today`,
        type: "critical",
      })

    if (notifError) throw notifError

    // 6. Call notification generator internally
    try {
      const authHeader = request.headers.get("Authorization")
      const baseUrl = request.headers.get("host") ? `http://${request.headers.get("host")}` : "http://localhost:3000"
      
      if (authHeader) {
        // Fire and forget
        fetch(`${baseUrl}/api/notifications/generate`, {
          method: "POST",
          headers: { "Authorization": authHeader }
        }).catch(e => console.error("Internal generator call failed", e))
      }
    } catch (e) {
      console.error("Internal generator block failed", e)
    }

    return NextResponse.json({
      triggered: true,
      recipe_title: recipe.title,
    })
  } catch (error) {
    console.error("Auto-trigger error:", error)
    return NextResponse.json(
      { error: "Auto-trigger failed" },
      { status: 500 }
    )
  }
}
