"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChefHat, Plus, X, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Dietary preferences options
const dietaryOptions = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten-free", label: "Gluten-Free" },
  { id: "dairy-free", label: "Dairy-Free" },
  { id: "low-carb", label: "Low Carb" },
  { id: "keto", label: "Keto" },
]

export default function GenerateRecipePage() {
  // Get expiring ingredients from inventory (in a real app, this would come from a database)
  const [expiringIngredients, setExpiringIngredients] = useState<string[]>([
    "Chicken",
    "Spinach",
    "Yogurt",
    "Bread",
    "Tomatoes",
    "Cheese",
  ])
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([])
  const [newIngredient, setNewIngredient] = useState("")
  const [preferences, setPreferences] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Load ingredients from localStorage if available
  useEffect(() => {
    // Check if we have ingredients passed from the manual entry page
    const storedIngredients = localStorage.getItem("recipeIngredients")
    if (storedIngredients) {
      try {
        const parsedIngredients = JSON.parse(storedIngredients)
        setSelectedIngredients(parsedIngredients)
        // Clear after loading
        localStorage.removeItem("recipeIngredients")
      } catch (error) {
        console.error("Error parsing stored ingredients:", error)
      }
    } else {
      // Default to first 3 expiring ingredients
      setSelectedIngredients(expiringIngredients.slice(0, 3))
    }

    // Try to load inventory items for expiring ingredients
    try {
      const inventory = JSON.parse(localStorage.getItem("inventory") || "[]")
      if (inventory.length > 0) {
        // Sort by days left and get the names
        const sortedItems = inventory
          .sort((a: any, b: any) => a.daysLeft - b.daysLeft)
          .map((item: any) => item.name)
          .slice(0, 6) // Get top 6 items expiring soon

        if (sortedItems.length > 0) {
          setExpiringIngredients(sortedItems)
        }
      }
    } catch (error) {
      console.error("Error loading inventory:", error)
    }
  }, [])

  // Add a new ingredient
  const addIngredient = () => {
    if (newIngredient.trim() && !selectedIngredients.includes(newIngredient.trim())) {
      setSelectedIngredients([...selectedIngredients, newIngredient.trim()])
      setNewIngredient("")
    }
  }

  // Remove an ingredient
  const removeIngredient = (ingredient: string) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i !== ingredient))
  }

  // Toggle a dietary preference
  const togglePreference = (preference: string) => {
    setPreferences(
      preferences.includes(preference) ? preferences.filter((p) => p !== preference) : [...preferences, preference],
    )
  }

  // Generate recipe
  const generateRecipe = async () => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please select at least one ingredient",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setApiKeyMissing(false)

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: selectedIngredients,
          preferences: preferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes("API key")) {
          setApiKeyMissing(true)
          throw new Error("OpenAI API key is missing")
        }
        throw new Error("Failed to generate recipe")
      }

      const data = await response.json()

      // Store the generated recipe in localStorage for the results page
      localStorage.setItem("generatedRecipe", data.recipe)

      // Redirect to results page
      router.push("/recipes/results")
    } catch (error) {
      console.error("Error generating recipe:", error)

      if (String(error).includes("API key")) {
        setApiKeyMissing(true)
        toast({
          title: "API Key Missing",
          description: "Using demo mode with limited functionality",
          variant: "warning",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to generate recipe. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <ChefHat className="mr-2 h-6 w-6" />
        Generate Custom Recipe
      </h1>

      {apiKeyMissing && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-warning mb-1">OpenAI API Key Missing</h3>
              <p className="text-sm text-muted-foreground">
                The application is running in demo mode. Recipe generation will use pre-defined templates instead of AI.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Select Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Expiring soon in your inventory:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {expiringIngredients.map((ingredient) => (
                <Badge
                  key={ingredient}
                  variant={selectedIngredients.includes(ingredient) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedIngredients.includes(ingredient)) {
                      removeIngredient(ingredient)
                    } else {
                      setSelectedIngredients([...selectedIngredients, ingredient])
                    }
                  }}
                >
                  {ingredient}
                  {selectedIngredients.includes(ingredient) && <X className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Add another ingredient"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addIngredient()
                  }
                }}
              />
            </div>
            <Button onClick={addIngredient} type="button">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label className="text-base">Selected Ingredients:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedIngredients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ingredients selected</p>
              ) : (
                selectedIngredients.map((ingredient) => (
                  <Badge key={ingredient} className="flex items-center gap-1">
                    {ingredient}
                    <button
                      onClick={() => removeIngredient(ingredient)}
                      className="ml-1 rounded-full hover:bg-primary-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Dietary Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {dietaryOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={preferences.includes(option.id)}
                  onCheckedChange={() => togglePreference(option.id)}
                />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={generateRecipe} disabled={loading || selectedIngredients.length === 0} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Recipe...
          </>
        ) : (
          <>
            <ChefHat className="mr-2 h-4 w-4" />
            Generate Recipe
          </>
        )}
      </Button>
    </div>
  )
}

