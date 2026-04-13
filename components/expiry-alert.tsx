"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, X, ChefHat } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

type Notification = {
  id: number
  productName: string
  expiryDate: string
  daysLeft: number
  read: boolean
}

interface ExpiryAlertProps {
  notification: Notification
  onClose: () => void
}

export default function ExpiryAlert({ notification, onClose }: ExpiryAlertProps) {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Animate in
    setTimeout(() => {
      setIsVisible(true)
    }, 100)

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleClose()
    }, 10000)

    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for animation to complete
  }

  const handleFindRecipes = () => {
    window.location.href = "/recipes/generate"
    handleClose()
  }

  return (
    <motion.div
      className="fixed bottom-20 right-4 z-50 max-w-sm"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-l-4 border-l-destructive shadow-lg bg-card/90 backdrop-blur-md overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent"></div>
        <CardContent className="p-4 relative">
          <div className="flex items-start gap-3">
            <motion.div
              className="bg-destructive/10 p-2 rounded-full"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </motion.div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-destructive">Expiring Soon!</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 -mt-1 -mr-1 hover:bg-destructive/10"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm mt-1">
                <span className="font-medium">{notification.productName}</span> will expire in {notification.daysLeft}{" "}
                {notification.daysLeft === 1 ? "day" : "days"}
              </p>
              <div className="mt-2">
                <Badge variant={notification.daysLeft <= 2 ? "destructive" : "default"} className="animate-pulse">
                  {notification.daysLeft} {notification.daysLeft === 1 ? "day" : "days"} left
                </Badge>
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
            <ChefHat className="mr-2 h-4 w-4" />
            Find Recipes
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

