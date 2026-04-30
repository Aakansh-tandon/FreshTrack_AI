"use client"

import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { InventoryItem } from "@/types/database"

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get JWT access token from Supabase session
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [])

  // Fetch all active inventory items
  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getAuthToken()
      if (!token) {
        setError("Not authenticated")
        return
      }

      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch inventory")

      const data = await response.json()
      setItems(data.items || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load inventory"
      setError(message)
      console.error("Inventory fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [getAuthToken])

  // Add a new item to inventory
  const addItem = useCallback(
    async (item: {
      product_name: string
      category: string
      expiry_date: string
      quantity: number
      ocr_confidence?: number | null
    }) => {
      try {
        const token = await getAuthToken()
        if (!token) throw new Error("Not authenticated")

        const response = await fetch("/api/inventory", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        })

        if (!response.ok) throw new Error("Failed to add item")

        const data = await response.json()
        // Append new item to local state
        if (data.item) {
          setItems((prev) => [...prev, data.item])
        }
        return data.item
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add item"
        setError(message)
        throw err
      }
    },
    [getAuthToken]
  )

  // Remove/action an item (consumed or discarded)
  const removeItem = useCallback(
    async (id: string, action: "consumed" | "discarded") => {
      try {
        const token = await getAuthToken()
        if (!token) throw new Error("Not authenticated")

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
        setItems((prev) => prev.filter((item) => item.id !== id))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update item"
        setError(message)
        throw err
      }
    },
    [getAuthToken]
  )

  return { items, loading, error, fetchItems, addItem, removeItem }
}
