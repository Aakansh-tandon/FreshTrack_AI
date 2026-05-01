import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { createClient } from "@supabase/supabase-js"

type RecipePayload = {
  title: string
  description?: string
  prep_time?: string
  cook_time?: string
  difficulty?: string
  ingredients?: string[]
  instructions?: string[]
  expiring_items_used?: string[]
  items_saved_count?: number
  urgency_score?: number
  best_match?: boolean
  rank?: number
}

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

function normalizeRecipe(raw: any): RecipePayload {
  const expiringUsed = Array.isArray(raw?.expiring_items_used) ? raw.expiring_items_used : []

  return {
    title: String(raw?.title || "Untitled Recipe"),
    description: typeof raw?.description === "string" ? raw.description : "",
    prep_time: typeof raw?.prep_time === "string" ? raw.prep_time : "",
    cook_time: typeof raw?.cook_time === "string" ? raw.cook_time : "",
    difficulty: typeof raw?.difficulty === "string" ? raw.difficulty : "",
    ingredients: Array.isArray(raw?.ingredients) ? raw.ingredients : [],
    instructions: Array.isArray(raw?.instructions) ? raw.instructions : [],
    expiring_items_used: expiringUsed,
    items_saved_count:
      typeof raw?.items_saved_count === "number"
        ? raw.items_saved_count
        : expiringUsed.length,
    urgency_score: typeof raw?.urgency_score === "number" ? raw.urgency_score : 0,
  }
}

function rankRecipes(recipes: RecipePayload[]) {
  const ranked = [...recipes].sort(
    (a, b) =>
      (b.items_saved_count || 0) - (a.items_saved_count || 0) ||
      (b.urgency_score || 0) - (a.urgency_score || 0)
  )

  return ranked.map((recipe, index) => ({
    ...recipe,
    rank: index + 1,
    best_match: index === 0,
  }))
}

function buildMockRecipe(ingredients: string[], preferences: string[]): RecipePayload {
  const safeIngredients = ingredients.length > 0 ? ingredients : ["Seasonal Vegetables"]
  const titleSeed = safeIngredients[0]
  const preferenceLine = preferences.length
    ? `Aligned with ${preferences.join(", ")} preferences.`
    : "A flexible recipe that works with what you have on hand."

  return {
    title: `${titleSeed} Rescue Bowl`,
    description: `A simple dish that reduces food waste. ${preferenceLine}`,
    prep_time: "10 mins",
    cook_time: "15 mins",
    difficulty: "Easy",
    ingredients: [
      `2 cups ${titleSeed}`,
      ...safeIngredients.slice(1).map((item) => `1 cup ${item}`),
      "1 tbsp olive oil",
      "Salt and pepper to taste",
    ],
    instructions: [
      "Prepare the ingredients by washing and chopping.",
      "Warm olive oil in a pan over medium heat.",
      `Add ${titleSeed} and cook for 4 to 5 minutes.`,
      "Stir in the remaining ingredients and cook until tender.",
      "Season to taste and serve warm.",
    ],
    expiring_items_used: safeIngredients,
    items_saved_count: safeIngredients.length,
    urgency_score: 0,
  }
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

export async function POST(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const ingredients = Array.isArray(body?.ingredients) ? body.ingredients : []
    const preferences = Array.isArray(body?.preferences) ? body.preferences : []
    const mode = body?.mode === "auto" || body?.mode === "custom" ? body.mode : "custom"

    if (mode === "custom" && ingredients.length === 0) {
      return NextResponse.json({ error: "Ingredients are required" }, { status: 400 })
    }

    let inventoryItems: any[] = []
    if (mode === "auto") {
      const { data, error } = await supabaseAdmin
        .from("inventory_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_consumed", false)
        .order("expiry_date", { ascending: true })

      if (error) throw error
      inventoryItems = (data || [])
        .map((item) => ({
          ...item,
          ...deriveInventoryMeta(item.expiry_date),
        }))
        .filter((item) => item.status === "critical" || item.status === "expiring_soon")
        .sort((a, b) => a.days_remaining - b.days_remaining)

      if (inventoryItems.length === 0) {
        return NextResponse.json({ success: true, recipes: [] })
      }
    }

    const fastApiUrl = process.env.FASTAPI_URL
    const useDemo = !fastApiUrl

    let recipeResult: any = null

    if (useDemo) {
      const sourceIngredients = mode === "auto"
        ? inventoryItems.map((item) => item.product_name)
        : ingredients
      recipeResult = buildMockRecipe(sourceIngredients, preferences)
    } else if (mode === "auto") {
      const itemsPayload = inventoryItems.map((item) => ({
        product_name: item.product_name,
        category: item.category,
        days_remaining: item.days_remaining,
        quantity: item.quantity,
        urgency_score: item.urgency_score,
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
      recipeResult = fastApiData.recipe
      if (!recipeResult || recipeResult.error) {
        return NextResponse.json(
          { error: recipeResult?.message || "Recipe generation failed" },
          { status: 502 }
        )
      }
    } else {
      const fastApiResponse = await fetch(`${fastApiUrl}/custom-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, preferences }),
      })

      if (!fastApiResponse.ok) {
        throw new Error(`FastAPI responded with ${fastApiResponse.status}`)
      }

      const fastApiData = await fastApiResponse.json()
      recipeResult = fastApiData.recipe
      if (!recipeResult || recipeResult.error) {
        return NextResponse.json(
          { error: recipeResult?.message || "Recipe generation failed" },
          { status: 502 }
        )
      }
    }

    const recipesRaw = Array.isArray(recipeResult)
      ? recipeResult
      : recipeResult
        ? [recipeResult]
        : []

    const normalized = recipesRaw.map(normalizeRecipe)
    const ranked = rankRecipes(normalized)

    if (ranked.length > 0) {
      const insertPayload = ranked.map((recipe) => ({
        user_id: user.id,
        title: recipe.title,
        ingredients_used: recipe.expiring_items_used || [],
        recipe_markdown: JSON.stringify(recipe),
        urgency_score: recipe.urgency_score || 0,
        items_saved: recipe.items_saved_count || 0,
      }))

      const { error: saveError } = await supabaseAdmin
        .from("recipe_history")
        .insert(insertPayload)

      if (saveError) throw saveError
    }

    return NextResponse.json({ success: true, recipes: ranked, demo: useDemo })
  } catch (error) {
    console.error("Recipe generation error:", error)
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 })
  }
}

