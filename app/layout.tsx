import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/navbar"
import AuthCheck from "@/components/auth-check"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Food Expiry Tracker",
  description: "Track food expiry dates and get recipe suggestions",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} grid-background min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <div className="relative min-h-screen">
            <AuthCheck>
              <Navbar />
              <div className="pb-16 md:pb-0">{children}</div>
              <Toaster />
            </AuthCheck>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'