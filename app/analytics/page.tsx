"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { BarChart2, RefreshCcw, Utensils, AlertTriangle, ChartPie } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { ConsumptionLog, InventoryItem } from "@/types/database"

type AnalyticsResult = {
  total_items: number
  fresh_count: number
  expiring_soon_count: number
  critical_count: number
  expired_count: number
  consumed_count: number
  wasted_count: number
  waste_reduction_pct: number
  items_saved_this_week: number
  most_wasted_category: string
  category_breakdown: Record<string, { total: number; critical: number }>
}

type ChartRow = {
  name: string
  value: number
}

const PIE_COLORS = ["#22c55e", "#facc15", "#00ff9d", "#ef4444"]
const BAR_TOTAL_COLOR = "#00d4ff"
const BAR_CRITICAL_COLOR = "#00ff9d"

const skeletonCards = Array.from({ length: 4 })

export default function AnalyticsPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [logs, setLogs] = useState<ConsumptionLog[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error("Not authenticated")
      }

      const [inventoryResponse, logsResponse] = await Promise.all([
        fetch("/api/inventory", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/consumption-logs", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (!inventoryResponse.ok) {
        const errorData = await inventoryResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to load inventory")
      }

      if (!logsResponse.ok) {
        const errorData = await logsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to load consumption logs")
      }

      const inventoryData = await inventoryResponse.json()
      const logsData = await logsResponse.json()
      const fetchedInventory = (inventoryData.items || []) as InventoryItem[]
      const fetchedLogs = (logsData.logs || []) as ConsumptionLog[]

      setInventory(fetchedInventory)
      setLogs(fetchedLogs)

      const fastApiUrl = process.env.NEXT_PUBLIC_API_URL
      if (!fastApiUrl) {
        throw new Error("Analytics service is not configured")
      }

      const analyticsResponse = await fetch(`${fastApiUrl}/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventory: fetchedInventory,
          consumption_logs: fetchedLogs,
        }),
      })

      if (!analyticsResponse.ok) {
        const errorData = await analyticsResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to calculate analytics")
      }

      const result = (await analyticsResponse.json()) as AnalyticsResult
      setAnalytics(result)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const pieData: ChartRow[] = useMemo(
    () => [
      { name: "Fresh", value: analytics?.fresh_count || 0 },
      { name: "Expiring Soon", value: analytics?.expiring_soon_count || 0 },
      { name: "Critical", value: analytics?.critical_count || 0 },
      { name: "Expired", value: analytics?.expired_count || 0 },
    ],
    [analytics]
  )

  const barData = useMemo(
    () =>
      Object.entries(analytics?.category_breakdown || {}).map(([name, value]) => ({
        name,
        total: value.total,
        critical: value.critical,
      })),
    [analytics]
  )

  const emptyState = !isLoading && !error && inventory.length === 0 && logs.length === 0

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-6xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {skeletonCards.map((_, index) => (
            <Card
              key={`analytics-skeleton-${index}`}
              className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm animate-pulse overflow-hidden"
            >
              <CardContent className="p-5 space-y-3">
                <div className="h-4 w-24 bg-muted/40 rounded" />
                <div className="h-8 w-16 bg-muted/40 rounded" />
                <div className="h-3 w-32 bg-muted/40 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm animate-pulse h-[340px] overflow-hidden" />
          <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm animate-pulse h-[340px] overflow-hidden" />
        </div>
        <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm animate-pulse h-[260px] overflow-hidden" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-6xl">
        <Card className="border border-coder-primary/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 flex flex-col gap-4 items-start">
            <p className="text-sm">⚠️ Failed to load data — {error}</p>
            <Button
              variant="outline"
              className="border-coder-primary/50 text-coder-primary hover:bg-coder-primary/10 min-h-[44px]"
              onClick={loadAnalytics}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (emptyState) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-6xl">
        <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-5xl">📊</div>
            <div>
              <h2 className="text-xl font-semibold">No data yet</h2>
              <p className="text-sm text-muted-foreground">Add items to your inventory and start tracking consumption.</p>
            </div>
            <Button
              className="bg-coder-primary hover:bg-coder-primary/80 text-black min-h-[44px]"
              onClick={() => router.push("/inventory")}
            >
              Go to Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-coder-primary to-coder-accent bg-clip-text text-transparent">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Track waste reduction and pantry performance.</p>
        </div>
        <Button
          variant="outline"
          className="border-coder-primary/50 text-coder-primary hover:bg-coder-primary/10 min-h-[44px]"
          onClick={loadAnalytics}
        >
          <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Items Saved"
          value={analytics?.items_saved_this_week ?? 0}
          accentClassName="text-coder-primary"
          icon={<Utensils className="h-4 w-4" />}
        />
        <MetricCard
          title="Waste Reduction %"
          value={`${analytics?.waste_reduction_pct ?? 0}%`}
          accentClassName="text-coder-accent"
          icon={<BarChart2 className="h-4 w-4" />}
        />
        <MetricCard
          title="Critical Items"
          value={analytics?.critical_count ?? 0}
          accentClassName="text-red-500"
          pulse={(analytics?.critical_count ?? 0) > 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Tracked"
          value={analytics?.total_items ?? inventory.length}
          accentClassName="text-foreground"
          icon={<ChartPie className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg text-coder-primary">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] md:h-[340px] w-full overflow-hidden" style={{ minWidth: 0 }}>
            {pieData.every(d => d.value === 0) ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                No inventory data yet — add items to see analytics
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(13, 13, 13, 0.9)",
                    border: "1px solid rgba(0, 255, 157, 0.25)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="hidden md:block border border-coder-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-coder-primary">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    background: "rgba(13, 13, 13, 0.9)",
                    border: "1px solid rgba(0, 255, 157, 0.25)",
                    borderRadius: 12,
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill={BAR_TOTAL_COLOR} radius={[6, 6, 0, 0]} name="Total" />
                <Bar dataKey="critical" fill={BAR_CRITICAL_COLOR} radius={[6, 6, 0, 0]} name="Critical" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg text-coder-primary">Consumption History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-left text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Item</th>
                  <th className="hidden md:table-cell py-3 pr-4 font-medium">Category</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                  <th className="py-3 pr-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/30 last:border-b-0">
                    <td className="py-3 pr-4 font-medium">{log.product_name}</td>
                    <td className="hidden md:table-cell py-3 pr-4 text-muted-foreground">{log.category}</td>
                    <td className="py-3 pr-4">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{new Date(log.logged_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  accentClassName,
  icon,
  pulse = false,
}: {
  title: string
  value: string | number
  accentClassName: string
  icon: ReactNode
  pulse?: boolean
}) {
  return (
    <Card className="border border-coder-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className={`mt-2 text-3xl font-bold ${accentClassName} ${pulse ? "animate-pulse" : ""}`}>
              {value}
            </div>
          </div>
          <div className="rounded-full border border-coder-primary/20 bg-background/30 p-3 text-coder-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionBadge({ action }: { action: ConsumptionLog["action"] }) {
  const classes =
    action === "consumed"
      ? "border-green-500/30 bg-green-500/10 text-green-400"
      : action === "expired"
        ? "border-red-500/30 bg-red-500/10 text-red-400"
        : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"

  return <Badge className={classes}>{action}</Badge>
}
