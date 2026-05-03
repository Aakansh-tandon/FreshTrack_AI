import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json(
        { error: "Image is required", fallback: true },
        { status: 400 }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured", fallback: true },
        { status: 500 }
      )
    }

    // Initialize the Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Prepare the image data
    // image should be a base64 string, possibly with data URI prefix
    const base64Image = image.includes(",") ? image.split(",")[1] : image

    const prompt = `Look at this product packaging image and find the expiry date.
Return ONLY a valid JSON object with no markdown or explanation:
{ 
  date: 'DD/MM/YYYY format or null if not found',
  confidence: number between 0-100,
  label: 'Best Before or Use By or Expiry or null'
}`

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: "image/png",
          },
        },
        {
          text: prompt,
        },
      ])

      const responseText = result.response.text()

      // Parse JSON response, stripping markdown fences if present
      let jsonStr = responseText.trim()
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.replace(/^```json\n?/, "").replace(/\n?```$/, "")
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```\n?/, "").replace(/\n?```$/, "")
      }

      try {
        const parsedResponse = JSON.parse(jsonStr)

        return NextResponse.json(
          {
            date: parsedResponse.date || null,
            confidence: parsedResponse.confidence || 0,
            label: parsedResponse.label || null,
          },
          { status: 200 }
        )
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", jsonStr, parseError)
        return NextResponse.json(
          { error: "Failed to parse AI response", fallback: true },
          { status: 500 }
        )
      }
    } catch (geminiError: any) {
      // Check for rate limit error
      if (geminiError.status === 429 || geminiError.message?.includes("429")) {
        return NextResponse.json(
          { error: "AI scanning limit reached, please use manual entry", fallback: true },
          { status: 429 }
        )
      }

      // Other Gemini errors
      console.error("Gemini API error:", geminiError)
      return NextResponse.json(
        { error: geminiError.message || "AI scanning failed", fallback: true },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Scan AI route error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to process image: ${errorMessage}`, fallback: true },
      { status: 500 }
    )
  }
}
