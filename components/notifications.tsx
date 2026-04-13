"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import ExpiryAlert from "@/components/expiry-alert"
import { motion, AnimatePresence } from "framer-motion"

type Notification = {
  id: number
  productName: string
  expiryDate: string
  daysLeft: number
  read: boolean
}

export default function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showExpiryAlert, setShowExpiryAlert] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<Notification | null>(null)
  const { toast } = useToast()

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications")
      const data = await response.json()
      setNotifications(data.notifications || [])

      // Check for critical notifications (expiring in less than 3 days)
      const criticalNotifications = data.notifications.filter((n: Notification) => n.daysLeft <= 3 && !n.read)

      if (criticalNotifications.length > 0) {
        // Show the first critical notification as an alert
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
  }

  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId: id }),
      })

      // Update local state
      setNotifications(
        notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
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

  // Load notifications when component mounts or popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open])

  // Check for notifications on initial load
  useEffect(() => {
    fetchNotifications()

    // Set up interval to check for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000)

    return () => clearInterval(interval)
  }, [])

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

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
                        notification.read ? "opacity-70" : "border-l-4 border-l-coder-primary"
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{notification.productName} expiring soon</h4>
                          <p className="text-sm text-muted-foreground">
                            Expires in {notification.daysLeft} {notification.daysLeft === 1 ? "day" : "days"}
                          </p>
                        </div>
                        <Badge
                          variant={notification.daysLeft <= 2 ? "destructive" : "default"}
                          className={
                            notification.daysLeft <= 2 ? "bg-destructive text-white" : "bg-coder-primary text-black"
                          }
                        >
                          {notification.daysLeft} {notification.daysLeft === 1 ? "day" : "days"}
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

      {/* Expiry Alert for items expiring in less than 3 days */}
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

