import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: Request) {
  try {
    const { ingredients, preferences = [] } = await request.json()

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: "Ingredients are required and must be an array" }, { status: 400 })
    }

    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OpenAI API key is missing")

      // Return a mock recipe for demo purposes when API key is missing
      return NextResponse.json({
        success: true,
        recipe: generateMockRecipe(ingredients, preferences),
      })
    }

    // Build the prompt for the AI
    const ingredientsList = ingredients.join(", ")
    const preferencesText =
      preferences.length > 0 ? `Consider these dietary preferences: ${preferences.join(", ")}.` : ""

    const prompt = `
      Create a recipe using some or all of these ingredients: ${ingredientsList}.
      ${preferencesText}
      Format the recipe with:
      1. A creative title
      2. A brief description
      3. List of ingredients with quantities
      4. Step-by-step cooking instructions
      5. Cooking time and difficulty level
    `

    // Generate recipe using AI SDK with explicit API key
    const { text } = await generateText({
      model: openai("gpt-4o", { apiKey }),
      prompt: prompt,
      system:
        "You are a professional chef specializing in creating delicious recipes from available ingredients. Focus on reducing food waste by using ingredients that are about to expire.",
    })

    return NextResponse.json({
      success: true,
      recipe: text,
    })
  } catch (error) {
    console.error("Recipe generation error:", error)
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 })
  }
}

// Function to generate a mock recipe when API key is missing
function generateMockRecipe(ingredients: string[], preferences: string[]): string {
  const mainIngredient = ingredients[0] || "Chicken"
  const secondaryIngredients = ingredients.slice(1).join(", ") || "vegetables"
  const dietaryInfo = preferences.length > 0 ? `(${preferences.join(", ")})` : ""

  return `# ${mainIngredient} Delight ${dietaryInfo}

A delicious and easy-to-prepare dish that makes the most of your ingredients.

## Description
This recipe transforms ${mainIngredient} into a flavorful meal that's perfect for any occasion. It's designed to use ingredients you already have to reduce food waste.

## Ingredients
- 2 cups ${mainIngredient}, prepared appropriately
- 1 tablespoon olive oil
- 2 cloves garlic, minced
- 1 onion, diced
${ingredients
  .slice(1)
  .map((ing) => `- 1 cup ${ing}`)
  .join("\n")}
- Salt and pepper to taste
- Fresh herbs for garnish

## Instructions
1. Prepare all ingredients by washing and cutting them into appropriate sizes.
2. Heat olive oil in a large pan over medium heat.
3. Add garlic and onion, sauté until fragrant and translucent.
4. Add ${mainIngredient} and cook for 5-7 minutes until it starts to brown.
5. Add ${secondaryIngredients} and continue cooking for another 5 minutes.
6. Season with salt and pepper to taste.
7. Garnish with fresh herbs before serving.

## Cooking Time and Difficulty
- Preparation: 10 minutes
- Cooking: 15 minutes
- Difficulty: Easy

Enjoy your meal!`
}

