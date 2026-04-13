import { NextResponse } from "next/server"

// In a real app, this would connect to a notification service
export async function GET() {
  try {
    // For demo purposes, we'll return some sample notifications
    // In a real app, this would query a database for items expiring soon
    const notifications = [
      {
        id: 1,
        productName: "Milk",
        expiryDate: "2025-04-15",
        daysLeft: 2,
        read: false,
      },
      {
        id: 2,
        productName: "Bread",
        expiryDate: "2025-04-05",
        daysLeft: 1,
        read: false,
      },
      {
        id: 3,
        productName: "Chicken",
        expiryDate: "2025-04-07",
        daysLeft: 3,
        read: false,
      },
    ]

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// Mark notification as read
export async function POST(request: Request) {
  try {
    const { notificationId } = await request.json()

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }

    // In a real app, this would update the notification status in the database

    return NextResponse.json({
      success: true,
      message: `Notification ${notificationId} marked as read`,
    })
  } catch (error) {
    console.error("Notifications API error:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

