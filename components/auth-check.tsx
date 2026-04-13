"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthCheckProps {
  children: React.ReactNode
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is authenticated
    const authStatus = localStorage.getItem("isAuthenticated") === "true"
    setIsAuthenticated(authStatus)

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/login", "/signup"]

    // If not authenticated and not on a public route, redirect to login
    if (!authStatus && !publicRoutes.includes(pathname || "")) {
      router.push("/login")
    }
  }, [pathname, router])

  // Show nothing while checking authentication
  if (isAuthenticated === null) {
    return null
  }

  // If on login/signup page and authenticated, redirect to home
  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    router.push("/")
    return null
  }

  // Otherwise, show children
  return <>{children}</>
}

