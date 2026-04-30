"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Save, ArrowLeft, ChefHat } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

// Sample categories
const categories = [
  { value: "Dairy", label: "Dairy" },
  { value: "Meat", label: "Meat" },
  { value: "Produce", label: "Produce" },
  { value: "Bakery", label: "Bakery" },
  { value: "Frozen", label: "Frozen" },
  { value: "Canned", label: "Canned" },
  { value: "Beverages", label: "Beverages" },
  { value: "Snacks", label: "Snacks" },
  { value: "Other", label: "Other" },
]

export default function AddManualPage() {
  const [productName, setProductName] = useState("")
  const [category, setCategory] = useState("")
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined)
  const [quantity, setQuantity] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productName || !category || !expiryDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        toast({
          title: "Error",
          description: "You must be logged in to add items",
          variant: "destructive",
        })
        return
      }

      // Format date as YYYY-MM-DD for Supabase DATE column
      const formattedDate = expiryDate.toISOString().split("T")[0]

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_name: productName,
          category,
          expiry_date: formattedDate,
          quantity: Number.parseInt(quantity),
        }),
      })

      if (!response.ok) throw new Error("Failed to save item")

      toast({
        title: "Product added",
        description: "Product has been added to your inventory",
      })

      // Redirect to inventory page
      router.push("/inventory")
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const goToRecipes = () => {
    // Store the current product in localStorage for recipe generation
    if (productName) {
      localStorage.setItem("recipeIngredients", JSON.stringify([productName]))
      router.push("/recipes/generate")
    } else {
      toast({
        title: "Product name required",
        description: "Please enter a product name first",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <Link href="/scan">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-center">Add Product Manually</h1>
        <div className="w-[70px]"></div> {/* Spacer for centering */}
      </div>

      <Card className="border-coder-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-coder-primary">Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="e.g. Milk, Bread, Chicken"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
                className="border-coder-primary/30 focus:border-coder-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category" className="border-coder-primary/30 focus:border-coder-primary">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-coder-primary/30 focus:border-coder-primary",
                      !expiryDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Select value={quantity} onValueChange={setQuantity}>
                <SelectTrigger id="quantity" className="border-coder-primary/30 focus:border-coder-primary">
                  <SelectValue placeholder="Select quantity" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-coder-primary hover:bg-coder-primary/80 text-black"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : "Save Product"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 border-coder-accent/50 text-coder-accent hover:bg-coder-accent/10"
                onClick={goToRecipes}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Find Recipes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
