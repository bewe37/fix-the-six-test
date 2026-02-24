"use client"

import Link from "next/link"
import { useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon, Archive01Icon, ShoppingBasket01Icon, GiveBloodIcon,
  CreditCardIcon, AlertCircleIcon, ArrowRight01Icon, UserGroupIcon,
  DollarCircleIcon, ChartHistogramIcon,
} from "@hugeicons/core-free-icons"
import cardData from "./redemption/data.json"
import donationsData from "./donations/data.json"

export default function DashboardPage() {
  const cards = cardData.cards
  const transactions = cardData.transactions
  const donations = donationsData

  // KPI computations
  const activeCards = useMemo(() => cards.filter(c => c.status === "Active"), [cards])
  const totalRemaining = useMemo(() => cards.reduce((s, c) => s + c.remainingBalance, 0), [cards])
  const totalDonatedOut = useMemo(() => donations.reduce((s, d) => s + d.amount, 0), [donations])
  const uniqueRecipients = useMemo(() => new Set(donations.map(d => d.recipient)).size, [donations])

  // Low balance alert (active cards with < $20 remaining)
  const lowBalanceCards = useMemo(
    () => activeCards.filter(c => c.remainingBalance > 0 && c.remainingBalance < 20),
    [activeCards]
  )

  // Recent activity
  const recentTransactions = useMemo(
    () => [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [transactions]
  )

  const recentDonations = useMemo(
    () => [...donations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
    [donations]
  )

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-6 p-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Overview of gift card inventory, spending, and community impact.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Cards</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {activeCards.length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(
                    cards.reduce<Record<string, number>>((acc, c) => {
                      acc[c.status] = (acc[c.status] ?? 0) + 1
                      return acc
                    }, {})
                  ).map(([status, count]) => (
                    <Badge key={status} variant="outline" className="text-xs">
                      {count} {status}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Available Balance</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums text-green-600">
                  ${totalRemaining.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Across all active cards</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Donated Out</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  ${totalDonatedOut.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {donations.length} gift cards distributed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Recipients Helped</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {uniqueRecipients}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Individuals and families</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-3">
              Quick Actions
            </p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Link href="/add-card" className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 flex flex-col items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Add Gift Card</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Register a new card or bulk import via CSV
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/redemption" className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 flex flex-col items-start gap-3">
                    <div className="rounded-lg bg-orange-500/10 p-2.5">
                      <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={2} className="size-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Record Spend</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Log a purchase made with a gift card
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/redemption" className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 flex flex-col items-start gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2.5">
                      <HugeiconsIcon icon={GiveBloodIcon} strokeWidth={2} className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Record Donation</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Give a card to a recipient in need
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/inventory" className="block">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-5 flex flex-col items-start gap-3">
                    <div className="rounded-lg bg-purple-500/10 p-2.5">
                      <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} className="size-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">View Inventory</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Browse all cards by store and category
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Low balance alert */}
          {lowBalanceCards.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 text-yellow-600 shrink-0" />
                  <CardTitle className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    {lowBalanceCards.length} card{lowBalanceCards.length !== 1 ? "s" : ""} running low
                  </CardTitle>
                </div>
                <CardDescription className="text-yellow-700 dark:text-yellow-400">
                  These active cards have less than $20 remaining — consider using or replacing them soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowBalanceCards.map(c => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 rounded-md border border-yellow-200 dark:border-yellow-800 bg-white dark:bg-yellow-950/50 px-3 py-1.5"
                    >
                      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-3.5 text-yellow-600 shrink-0" />
                      <span className="text-xs font-medium">{c.store}</span>
                      <span className="text-xs text-muted-foreground">···· {c.last4}</span>
                      <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                        ${c.remainingBalance.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity — two columns */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Transactions</CardTitle>
                    <CardDescription>Latest card activity</CardDescription>
                  </div>
                  <Link href="/redemption">
                    <Button variant="ghost" size="sm" className="text-xs h-7 -mt-0.5">
                      View all
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 size-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  {recentTransactions.map((t, i) => {
                    const card = cards.find(c => c.id === t.cardId)
                    return (
                      <div key={t.id}>
                        {i > 0 && <Separator className="my-3" />}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium">
                                {card?.store ?? "Unknown"}
                              </span>
                              <span className="text-xs text-muted-foreground">···· {card?.last4}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  t.type === "donation"
                                    ? "text-blue-600 border-blue-300 dark:border-blue-800"
                                    : "text-orange-600 border-orange-300 dark:border-orange-800"
                                }`}
                              >
                                {t.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {t.volunteer}{t.notes ? ` · ${t.notes}` : ""}
                            </p>
                          </div>
                          <span className="text-sm font-semibold shrink-0">
                            −${t.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Donations Given */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Recent Donations Given</CardTitle>
                    <CardDescription>Gift cards distributed to the community</CardDescription>
                  </div>
                  <Link href="/donations">
                    <Button variant="ghost" size="sm" className="text-xs h-7 -mt-0.5">
                      View all
                      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 size-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div>
                  {recentDonations.map((d, i) => (
                    <div key={d.id}>
                      {i > 0 && <Separator className="my-3" />}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.recipient}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {d.store} · {d.volunteer} ·{" "}
                            {new Date(d.date).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-blue-600 shrink-0">
                          ${d.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Bottom links */}
          <div className="flex items-center justify-center gap-6 pb-2">
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
                <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} className="size-3.5" />
                Inventory
              </Button>
            </Link>
            <Link href="/donations">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
                <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className="size-3.5" />
                All Donations
              </Button>
            </Link>
            <Link href="/redemption">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
                <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} className="size-3.5" />
                Spending Log
              </Button>
            </Link>
            <Link href="/add-card">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5">
                <HugeiconsIcon icon={ChartHistogramIcon} strokeWidth={2} className="size-3.5" />
                Add Cards
              </Button>
            </Link>
          </div>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
