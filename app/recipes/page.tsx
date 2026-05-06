"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Utensils, Filter, ChefHat, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Recipe = {
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
  image?: string
}

const skeletonCards = Array.from({ length: 4 })

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [expiringIngredients, setExpiringIngredients] = useState<string[]>([])
  const [inventoryCount, setInventoryCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadRecipes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error("Not authenticated")

      const inventoryResponse = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!inventoryResponse.ok) {
        const errorData = await inventoryResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to load inventory")
      }

      const inventoryData = await inventoryResponse.json()
      const items = inventoryData.items || []
      setInventoryCount(items.length)

      const expiring = items
        .map((item: any) => ({
          ...item,
          days_remaining: Math.floor((new Date(item.expiry_date).getTime() - new Date().getTime()) / 86400000),
        }))
        .filter((item: any) => item.days_remaining <= 7)
        .sort((a: any, b: any) => a.days_remaining - b.days_remaining)
        .map((item: any) => item.product_name)
      setExpiringIngredients(expiring)

      const recipesResponse = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ingredients: [],
          preferences: [],
          mode: "auto",
        }),
      })

      if (!recipesResponse.ok) {
        const errorData = await recipesResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to load recipes")
      }

      const data = await recipesResponse.json()
      const returned = Array.isArray(data.recipes)
        ? data.recipes
        : data.recipe
          ? [data.recipe]
          : []
      setRecipes(returned)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  const bestMatchRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => {
      const aBest = a.best_match ? 1 : 0
      const bBest = b.best_match ? 1 : 0
      return bBest - aBest || (b.items_saved_count || 0) - (a.items_saved_count || 0)
    })
  }, [recipes])

  const quickRecipes = useMemo(() => {
    return recipes.filter((recipe) => (recipe.difficulty || "").toLowerCase() === "easy")
  }, [recipes])

  const inventoryEmpty = !isLoading && !error && inventoryCount === 0

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {skeletonCards.map((_, index) => (
            <Card
              key={`recipe-skeleton-${index}`}
              className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm animate-pulse overflow-hidden"
            >
              <div className="h-48 w-full bg-muted/40" />
              <CardContent className="py-4 space-y-3">
                <div className="h-4 bg-muted/40 rounded w-2/3" />
                <div className="h-3 bg-muted/40 rounded w-full" />
                <div className="h-3 bg-muted/40 rounded w-5/6" />
                <div className="flex gap-2">
                  <div className="h-6 w-24 bg-muted/40 rounded" />
                  <div className="h-6 w-28 bg-muted/40 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">Recipe Suggestions</h1>
        <Link href="/recipes/generate" className="w-full md:w-auto">
          <Button className="w-full md:w-auto min-h-[44px]">
            <ChefHat className="mr-2 h-4 w-4" /> Generate Custom Recipe
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="mb-6 border border-coder-primary/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm">⚠️ Failed to load data — {error}</p>
            <Button
              variant="outline"
              className="border-coder-primary/50 text-coder-primary hover:bg-coder-primary/10 min-h-[44px]"
              onClick={loadRecipes}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {inventoryEmpty && !error && (
        <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-4xl">\ud83e\udd6b</div>
            <div>
              <h2 className="text-xl font-semibold">No items in pantry yet</h2>
              <p className="text-sm text-muted-foreground">Scan your first item to start generating recipes.</p>
            </div>
            <Button
              className="bg-coder-primary hover:bg-coder-primary/80 text-black min-h-[44px]"
              onClick={() => router.push("/scan")}
            >
              Scan Your First Item
            </Button>
          </CardContent>
        </Card>
      )}

      {!inventoryEmpty && !error && (
        <>
          {/* Expiring ingredients section */}
          <Card className="mb-8 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Using Your Expiring Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {expiringIngredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expiring items detected yet.</p>
                ) : (
                  expiringIngredients.map((ingredient) => (
                    <Badge key={ingredient} variant="secondary">
                      {ingredient}
                    </Badge>
                  ))
                )}
              </div>
              <Link href="/recipes/generate">
                <Button className="w-full min-h-[44px]">
                  <Plus className="mr-2 h-4 w-4" /> Create Recipe With These Ingredients
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recipe suggestions tabs */}
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Recipes</TabsTrigger>
                <TabsTrigger value="quick">Quick & Easy</TabsTrigger>
                <TabsTrigger value="best">Best Match</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" className="min-h-[44px]">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>

            <TabsContent value="all" className="mt-0">
              <RecipeGrid recipes={recipes} />
            </TabsContent>

            <TabsContent value="quick" className="mt-0">
              <RecipeGrid recipes={quickRecipes} />
            </TabsContent>

            <TabsContent value="best" className="mt-0">
              <RecipeGrid recipes={bestMatchRecipes} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function RecipeGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return (
      <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-muted-foreground">
          No recipes available yet. Try generating a custom recipe.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recipes.map((recipe, index) => (
        <RecipeCard key={`${recipe.title}-${index}`} recipe={recipe} />
      ))}
    </div>
  )
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const expiringUsed = recipe.expiring_items_used || []
  const expiringUsedCount = recipe.items_saved_count ?? expiringUsed.length
  const ingredients = recipe.ingredients || []
  const timeLabel = recipe.cook_time || recipe.prep_time || "Time not set"

  const isExpiringIngredient = (ingredient: string) => {
    return expiringUsed.some((item) => ingredient.toLowerCase().includes(item.toLowerCase()))
  }

  return (
    <Card className="overflow-hidden w-full">
      {recipe.image ? (
        <img src={recipe.image} alt={recipe.title} className="w-full h-32 md:h-48 object-cover" />
      ) : (
        <div className="w-full h-32 md:h-48 bg-gradient-to-br from-coder-primary/10 to-coder-accent/10 flex items-center justify-center text-6xl">
          {recipe.title.toLowerCase().includes('salad') ? '🥗' :
           recipe.title.toLowerCase().includes('soup') ? '🍲' :
           recipe.title.toLowerCase().includes('curry') || recipe.title.toLowerCase().includes('stew') ? '🥘' :
           recipe.title.toLowerCase().includes('bowl') ? '🍱' : '🍳'}
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="text-lg">{recipe.title}</CardTitle>
          <div className="flex flex-wrap gap-2 justify-end md:flex-col md:items-end">
            <Badge variant="secondary">{ingredients.length} ingredients</Badge>
            <Badge className="bg-coder-primary text-black">
              {expiringUsedCount} expiring items used
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground text-sm mb-4">{recipe.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ingredients.map((ingredient) => (
            <Badge key={ingredient} variant={isExpiringIngredient(ingredient) ? "default" : "outline"}>
              {ingredient}
            </Badge>
          ))}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {timeLabel}
          </div>
          <div className="flex items-center">
            <Utensils className="mr-1 h-4 w-4" />
            {recipe.difficulty || "Easy"}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full min-h-[44px]">
          View Recipe
        </Button>
      </CardFooter>
    </Card>
  )
}

