"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScanLine, LayoutGrid, ChefHat, Menu, User, LogOut, Code } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import NotificationsPopover from "@/components/notifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check authentication status
    const authStatus = localStorage.getItem("isAuthenticated") === "true"
    setIsAuthenticated(authStatus)
  }, [pathname])

  const routes = [
    {
      name: "Home",
      path: "/",
      icon: LayoutGrid,
    },
    {
      name: "Scan",
      path: "/scan",
      icon: ScanLine,
      requiresAuth: true,
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: LayoutGrid,
      requiresAuth: true,
    },
    {
      name: "Recipes",
      path: "/recipes",
      icon: ChefHat,
      requiresAuth: true,
    },
  ]

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    setIsAuthenticated(false)
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/login")
  }

  const filteredRoutes = routes.filter((route) => !route.requiresAuth || (route.requiresAuth && isAuthenticated))

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="text-coder-primary"
            >
              <Code className="h-6 w-6" />
            </motion.div>
            <span className="font-bold text-xl bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">
              FreshTrack AI
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {filteredRoutes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={`transition-colors hover:text-coder-primary relative group ${
                  pathname === route.path ? "text-coder-primary" : "text-foreground/60"
                }`}
              >
                {route.name}
                <span
                  className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-coder-primary transition-all duration-300 group-hover:w-full ${
                    pathname === route.path ? "w-full" : "w-0"
                  }`}
                ></span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none flex items-center gap-2">
            {isAuthenticated && <NotificationsPopover />}

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full border-coder-primary/50 hover:bg-coder-primary/10 hover:text-coder-primary"
                  >
                    <User className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border border-coder-primary/20 bg-card/90 backdrop-blur-md">
                  <DropdownMenuLabel className="text-coder-primary">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-coder-primary/20" />
                  <DropdownMenuItem className="hover:bg-coder-primary/10 hover:text-coder-primary focus:bg-coder-primary/10 focus:text-coder-primary">
                    <Link href="/profile" className="flex w-full">
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-coder-primary/10 hover:text-coder-primary focus:bg-coder-primary/10 focus:text-coder-primary">
                    <Link href="/settings" className="flex w-full">
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-coder-primary/20" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="default" size="sm" className="bg-coder-primary hover:bg-coder-primary/80 text-black">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden border-coder-primary/50 hover:bg-coder-primary/10"
              >
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r-coder-primary/20 bg-card/90 backdrop-blur-md">
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <Code className="h-6 w-6 text-coder-primary" />
                <span className="font-bold text-xl bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">
                  FoodTracker
                </span>
              </Link>
              <nav className="flex flex-col space-y-4">
                {filteredRoutes.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={`flex items-center space-x-2 text-sm font-medium p-2 rounded-md transition-colors ${
                      pathname === route.path
                        ? "bg-coder-primary/10 text-coder-primary"
                        : "text-foreground/60 hover:bg-coder-primary/5 hover:text-coder-primary"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <route.icon className="h-5 w-5" />
                    <span>{route.name}</span>
                  </Link>
                ))}

                {isAuthenticated && (
                  <button
                    onClick={() => {
                      handleLogout()
                      setOpen(false)
                    }}
                    className="flex items-center space-x-2 text-sm font-medium text-destructive p-2 rounded-md hover:bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {isAuthenticated && (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-lg border-t border-border/40">
          <div className="grid h-full grid-cols-4">
            {filteredRoutes.map((route) => (
              <button
                key={route.path}
                onClick={() => router.push(route.path)}
                className={`flex flex-col items-center justify-center ${
                  pathname === route.path ? "text-coder-primary" : "text-muted-foreground hover:text-coder-primary"
                }`}
              >
                <route.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{route.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}

