"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface AuthCheckProps {
  children: React.ReactNode
}

export default function AuthCheck({ children }: AuthCheckProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const publicRoutes = ["/", "/login", "/signup"]
    let isMounted = true

    // Subscribe to auth state changes - this is the primary source of truth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return

        const isLoggedIn = !!session
        setIsAuthenticated(isLoggedIn)
        setHasCheckedAuth(true)

        // Only redirect if we're on a protected route and not logged in
        if (!isLoggedIn && !publicRoutes.includes(pathname || "")) {
          router.replace("/login")
        }

        // Only redirect if we're on a login/signup route and already logged in
        if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
          router.push("/")
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  // Wait until auth state has been checked before rendering anything
  if (!hasCheckedAuth) return null

  return <>{children}</>
}
