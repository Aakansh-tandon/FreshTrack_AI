"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScanLine, Plus, Trash2, ChefHat, AlertTriangle, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { AnimatePresence, motion } from "framer-motion"

// Sample inventory data as fallback
const sampleInventory = [
  {
    id: 1,
    name: "Milk",
    expiryDate: "2025-04-15",
    daysLeft: 12,
    category: "Dairy",
  },
  {
    id: 2,
    name: "Bread",
    expiryDate: "2025-04-05",
    daysLeft: 2,
    category: "Bakery",
  },
  {
    id: 3,
    name: "Chicken",
    expiryDate: "2025-04-07",
    daysLeft: 4,
    category: "Meat",
  },
  {
    id: 4,
    name: "Spinach",
    expiryDate: "2025-04-06",
    daysLeft: 3,
    category: "Vegetables",
  },
  {
    id: 5,
    name: "Yogurt",
    expiryDate: "2025-04-10",
    daysLeft: 7,
    category: "Dairy",
  },
]

export default function InventoryPage() {
  const [inventory, setInventory] = useState(sampleInventory)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredInventory, setFilteredInventory] = useState(inventory)
  const { toast } = useToast()

  // Load inventory from localStorage on mount
  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem("inventory")
      if (storedInventory) {
        const parsedInventory = JSON.parse(storedInventory)
        if (Array.isArray(parsedInventory) && parsedInventory.length > 0) {
          setInventory(parsedInventory)
        }
      }
    } catch (error) {
      console.error("Error loading inventory from localStorage:", error)
    }
  }, [])

  // Filter inventory when search query or inventory changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredInventory(inventory)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = inventory.filter(
        (item) => item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query),
      )
      setFilteredInventory(filtered)
    }
  }, [searchQuery, inventory])

  // Function to remove an item from inventory
  const removeItem = (id: number) => {
    const updatedInventory = inventory.filter((item) => item.id !== id)
    setInventory(updatedInventory)

    // Update localStorage
    try {
      localStorage.setItem("inventory", JSON.stringify(updatedInventory))
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }

    toast({
      title: "Item removed",
      description: "Item has been removed from your inventory",
    })
  }

  // Function to get badge variant based on days left
  const getBadgeVariant = (daysLeft: number) => {
    if (daysLeft <= 2) return "destructive"
    if (daysLeft <= 5) return "warning"
    return "success"
  }

  // Function to get status text based on days left
  const getStatusText = (daysLeft: number) => {
    if (daysLeft <= 2) return `${daysLeft} days left`
    if (daysLeft <= 5) return "Expiring Soon"
    return "Fresh"
  }

  // Find recipes for a specific item
  const findRecipesForItem = (itemName: string) => {
    // Store the ingredient in localStorage for the recipe generation page
    localStorage.setItem("recipeIngredients", JSON.stringify([itemName]))
    // Navigate to recipe generation page
    window.location.href = "/recipes/generate"
  }

  // Show notification for items expiring in less than 3 days
  useEffect(() => {
    const expiringItems = inventory.filter((item) => item.daysLeft <= 3)

    if (expiringItems.length > 0) {
      // In a real app, this would trigger a push notification
      // For demo purposes, we'll just show a toast
      toast({
        title: "Items Expiring Soon!",
        description: `You have ${expiringItems.length} items expiring in the next 3 days`,
        variant: "destructive",
      })
    }
  }, [])

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
                  .filter((item) => item.daysLeft <= 3)
                  .map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className={`bg-muted/50 ${item.daysLeft <= 2 ? "border-destructive/50" : "border-warning/50"} overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent"></div>
                        <CardContent className="p-4 flex justify-between items-center relative">
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Expires: {new Date(item.expiryDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge
                              variant={getBadgeVariant(item.daysLeft)}
                              className={`${item.daysLeft <= 2 ? "bg-destructive text-white" : "bg-warning text-black"} animate-pulse`}
                            >
                              {item.daysLeft} days left
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Find recipes"
                              className="hover:bg-coder-primary/10 hover:text-coder-primary"
                              onClick={() => findRecipesForItem(item.name)}
                            >
                              <ChefHat className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {filteredInventory.filter((item) => item.daysLeft <= 3).length === 0 && (
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
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getBadgeVariant(item.daysLeft)}
                            className={item.daysLeft <= 3 ? "animate-pulse" : ""}
                          >
                            {getStatusText(item.daysLeft)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Find recipes"
                              className="hover:bg-coder-primary/10 hover:text-coder-primary"
                              onClick={() => findRecipesForItem(item.name)}
                            >
                              <ChefHat className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              title="Remove item"
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

