"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScanLine, Calendar, ChefHat, ArrowRight, Shield } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated") === "true"
    setIsAuthenticated(authStatus)
  }, [])

  const navigateTo = (path: string) => {
    console.log("Navigating to:", path)
    router.push(path)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-coder-grid bg-grid-pattern opacity-20"></div>
      </div>

      <div className="max-w-5xl w-full z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-coder-primary via-coder-accent to-coder-secondary bg-clip-text text-transparent animate-text-shimmer">
            FreshTrack AI 
          </h1>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Scan, track, and get recipe suggestions for your food items before they expire
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Card 1: Scan Products */}
          <Card className="relative border border-coder-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-coder-primary/10 to-transparent z-0"></div>
            <div className="relative z-10">
              <CardHeader>
                <ScanLine className="h-8 w-8 mb-2 text-coder-primary" />
                <CardTitle className="text-coder-primary">Scan Products</CardTitle>
                <CardDescription>Scan expiry dates with your camera</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full bg-coder-primary hover:bg-coder-primary/80 text-black"
                  onClick={() => navigateTo("/scan")}
                >
                  Scan Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </div>
          </Card>

          {/* Card 2: Track Expiry */}
          <Card className="relative border border-coder-accent/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-coder-accent/10 to-transparent z-0"></div>
            <div className="relative z-10">
              <CardHeader>
                <Calendar className="h-8 w-8 mb-2 text-coder-accent" />
                <CardTitle className="text-coder-accent">Track Expiry</CardTitle>
                <CardDescription>Get reminders before your food expires</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full border-coder-accent/50 text-coder-accent hover:bg-coder-accent/10"
                  onClick={() => navigateTo("/inventory")}
                >
                  View Inventory <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </div>
          </Card>

          {/* Card 3: Recipe Suggestions */}
          <Card className="relative border border-coder-secondary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-coder-secondary/10 to-transparent z-0"></div>
            <div className="relative z-10">
              <CardHeader>
                <ChefHat className="h-8 w-8 mb-2 text-coder-secondary" />
                <CardTitle className="text-coder-secondary">Recipe Suggestions</CardTitle>
                <CardDescription>Get AI-powered recipe ideas based on your ingredients</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full border-coder-secondary/50 text-coder-secondary hover:bg-coder-secondary/10"
                  onClick={() => navigateTo("/recipes")}
                >
                  View Recipes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </div>
          </Card>
        </motion.div>

        {/* Sign In / Sign Up */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col md:flex-row justify-center gap-4"
          >
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-coder-primary to-coder-accent text-black font-bold"
              onClick={() => navigateTo("/login")}
            >
              <Shield className="h-5 w-5" /> Sign In
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 border-coder-primary hover:bg-coder-primary/10 hover:text-coder-primary"
              onClick={() => navigateTo("/signup")}
            >
              Create Account
            </Button>
          </motion.div>
        )}
      </div>
    </main>
  )
}
