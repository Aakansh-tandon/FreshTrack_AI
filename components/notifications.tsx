"use client"

import { useState, useEffect, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Bell, CheckCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type Notification = {
  id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
  item_id?: string
}

export default function NotificationsPopover({ onUnreadChange }: { onUnreadChange?: (count: number) => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [showRead, setShowRead] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Get JWT token
  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }, [])

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = await getToken()
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setNotifications(
        notifications.map(n => ({ ...n, is_read: true }))
      )
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  // Mark single notification as read
  const markAsRead = async (id: string, item_id?: string) => {
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

      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      )

      if (item_id) {
        router.push("/inventory")
        setOpen(false)
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length
  
  useEffect(() => {
    if (onUnreadChange) {
      onUnreadChange(unreadCount)
    }
  }, [unreadCount, onUnreadChange])
  
  const criticalNotifs = notifications.filter(n => n.type === 'critical' && !n.is_read)
  const warningNotifs = notifications.filter(n => n.type === 'warning' && !n.is_read)
  const infoNotifs = notifications.filter(n => n.type === 'info' && !n.is_read)
  const readNotifs = notifications.filter(n => n.is_read)

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "critical": return "bg-destructive text-white"
      case "warning": return "bg-warning text-black"
      default: return "bg-coder-primary text-black"
    }
  }

  const getTimeAgo = (dateStr: string) => {
    const ms = new Date().getTime() - new Date(dateStr).getTime()
    const minutes = Math.floor(ms / 60000)
    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  const renderNotificationCard = (notification: Notification) => (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`m-2 p-3 cursor-pointer hover:bg-coder-primary/5 transition-all ${
          notification.is_read ? "opacity-70 border-border/40" : "border-l-4 border-l-coder-primary"
        }`}
        onClick={() => markAsRead(notification.id, notification.item_id)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <p className="text-sm">{notification.message}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-muted-foreground">{getTimeAgo(notification.created_at)}</p>
              {notification.item_id && !notification.is_read && (
                <span className="text-xs text-coder-primary opacity-80 hover:underline">
                  Go to Inventory →
                </span>
              )}
            </div>
          </div>
          <Badge className={getTypeBadge(notification.type)} variant="default">
            {notification.type}
          </Badge>
        </div>
      </Card>
    </motion.div>
  )

  return (
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
      <PopoverContent className="w-80 sm:w-96 p-0 border-coder-primary/20 bg-card/95 backdrop-blur-xl shadow-2xl shadow-coder-primary/10" align="end">
        <div className="flex justify-between items-center p-4 border-b border-coder-primary/20">
          <div>
            <h3 className="font-medium text-coder-primary flex items-center gap-2">
              Notifications {unreadCount > 0 && <Badge variant="secondary" className="bg-coder-primary/20 text-coder-primary">{unreadCount}</Badge>}
            </h3>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs text-coder-accent hover:bg-coder-primary/10 hover:text-coder-primary">
              <CheckCheck className="w-4 h-4 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="flex justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Bell className="h-6 w-6 text-coder-primary/50" />
                </motion.div>
              </div>
              <p className="mt-4 text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 || unreadCount === 0 && !showRead && readNotifs.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-coder-primary font-medium">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No new notifications</p>
            </div>
          ) : (
            <div className="py-2">
              {criticalNotifs.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-1 text-xs font-semibold text-destructive uppercase tracking-wider">🚨 Critical</div>
                  <AnimatePresence>{criticalNotifs.map(renderNotificationCard)}</AnimatePresence>
                </div>
              )}
              {warningNotifs.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-1 text-xs font-semibold text-warning uppercase tracking-wider">⚠️ Warnings</div>
                  <AnimatePresence>{warningNotifs.map(renderNotificationCard)}</AnimatePresence>
                </div>
              )}
              {infoNotifs.length > 0 && (
                <div className="mb-4">
                  <div className="px-4 py-1 text-xs font-semibold text-coder-primary uppercase tracking-wider">📅 Info</div>
                  <AnimatePresence>{infoNotifs.map(renderNotificationCard)}</AnimatePresence>
                </div>
              )}
              
              {readNotifs.length > 0 && (
                <div>
                  <Button 
                    variant="ghost" 
                    className="w-full rounded-none border-t border-border/40 flex justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-transparent"
                    onClick={() => setShowRead(!showRead)}
                  >
                    <span>✓ {readNotifs.length} Read Notifications</span>
                    {showRead ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <AnimatePresence>
                    {showRead && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {readNotifs.map(renderNotificationCard)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
