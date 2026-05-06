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

// POST /api/notifications/read-all — mark all notifications as read for user
export async function POST(request: Request) {
  try {
    const user = await getUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "All notifications marked as read",
    })
  } catch (error) {
    console.error("Notifications read-all POST error:", error)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}
