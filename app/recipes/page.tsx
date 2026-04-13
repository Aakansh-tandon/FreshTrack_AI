"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Utensils, Filter, ChefHat, Plus } from "lucide-react"

// Sample expiring ingredients
const expiringIngredients = ["Chicken", "Spinach", "Yogurt", "Bread"]

// Sample recipe data
const sampleRecipes = [
  {
    id: 1,
    title: "Chicken & Spinach Salad",
    description: "A healthy salad with grilled chicken and fresh spinach",
    ingredients: ["Chicken", "Spinach", "Yogurt", "Olive Oil", "Lemon"],
    cookingTime: "20 mins",
    difficulty: "Easy",
    matchedIngredients: 3,
    image: "/Grilled-Chicken-and-Spinach-Salad.jpeg?height=200&width=400",
  },
  {
    id: 2,
    title: "Spinach & Yogurt Smoothie",
    description: "Refreshing smoothie perfect for breakfast",
    ingredients: ["Spinach", "Yogurt", "Banana", "Honey", "Almond Milk"],
    cookingTime: "5 mins",
    difficulty: "Easy",
    matchedIngredients: 2,
    image: "/Banana-Spinach-Smoothie.jpg?height=200&width=400",
  },
  {
    id: 3,
    title: "Chicken Sandwich",
    description: "Classic chicken sandwich with fresh ingredients",
    ingredients: ["Chicken", "Bread", "Lettuce", "Tomato", "Mayo"],
    cookingTime: "15 mins",
    difficulty: "Easy",
    matchedIngredients: 2,
    image: "/sandwich.jpg?height=200&width=400",
  },
]

export default function RecipesPage() {
  const [recipes, setRecipes] = useState(sampleRecipes)

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">Recipe Suggestions</h1>
        <Link href="/recipes/generate">
          <Button>
            <ChefHat className="mr-2 h-4 w-4" /> Generate Custom Recipe
          </Button>
        </Link>
      </div>

      {/* Expiring ingredients section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Using Your Expiring Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {expiringIngredients.map((ingredient) => (
              <Badge key={ingredient} variant="secondary">
                {ingredient}
              </Badge>
            ))}
          </div>
          <Link href="/recipes/generate">
            <Button className="w-full">
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
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quick" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes
              .filter((recipe) => recipe.cookingTime.includes("5") || recipe.cookingTime.includes("10"))
              .map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="best" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes
              .sort((a, b) => b.matchedIngredients - a.matchedIngredients)
              .map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Recipe card component
function RecipeCard({ recipe }: { recipe: any }) {
  return (
    <Card className="overflow-hidden">
      <img src={recipe.image || "/placeholder.svg"} alt={recipe.title} className="w-full h-48 object-cover" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{recipe.title}</CardTitle>
          <Badge variant="secondary">{recipe.matchedIngredients} ingredients match</Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-muted-foreground text-sm mb-4">{recipe.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.ingredients.map((ingredient: string) => (
            <Badge key={ingredient} variant={expiringIngredients.includes(ingredient) ? "default" : "outline"}>
              {ingredient}
            </Badge>
          ))}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {recipe.cookingTime}
          </div>
          <div className="flex items-center">
            <Utensils className="mr-1 h-4 w-4" />
            {recipe.difficulty}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          View Recipe
        </Button>
      </CardFooter>
    </Card>
  )
}

