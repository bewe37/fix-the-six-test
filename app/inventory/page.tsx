"use client"

import { useState, useMemo } from "react"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import redemptionData from "../redemption/data.json"

// ── Constants ────────────────────────────────────────────────────────────────

const STORE_CATEGORIES: Record<string, string> = {
  "Walmart": "Grocery", "Target": "Grocery", "Kroger": "Grocery",
  "Costco": "Grocery", "Whole Foods": "Grocery", "Safeway": "Grocery",
  "Trader Joe's": "Grocery", "McDonald's": "Fast Food", "Starbucks": "Fast Food",
  "Subway": "Fast Food", "Chipotle": "Fast Food", "Panera Bread": "Fast Food",
  "Dunkin'": "Fast Food", "Taco Bell": "Fast Food", "Chick-fil-A": "Fast Food",
  "Olive Garden": "Fast Food", "Old Navy": "Clothing", "Gap": "Clothing",
  "TJ Maxx": "Clothing", "Kohl's": "Clothing", "Macy's": "Clothing",
  "Amazon": "Other", "CVS Pharmacy": "Other", "Best Buy": "Other",
  "Home Depot": "Other",
}

const CATEGORY_COLORS: Record<string, string> = {
  "Grocery":   "hsl(var(--chart-1))",
  "Fast Food": "hsl(var(--chart-2))",
  "Clothing":  "hsl(var(--chart-3))",
  "Other":     "hsl(var(--chart-4))",
}

const CATEGORY_RAW: Record<string, string> = {
  "Grocery":   "#22c55e",
  "Fast Food": "#f97316",
  "Clothing":  "#8b5cf6",
  "Other":     "#3b82f6",
}

const CATEGORIES = ["All", "Grocery", "Fast Food", "Clothing", "Other"]

// ── Treemap custom cell ───────────────────────────────────────────────────────

function TreemapCell(props: any) {
  const { x, y, width, height, name, category, remaining } = props
  if (!width || !height || width < 2 || height < 2) return null
  const color = CATEGORY_RAW[category] ?? "#6b7280"
  const showText = width > 45 && height > 28
  const showValue = width > 70 && height > 48

  return (
    <g>
      <rect
        x={x + 1} y={y + 1}
        width={width - 2} height={height - 2}
        fill={color} fillOpacity={0.82}
        rx={6} ry={6}
        stroke="hsl(var(--background))" strokeWidth={2}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showValue ? -8 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={Math.min(12, width / 6)}
          fontWeight={600}
          style={{ pointerEvents: "none" }}
        >
          {name}
        </text>
      )}
      {showValue && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.75)"
          fontSize={10}
          style={{ pointerEvents: "none" }}
        >
          ${remaining?.toFixed(0)}
        </text>
      )}
    </g>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [activeCategory, setActiveCategory] = useState("All")

  const cards = redemptionData.cards
  const transactions = redemptionData.transactions

  // Summary stats
  const totalCards = cards.length
  const totalRemaining = cards.reduce((s, c) => s + c.remainingBalance, 0)
  const totalDonatedOut = transactions
    .filter((t) => t.type === "donation")
    .reduce((s, t) => s + t.amount, 0)
  const totalRedeemed = cards.reduce((s, c) => s + (c.initialBalance - c.remainingBalance), 0)
  const statusCounts = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  // Per-store breakdown
  const storeBreakdown = useMemo(() => {
    const map = new Map<string, {
      store: string; category: string; count: number
      remaining: number; redeemed: number; donated: number
    }>()
    for (const c of cards) {
      const cat = STORE_CATEGORIES[c.store] ?? "Other"
      if (!map.has(c.store)) {
        map.set(c.store, { store: c.store, category: cat, count: 0, remaining: 0, redeemed: 0, donated: 0 })
      }
      const e = map.get(c.store)!
      e.count += 1
      e.remaining += c.remainingBalance
      e.redeemed += c.initialBalance - c.remainingBalance
    }
    for (const t of transactions) {
      if (t.type === "donation") {
        const card = cards.find((c) => c.id === t.cardId)
        if (card) {
          const e = map.get(card.store)
          if (e) e.donated += t.amount
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.remaining - a.remaining)
  }, [cards, transactions])

  // Category summary
  const categorySummary = useMemo(() => {
    const map = new Map<string, { count: number; remaining: number; redeemed: number }>()
    for (const c of cards) {
      const cat = STORE_CATEGORIES[c.store] ?? "Other"
      if (!map.has(cat)) map.set(cat, { count: 0, remaining: 0, redeemed: 0 })
      const e = map.get(cat)!
      e.count += 1; e.remaining += c.remainingBalance
      e.redeemed += c.initialBalance - c.remainingBalance
    }
    return map
  }, [cards])

  // Filtered stores by active tab
  const filteredStores = activeCategory === "All"
    ? storeBreakdown
    : storeBreakdown.filter((s) => s.category === activeCategory)

  // Flat treemap data
  const treemapData = useMemo(() => {
    const source = activeCategory === "All"
      ? storeBreakdown
      : storeBreakdown.filter((s) => s.category === activeCategory)
    return source
      .filter((s) => s.remaining > 0)
      .map((s) => ({
        name: s.store,
        size: parseFloat(s.remaining.toFixed(2)),
        remaining: parseFloat(s.remaining.toFixed(2)),
        redeemed: parseFloat(s.redeemed.toFixed(2)),
        category: s.category,
      }))
  }, [storeBreakdown, activeCategory])

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">Inventory</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gift card breakdown by store, category, and status.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total Cards</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{totalCards}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <Badge key={status} variant="outline" className="text-xs">
                    {count} {status}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Remaining Value</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums text-green-600">
                  ${totalRemaining.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Available across all cards</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Total Redeemed</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  ${totalRedeemed.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Total value spent or donated out from all cards
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList>
              {CATEGORIES.map((cat) => {
                const count = cat === "All" ? totalCards : (categorySummary.get(cat)?.count ?? 0)
                return (
                  <TabsTrigger key={cat} value={cat}>
                    {cat}
                    <span className="ml-1.5 text-xs opacity-60">{count}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {CATEGORIES.map((cat) => (
              <TabsContent key={cat} value={cat} className="mt-4 flex flex-col gap-6">

                {/* Category stat row */}
                {cat !== "All" && categorySummary.has(cat) && (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Cards", value: categorySummary.get(cat)!.count.toString() },
                      { label: "Remaining", value: `$${categorySummary.get(cat)!.remaining.toFixed(2)}` },
                      { label: "Redeemed", value: `$${categorySummary.get(cat)!.redeemed.toFixed(2)}` },
                    ].map((item) => (
                      <Card key={item.label}>
                        <CardHeader className="pb-2">
                          <CardDescription>{item.label}</CardDescription>
                          <CardTitle className="text-2xl font-semibold tabular-nums" style={{ color: CATEGORY_RAW[cat] }}>
                            {item.value}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Treemap */}
                <Card>
                  <CardHeader>
                    <CardTitle>Value Distribution</CardTitle>
                    <CardDescription>
                      Tile size = remaining balance · hover for details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {treemapData.length === 0 ? (
                      <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                        No remaining balance in this category.
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <Treemap
                            data={treemapData}
                            dataKey="size"
                            aspectRatio={16 / 9}
                            content={(props) => <TreemapCell {...props} />}
                          >
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null
                                const d = payload[0].payload
                                return (
                                  <div className="bg-background border rounded-lg shadow-md px-3 py-2 text-sm min-w-[140px]">
                                    <p className="font-semibold mb-1">{d.name}</p>
                                    <div className="space-y-0.5 text-xs">
                                      <p className="text-green-600">Remaining: <span className="font-medium">${d.remaining?.toFixed(2)}</span></p>
                                      <p className="text-orange-500">Redeemed: <span className="font-medium">${d.redeemed?.toFixed(2)}</span></p>
                                      <p className="text-muted-foreground mt-1">{d.category}</p>
                                    </div>
                                  </div>
                                )
                              }}
                            />
                          </Treemap>
                        </ResponsiveContainer>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mt-3 justify-center">
                          {Object.entries(CATEGORY_RAW).map(([c, color]) => (
                            <div key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                              {c}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Store Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Store Breakdown</CardTitle>
                    <CardDescription>
                      {filteredStores.length} store{filteredStores.length !== 1 ? "s" : ""}
                      {cat !== "All" ? ` in ${cat}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Store</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-center"># Cards</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead className="text-right">Redeemed</TableHead>
                          <TableHead className="text-right">Donated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStores.map((row) => (
                          <TableRow key={row.store}>
                            <TableCell className="font-medium">{row.store}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: CATEGORY_RAW[row.category] + "60",
                                  color: CATEGORY_RAW[row.category],
                                }}
                              >
                                {row.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{row.count}</TableCell>
                            <TableCell className="text-right font-medium text-green-600">
                              ${row.remaining.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ${row.redeemed.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              ${row.donated.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      {/* Totals row */}
                      <TableBody>
                        <TableRow className="border-t-2 font-semibold bg-muted/30">
                          <TableCell>Total</TableCell>
                          <TableCell />
                          <TableCell className="text-center">
                            {filteredStores.reduce((s, r) => s + r.count, 0)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            ${filteredStores.reduce((s, r) => s + r.remaining, 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            ${filteredStores.reduce((s, r) => s + r.redeemed, 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            ${filteredStores.reduce((s, r) => s + r.donated, 0).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

              </TabsContent>
            ))}
          </Tabs>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
