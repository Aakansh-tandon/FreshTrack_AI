"use client"

import { useState, useEffect, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import ExpiryAlert from "@/components/expiry-alert"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"

type Notification = {
  id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showExpiryAlert, setShowExpiryAlert] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<Notification | null>(null)
  const { toast } = useToast()

  // Get JWT token
  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }, [])

  // Fetch notifications from Supabase
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      const notifs = data.notifications || []
      setNotifications(notifs)

      // Check for critical notifications
      const criticalNotifications = notifs.filter(
        (n: Notification) => n.type === "critical" && !n.is_read
      )

      if (criticalNotifications.length > 0) {
        setCurrentAlert(criticalNotifications[0])
        setShowExpiryAlert(true)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [getToken, toast])

  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const token = await getToken()
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId: id }),
      })

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        ),
      )

      // If this was the current alert, dismiss it
      if (currentAlert?.id === id) {
        setShowExpiryAlert(false)
        setCurrentAlert(null)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Load notifications when popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  // Check for notifications on initial load
  useEffect(() => {
    fetchNotifications()

    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.is_read).length

  // Get badge variant based on notification type
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-destructive text-white"
      case "warning":
        return "bg-warning text-black"
      default:
        return "bg-coder-primary text-black"
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative border-coder-primary/50 hover:bg-coder-primary/10 hover:text-coder-primary"
          >
            <motion.div
              animate={unreadCount > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            >
              <Bell className="h-[1.2rem] w-[1.2rem]" />
            </motion.div>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-coder-primary text-black animate-pulse-glow">
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 border-coder-primary/20 bg-card/90 backdrop-blur-md" align="end">
          <div className="p-4 border-b border-coder-primary/20">
            <h3 className="font-medium text-coder-primary">Notifications</h3>
            <p className="text-sm text-muted-foreground">Food expiry reminders</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="flex justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Bell className="h-5 w-5 text-coder-primary" />
                  </motion.div>
                </div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications</div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      className={`m-2 p-3 cursor-pointer hover:bg-coder-primary/5 transition-all ${
                        notification.is_read ? "opacity-70" : "border-l-4 border-l-coder-primary"
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge className={getTypeBadge(notification.type)} variant="default">
                          {notification.type}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          <div className="p-2 border-t border-coder-primary/20">
            <Button
              variant="ghost"
              size="sm"
              className="w-full hover:bg-coder-primary/10 hover:text-coder-primary"
              onClick={fetchNotifications}
            >
              Refresh
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Expiry Alert for critical notifications */}
      <AnimatePresence>
        {showExpiryAlert && currentAlert && (
          <ExpiryAlert
            notification={currentAlert}
            onClose={() => {
              markAsRead(currentAlert.id)
              setShowExpiryAlert(false)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
