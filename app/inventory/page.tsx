"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanLine, Plus, ChefHat, AlertTriangle, Search, MoreVertical, CheckCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { AnimatePresence, motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { useInventory } from "@/hooks/use-inventory"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InventoryItem } from "@/types/database"

type InventoryStatus = "expired" | "critical" | "expiring_soon" | "fresh"

type InventoryViewItem = InventoryItem & {
  urgency_score?: number
  status: InventoryStatus
  days_remaining: number
}

function deriveInventoryMeta(expiryDate: string) {
  const days_remaining = Math.floor(
    (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const status: InventoryStatus = days_remaining < 0
    ? "expired"
    : days_remaining <= 3
      ? "critical"
      : days_remaining <= 7
        ? "expiring_soon"
        : "fresh"

  return { days_remaining, status }
}

export default function InventoryPage() {
  const { items: inventory, loading, error, fetchItems, removeItem } = useInventory()
  const [searchQuery, setSearchQuery] = useState("")
  const [scoredInventory, setScoredInventory] = useState<InventoryViewItem[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryViewItem[]>([])
  const [expiringCollapsed, setExpiringCollapsed] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const skeletonCards = Array.from({ length: 4 })

  // Get JWT token from Supabase session
  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }, [])

  // Load inventory on mount
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Rank inventory by urgency score with FastAPI fallback to expiry date sort
  useEffect(() => {
    let cancelled = false

    const rankInventory = async () => {
      const withDerivedFields: InventoryViewItem[] = (inventory || []).map((item) => ({
        ...item,
        ...deriveInventoryMeta(item.expiry_date),
      }))

      const fallbackSorted = [...withDerivedFields].sort(
        (a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      )

      const apiBase = process.env.NEXT_PUBLIC_API_URL
      if (!apiBase) {
        if (!cancelled) setScoredInventory(fallbackSorted)
        return
      }

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const payload = withDerivedFields.map((item) => ({
          id: item.id,
          product_name: item.product_name,
          category: item.category,
          quantity: item.quantity,
          days_remaining: item.days_remaining,
        }))

        const response = await fetch(`${apiBase}/score-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Urgency API responded with ${response.status}`)
        }

        const data = await response.json()
        const scoredItems = Array.isArray(data?.items) ? data.items : []
        const scoreById = new Map<string, number>()

        scoredItems.forEach((item: any) => {
          if (item?.id && typeof item.urgency_score === "number") {
            scoreById.set(item.id, item.urgency_score)
          }
        })

        const merged = withDerivedFields.map((item) => ({
          ...item,
          urgency_score: scoreById.get(item.id),
        }))

        const sortedByUrgency = [...merged].sort(
          (a, b) => (b.urgency_score ?? 0) - (a.urgency_score ?? 0)
        )

        if (!cancelled) setScoredInventory(sortedByUrgency)
      } catch (rankError) {
        console.error("Urgency scoring failed, using expiry fallback:", rankError)
        if (!cancelled) setScoredInventory(fallbackSorted)
      }
    }

    rankInventory()

    return () => {
      cancelled = true
    }
  }, [inventory])

  // Filter inventory when search query or inventory changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredInventory(scoredInventory)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = scoredInventory.filter(
        (item) =>
          item.product_name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
      setFilteredInventory(filtered)
    }
  }, [searchQuery, scoredInventory])

  // Handle consumption action (consumed or discarded)
  const handleItemAction = async (id: string, action: "consumed" | "discarded") => {
    try {
      await removeItem(id, action)

      toast({
        title: action === "consumed" ? "Item consumed" : "Item discarded",
        description:
          action === "consumed"
            ? "Item marked as consumed and logged"
            : "Item discarded and logged for analytics",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      })
    }
  }

  // Badge variant based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "expired":
        return "destructive"
      case "critical":
        return "destructive"
      case "expiring_soon":
        return "warning"
      default:
        return "success"
    }
  }

  // Status display text
  const getStatusText = (item: InventoryItem) => {
    switch (item.status) {
      case "expired":
        return "Expired"
      case "critical":
        return `${item.days_remaining} day${item.days_remaining === 1 ? "" : "s"} left`
      case "expiring_soon":
        return "Expiring Soon"
      default:
        return "Fresh"
    }
  }

  const getStatusLabel = (status: InventoryStatus) => {
    switch (status) {
      case "expired":
        return "Expired"
      case "critical":
        return "Critical"
      case "expiring_soon":
        return "Expiring Soon"
      default:
        return "Fresh"
    }
  }

  // Badge extra classes
  const getBadgeClasses = (status: string) => {
    switch (status) {
      case "expired":
        return "bg-destructive text-white"
      case "critical":
        return "bg-coder-primary text-black animate-pulse"
      case "expiring_soon":
        return "bg-warning text-black"
      default:
        return "bg-green-600 text-white"
    }
  }

  // Find recipes for a specific item
  const findRecipesForItem = (itemName: string) => {
    localStorage.setItem("recipeIngredients", JSON.stringify([itemName]))
    window.location.href = "/recipes/generate"
  }

  // Auto-trigger recipe generation on page mount
  useEffect(() => {
    const triggerAutoRecipeOnMount = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch("/api/auto-trigger", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (data.triggered) {
          toast({
            title: "🍳 Recipe auto-generated for your expiring items",
            description: "Tap to view recipes",
            onClick: () => router.push("/recipes"),
          })
        }
      } catch (error) {
        console.error("Auto-trigger error:", error)
      }
    }

    triggerAutoRecipeOnMount()
  }, [getToken, router, toast])

  // Periodic auto-trigger re-check every 5 minutes
  useEffect(() => {
    const triggerAutoRecipePeriodic = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch("/api/auto-trigger", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (data.triggered) {
          toast({
            title: "🍳 Recipe auto-generated for your expiring items",
            description: "Tap to view recipes",
            onClick: () => router.push("/recipes"),
          })
        }
      } catch (error) {
        console.error("Auto-trigger periodic error:", error)
      }
    }

    const interval = setInterval(triggerAutoRecipePeriodic, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [getToken, router, toast])

  // Show notification for expiring items
  useEffect(() => {
    const expiringItems = scoredInventory.filter(
      (item) => item.days_remaining <= 3 && item.status !== "expired"
    )

    if (expiringItems.length > 0) {
      toast({
        title: "Items Expiring Soon!",
        description: `You have ${expiringItems.length} items expiring in the next 3 days`,
        variant: "destructive",
      })
    }
  }, [scoredInventory, toast])

  const getUrgencyBadgeClasses = (score?: number) => {
    if ((score ?? 0) >= 5) return "bg-destructive text-white"
    if ((score ?? 0) >= 2) return "bg-warning text-black"
    return "bg-muted text-muted-foreground"
  }

  const getUrgencyBadgeText = (score?: number) => {
    const safeScore = (score ?? 0).toFixed(1)
    if ((score ?? 0) >= 5) return `${safeScore} 🔥`
    if ((score ?? 0) >= 2) return `${safeScore} ⚠️`
    return safeScore
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="grid grid-cols-1 gap-4">
          {skeletonCards.map((_, index) => (
            <Card
              key={`inventory-skeleton-${index}`}
              className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm animate-pulse"
            >
              <CardContent className="p-5 space-y-3">
                <div className="h-4 bg-muted/40 rounded w-1/2" />
                <div className="h-3 bg-muted/40 rounded w-3/4" />
                <div className="h-3 bg-muted/40 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6 relative z-10"
      >
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">
          Your Food Inventory
        </h1>
        <div className="flex w-full md:w-auto gap-2 flex-nowrap">
          <Link href="/scan" className="flex-1 md:flex-none">
            <Button
              variant="outline"
              size="sm"
              className="border-coder-primary/50 text-coder-primary hover:bg-coder-primary/10 text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap w-full"
            >
              <ScanLine className="mr-2 h-4 w-4" /> Scan New
            </Button>
          </Link>
          <Link href="/add-manual" className="flex-1 md:flex-none">
            <Button
              variant="outline"
              size="sm"
              className="border-coder-accent/50 text-coder-accent hover:bg-coder-accent/10 text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Manually
            </Button>
          </Link>
        </div>
      </motion.div>

      {error && (
        <Card className="mb-6 border border-coder-primary/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm">⚠️ Failed to load data — {error}</p>
            <Button
              variant="outline"
              className="border-coder-primary/50 text-coder-primary hover:bg-coder-primary/10"
              onClick={fetchItems}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && inventory.length === 0 && (
        <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-4xl">\ud83e\udd6b</div>
            <div>
              <h2 className="text-xl font-semibold">No items in pantry yet</h2>
              <p className="text-sm text-muted-foreground">Add your first item to start tracking freshness.</p>
            </div>
            <Button
              className="bg-coder-primary hover:bg-coder-primary/80 text-black"
              onClick={() => router.push("/scan")}
            >
              Scan Your First Item
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && inventory.length > 0 && (
        <>
          {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 relative z-10"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-coder-primary/30 focus:border-coder-primary w-full text-sm md:text-base"
          />
        </div>
      </motion.div>

          {/* Expiring soon section with alert styling */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="mb-8 border-destructive/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 to-transparent"></div>
          <CardHeader className="bg-destructive/5 relative p-3 md:p-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base md:text-lg flex items-center text-destructive">
                <AlertTriangle className="mr-2 h-4 w-4 md:h-5 md:w-5 text-destructive" />
                Expiring Soon - Urgent Attention Required
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden text-destructive hover:bg-destructive/10"
                onClick={() => setExpiringCollapsed((prev) => !prev)}
                aria-label={expiringCollapsed ? "Expand expiring items" : "Collapse expiring items"}
              >
                {expiringCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className={`p-3 md:p-6 relative ${expiringCollapsed ? "hidden md:block" : ""}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filteredInventory
                  .filter((item) => item.days_remaining <= 3)
                  .map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className={`bg-muted/50 ${item.days_remaining <= 2 ? "border-destructive/50" : "border-warning/50"} overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent"></div>
                        <CardContent className="p-4 flex justify-between items-center relative">
                          <div>
                            <h3 className="font-medium">{item.product_name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Expires: {new Date(item.expiry_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant={getBadgeVariant(item.status)}
                              className={`${item.days_remaining <= 2 ? "bg-destructive text-white" : "bg-warning text-black"} animate-pulse`}
                            >
                              {item.days_remaining} days left
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Find recipes"
                              className="hover:bg-coder-primary/10 hover:text-coder-primary"
                              onClick={() => findRecipesForItem(item.product_name)}
                            >
                              <ChefHat className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {filteredInventory.filter((item) => item.days_remaining <= 3).length === 0 && (
                <p className="text-muted-foreground col-span-2 text-center py-4">No items expiring soon</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

          {/* Full inventory table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="border-coder-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-coder-primary">All Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pb-24 md:pb-6">
            <div className="md:hidden">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {searchQuery ? "No items match your search" : "No items in your inventory"}
                </div>
              ) : (
                filteredInventory.map((item) => {
                  const statusLabel = getStatusLabel(item.status)
                  const daysLabel = item.days_remaining < 0
                    ? `${item.days_remaining} days`
                    : `${item.days_remaining} days left`
                  const daysClass = item.days_remaining < 0 ? "text-destructive" : "text-muted-foreground"

                  return (
                    <div
                      key={item.id}
                      className="bg-card/80 backdrop-blur-sm rounded-xl p-4 mb-3 border border-coder-primary/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium truncate">{item.product_name}</div>
                        <Badge variant={getBadgeVariant(item.status)} className={getBadgeClasses(item.status)}>
                          {statusLabel}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <Badge variant="secondary" className="bg-muted/60 text-muted-foreground">
                          {item.category}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`mt-1 text-xs ${daysClass}`}>
                        {daysLabel}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Badge className={getUrgencyBadgeClasses(item.urgency_score)}>
                          {getUrgencyBadgeText(item.urgency_score)}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-coder-primary/20 bg-card/90 backdrop-blur-md">
                            <DropdownMenuItem
                              onClick={() => handleItemAction(item.id, "consumed")}
                              className="hover:bg-coder-primary/10 focus:bg-coder-primary/10 py-3 md:py-2 min-h-[44px] md:min-h-0"
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-coder-primary" />
                              ✅ Mark as Consumed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleItemAction(item.id, "discarded")}
                              className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 py-3 md:py-2 min-h-[44px] md:min-h-0"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              🗑️ Discard (Waste)
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="hidden md:block">
              <Table>
                <TableHeader className="hidden md:table-header-group">
                <TableRow className="border-coder-primary/20">
                  <TableHead className="text-coder-primary">Item</TableHead>
                  <TableHead className="text-coder-primary">Category</TableHead>
                  <TableHead className="text-coder-primary">Expiry Date</TableHead>
                  <TableHead className="text-coder-primary">Status</TableHead>
                  <TableHead className="text-coder-primary">Urgency</TableHead>
                  <TableHead className="text-right text-coder-primary">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? "No items match your search" : "No items in your inventory"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item, index) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                          className={`border-b border-border/40 hover:bg-primary/5`}
                        >
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{new Date(item.expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getBadgeVariant(item.status)}
                              className={getBadgeClasses(item.status)}
                            >
                              {getStatusText(item)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getUrgencyBadgeClasses(item.urgency_score)}>
                              {getUrgencyBadgeText(item.urgency_score)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Find recipes"
                                className="hover:bg-coder-primary/10 hover:text-coder-primary"
                                onClick={() => findRecipesForItem(item.product_name)}
                              >
                                <ChefHat className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border-coder-primary/20 bg-card/90 backdrop-blur-md">
                                  <DropdownMenuItem
                                    onClick={() => handleItemAction(item.id, "consumed")}
                                    className="hover:bg-coder-primary/10 focus:bg-coder-primary/10 py-3 md:py-2 min-h-[44px] md:min-h-0"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4 text-coder-primary" />
                                    ✅ Mark as Consumed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleItemAction(item.id, "discarded")}
                                    className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 py-3 md:py-2 min-h-[44px] md:min-h-0"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    🗑️ Discard (Waste)
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </>
      )}
    </div>
  )
}
