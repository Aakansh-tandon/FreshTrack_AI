"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, X, ChefHat } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

type InventoryItem = {
  id: string
  product_name: string
  expiry_date: string
  days_remaining?: number
}

type Notification = {
  id: string
  item_id: string
  type: string
  is_read: boolean
}

export default function ExpiryAlert() {
  const [isVisible, setIsVisible] = useState(false)
  const [criticalItems, setCriticalItems] = useState<InventoryItem[]>([])
  const [criticalNotifications, setCriticalNotifications] = useState<Notification[]>([])
  const router = useRouter()

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken()
        if (!token) return

        // Fetch active inventory
        const invRes = await fetch("/api/inventory", {
          headers: { Authorization: `Bearer ${token}` }
        })
        const invData = await invRes.json()
        const items: InventoryItem[] = invData.items || []

        // Calculate days remaining and filter critical <= 3
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const expiring = items.map(item => {
          const exp = new Date(item.expiry_date)
          exp.setHours(0, 0, 0, 0)
          const days = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return { ...item, days_remaining: days }
        }).filter(item => item.days_remaining! <= 3)

        if (expiring.length > 0) {
          setCriticalItems(expiring)
          setIsVisible(true)

          // Fetch notifications to find the related ones to mark as read later
          const notifRes = await fetch("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` }
          })
          const notifData = await notifRes.json()
          const notifs: Notification[] = notifData.notifications || []
          
          const relatedNotifs = notifs.filter(n => 
            !n.is_read && n.type === 'critical' && expiring.some(item => item.id === n.item_id)
          )
          setCriticalNotifications(relatedNotifs)
        }
      } catch (e) {
        console.error("Failed to fetch critical items for alert", e)
      }
    }

    fetchData()
  }, [getToken])

  const handleClose = async () => {
    setIsVisible(false)
    
    try {
      const token = await getToken()
      // Mark related notifications as read
      for (const notif of criticalNotifications) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationId: notif.id }),
        }).catch(e => console.error("Failed to mark read", e))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleFindRecipes = () => {
    router.push("/recipes")
    handleClose()
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-20 right-4 z-50 max-w-sm w-[calc(100vw-2rem)]"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-l-4 border-l-destructive shadow-lg bg-card/95 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent"></div>
            <CardContent className="p-4 relative">
              <div className="flex items-start gap-3">
                <motion.div
                  className="bg-destructive/10 p-2 rounded-full shrink-0"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-destructive">
                      Critical Items!
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1 -mr-1 hover:bg-destructive/10 shrink-0"
                      onClick={handleClose}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm mt-1 text-foreground/90">
                    You have {criticalItems.length} item(s) expiring soon:
                  </p>
                  <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto pr-1">
                    {criticalItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs bg-black/20 p-1.5 rounded">
                        <span className="truncate mr-2 font-medium">{item.product_name}</span>
                        <span className="text-destructive whitespace-nowrap shrink-0 font-bold">
                          {item.days_remaining! <= 0 ? "Expired" : `${item.days_remaining}d left`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 flex gap-2 relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 hover:bg-destructive/10 hover:text-destructive"
                onClick={handleClose}
              >
                Dismiss
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-coder-primary hover:bg-coder-primary/80 text-black"
                onClick={handleFindRecipes}
              >
                <ChefHat className="mr-2 h-4 w-4 shrink-0" />
                Find Recipes
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
