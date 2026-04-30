"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanLine, Plus, ChefHat, AlertTriangle, Search, MoreVertical, CheckCircle, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { AnimatePresence, motion } from "framer-motion"
import { supabase } from "@/lib/supabase"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { InventoryItem } from "@/types/database"

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Get JWT token from Supabase session
  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ""
  }, [])

  // Fetch inventory from Supabase via API route
  const fetchInventory = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) return

      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()

      if (data.items) {
        setInventory(data.items)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [getToken, toast])

  // Load inventory on mount
  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Filter inventory when search query or inventory changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredInventory(inventory)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = inventory.filter(
        (item) =>
          item.product_name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query),
      )
      setFilteredInventory(filtered)
    }
  }, [searchQuery, inventory])

  // Handle consumption action (consumed or discarded)
  const handleItemAction = async (id: string, action: "consumed" | "discarded") => {
    try {
      const token = await getToken()
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error("Failed to update item")

      // Remove from local state
      setInventory((prev) => prev.filter((item) => item.id !== id))

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

  // Auto-trigger recipe generation for critical items
  useEffect(() => {
    const triggerAutoRecipe = async () => {
      try {
        const token = await getToken()
        if (!token) return

        const response = await fetch("/api/auto-trigger", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (data.triggered) {
          toast({
            title: "🍳 Recipe auto-generated!",
            description: `${data.recipe_title} — uses your expiring items → View Recipes`,
            onClick: () => router.push("/recipes"),
          })
        }
      } catch (error) {
        console.error("Auto-trigger error:", error)
      }
    }

    triggerAutoRecipe()

    // Re-check every 5 minutes
    const interval = setInterval(triggerAutoRecipe, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [getToken, router, toast])

  // Show notification for expiring items
  useEffect(() => {
    const expiringItems = inventory.filter(
      (item) => item.days_remaining <= 3 && item.status !== "expired"
    )

    if (expiringItems.length > 0) {
      toast({
        title: "Items Expiring Soon!",
        description: `You have ${expiringItems.length} items expiring in the next 3 days`,
        variant: "destructive",
      })
    }
  }, [inventory, toast])

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex items-center justify-center min-h-[50vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-coder-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6 relative z-10"
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">
          Your Food Inventory
        </h1>
        <div className="flex gap-2">
          <Link href="/scan">
            <Button
              variant="outline"
              size="sm"
              className="border-coder-primary/50 text-coder-primary hover:bg-coder-primary/10"
            >
              <ScanLine className="mr-2 h-4 w-4" /> Scan New
            </Button>
          </Link>
          <Link href="/add-manual">
            <Button
              variant="outline"
              size="sm"
              className="border-coder-accent/50 text-coder-accent hover:bg-coder-accent/10"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Manually
            </Button>
          </Link>
        </div>
      </motion.div>

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
            className="pl-10 border-coder-primary/30 focus:border-coder-primary"
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
          <CardHeader className="bg-destructive/5 relative">
            <CardTitle className="text-lg flex items-center text-destructive">
              <AlertTriangle className="mr-2 h-5 w-5 text-destructive" />
              Expiring Soon - Urgent Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 relative">
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-coder-primary/20">
                  <TableHead className="text-coder-primary">Item</TableHead>
                  <TableHead className="text-coder-primary">Category</TableHead>
                  <TableHead className="text-coder-primary">Expiry Date</TableHead>
                  <TableHead className="text-coder-primary">Status</TableHead>
                  <TableHead className="text-right text-coder-primary">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
                                  className="hover:bg-coder-primary/10 focus:bg-coder-primary/10"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-coder-primary" />
                                  Mark as Consumed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleItemAction(item.id, "discarded")}
                                  className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Discard (Expired/Waste)
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
