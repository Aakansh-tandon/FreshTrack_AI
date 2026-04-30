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

// GET /api/consumption-logs — fetch the user's recent consumption history
export async function GET(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabaseAdmin
      .from("consumption_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", thirtyDaysAgo)
      .order("logged_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ logs: data || [] })
  } catch (error) {
    console.error("Consumption logs GET error:", error)
    return NextResponse.json({ error: "Failed to fetch consumption logs" }, { status: 500 })
  }
}
