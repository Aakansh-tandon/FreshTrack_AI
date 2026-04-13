// Helper functions for calendar integration

// Add an item to the calendar
export async function addToCalendar(productName: string, expiryDate: string, reminderDays = 2) {
  try {
    const response = await fetch("/api/calendar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productName,
        expiryDate,
        reminderDays,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to add to calendar")
    }

    return await response.json()
  } catch (error) {
    console.error("Error adding to calendar:", error)
    throw error
  }
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Calculate days between two dates
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000 // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay))
  return diffDays
}

// Calculate days left until expiry
export function daysUntilExpiry(expiryDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day

  const expiry = new Date(expiryDate)
  expiry.setHours(0, 0, 0, 0) // Reset time to start of day

  return daysBetween(today, expiry)
}

