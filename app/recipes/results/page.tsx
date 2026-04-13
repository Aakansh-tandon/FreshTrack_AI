"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChefHat, ArrowLeft, BookmarkPlus, Share2, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RecipeResultsPage() {
  const [recipe, setRecipe] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Get the recipe from localStorage
    const storedRecipe = localStorage.getItem("generatedRecipe")
    if (storedRecipe) {
      setRecipe(storedRecipe)
    }
    setLoading(false)
  }, [])

  // Format recipe text with proper HTML
  const formatRecipe = (text: string) => {
    // Split by double newlines to separate sections
    const sections = text.split(/\n\n+/)

    if (sections.length === 0) return text

    // Extract title from the first section
    const title = sections[0].trim()

    // Format the rest of the content
    const formattedSections = sections.slice(1).map((section, index) => {
      // Check if this section is a list (ingredients or steps)
      if (section.includes("\n1.") || section.includes("\n- ") || section.includes("\n* ")) {
        // Convert numbered or bulleted lists to HTML lists
        const listItems = section
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            // Remove list markers (1., -, *) and trim
            const content = line.replace(/^\d+\.|-|\*\s+/, "").trim()
            return content ? `<li>${content}</li>` : ""
          })
          .join("")

        return `<ul class="list-disc pl-5 my-3">${listItems}</ul>`
      }

      // Check if this is a section header
      if (
        section.toLowerCase().includes("ingredients:") ||
        section.toLowerCase().includes("instructions:") ||
        section.toLowerCase().includes("steps:") ||
        section.toLowerCase().includes("directions:")
      ) {
        const [header, ...content] = section.split("\n")
        return `<h3 class="font-bold text-lg mt-4 mb-2">${header}</h3>
                <p>${content.join("<br />")}</p>`
      }

      // Regular paragraph
      return `<p class="my-2">${section.replace(/\n/g, "<br />")}</p>`
    })

    return `
      <h2 class="text-2xl font-bold mb-4">${title}</h2>
      ${formattedSections.join("")}
    `
  }

  // Save recipe
  const saveRecipe = () => {
    // In a real app, this would save to a database
    toast({
      title: "Recipe Saved",
      description: "Recipe has been saved to your collection",
    })
  }

  // Share recipe
  const shareRecipe = () => {
    // In a real app, this would open a share dialog
    toast({
      title: "Share Recipe",
      description: "Sharing functionality would be implemented here",
    })
  }

  // Print recipe
  const printRecipe = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-3xl flex items-center justify-center min-h-[50vh]">
        <p>Loading recipe...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Recipe Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find a generated recipe. Try creating a new one.</p>
          <Link href="/recipes/generate">
            <Button>Generate New Recipe</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center mb-6">
        <Link href="/recipes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Recipes
          </Button>
        </Link>
      </div>

      <Card className="mb-6 print:shadow-none print:border-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="text-lg flex items-center">
            <ChefHat className="mr-2 h-5 w-5" />
            AI-Generated Recipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: formatRecipe(recipe) }} />
        </CardContent>
        <CardFooter className="flex justify-between print:hidden">
          <Button variant="outline" onClick={saveRecipe}>
            <BookmarkPlus className="mr-2 h-4 w-4" /> Save
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={shareRecipe}>
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="outline" onClick={printRecipe}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </CardFooter>
      </Card>

      <div className="print:hidden">
        <Link href="/recipes/generate">
          <Button className="w-full">
            <ChefHat className="mr-2 h-4 w-4" /> Generate Another Recipe
          </Button>
        </Link>
      </div>
    </div>
  )
}

