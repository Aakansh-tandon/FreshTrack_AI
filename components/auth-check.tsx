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
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const publicRoutes = ["/", "/login", "/signup"]

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const isLoggedIn = !!session
      setIsAuthenticated(isLoggedIn)

      if (!isLoggedIn && !publicRoutes.includes(pathname || "")) {
        router.replace("/login")
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const isLoggedIn = !!session
        setIsAuthenticated(isLoggedIn)
        if (!isLoggedIn && !publicRoutes.includes(pathname || "")) {
          router.replace("/login")
        }
      }
    )

    return () => { subscription.unsubscribe() }
  }, [pathname, router])

  if (isAuthenticated === null) return null

  if ((pathname === "/login" || pathname === "/signup") && isAuthenticated) {
    router.push("/")
    return null
  }

  return <>{children}</>
}
