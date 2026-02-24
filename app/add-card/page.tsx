"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  CreditCardIcon,
  File01Icon,
  DownloadIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import existingData from "../redemption/data.json"

// ── Constants ─────────────────────────────────────────────────────────────────

const STORE_OPTIONS = [
  "Amazon", "Applebee's", "Best Buy", "Burger King", "Chick-fil-A", "Chipotle",
  "Costco", "CVS Pharmacy", "Dollar General", "Domino's", "Dunkin'", "Gap",
  "Home Depot", "IHOP", "KFC", "Kohl's", "Kroger", "Macy's", "McDonald's",
  "Old Navy", "Olive Garden", "Panera Bread", "Pizza Hut", "Safeway", "Starbucks",
  "Subway", "Taco Bell", "Target", "Trader Joe's", "TJ Maxx", "Walgreens",
  "Walmart", "Wendy's", "Whole Foods",
].sort()

const VOLUNTEERS = ["Amy Brown", "James Lee", "Lisa Chen", "Mike Davis", "Sarah Johnson"]

const CSV_TEMPLATE = `store,last4,amount,added_by,notes
Walmart,1234,100.00,Sarah Johnson,Example card
Target,5678,50.00,Mike Davis,`

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  store: string
  last4: string
  amount: string
  addedBy: string
  notes: string
}

interface FieldErrors {
  store?: string
  last4?: string
  amount?: string
  addedBy?: string
}

interface CSVRow {
  rowNum: number
  store: string
  last4: string
  amount: string
  addedBy: string
  notes: string
  status: "valid" | "duplicate" | "error"
  errors: string[]
}

const EMPTY_FORM: FormData = { store: "", last4: "", amount: "", addedBy: "", notes: "" }

// ── Helpers ───────────────────────────────────────────────────────────────────

function validateForm(form: FormData): FieldErrors {
  const e: FieldErrors = {}
  if (!form.store.trim()) e.store = "Store is required"
  if (!/^\d{4}$/.test(form.last4)) e.last4 = "Must be exactly 4 digits"
  const amt = parseFloat(form.amount)
  if (!form.amount || isNaN(amt) || amt <= 0) e.amount = "Enter a valid dollar amount"
  if (!form.addedBy.trim()) e.addedBy = "Added by is required"
  return e
}

function findDuplicate(store: string, last4: string, cards: typeof existingData.cards) {
  return cards.find(
    (c) => c.store.toLowerCase() === store.toLowerCase() && c.last4 === last4
  ) ?? null
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split(/\r?\n/)
  const dataLines = lines[0]?.toLowerCase().includes("store") ? lines.slice(1) : lines
  return dataLines
    .filter((l) => l.trim())
    .map((line, i) => {
      const parts = line.split(",").map((p) => p.trim())
      const [store = "", last4 = "", amount = "", addedBy = "", ...notesParts] = parts
      const notes = notesParts.join(",").trim()
      const errors: string[] = []
      if (!store) errors.push("Store missing")
      if (!/^\d{4}$/.test(last4)) errors.push("Last 4 must be exactly 4 digits")
      const amt = parseFloat(amount)
      if (!amount || isNaN(amt) || amt <= 0) errors.push("Invalid amount")
      if (!addedBy) errors.push("Added by missing")
      const isDup = findDuplicate(store, last4, existingData.cards)
      return {
        rowNum: i + 1,
        store,
        last4,
        amount,
        addedBy,
        notes,
        status: errors.length > 0 ? "error" : isDup ? "duplicate" : "valid",
        errors,
      } as CSVRow
    })
}

// ── Store Combobox ─────────────────────────────────────────────────────────────

function StoreCombobox({
  value,
  onChange,
  error,
}: {
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return STORE_OPTIONS
    return STORE_OPTIONS.filter((s) =>
      s.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  // Sync external value into query
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function select(store: string) {
    onChange(store)
    setQuery(store)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search or type a store name…"
        className={error ? "border-destructive" : ""}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-60 overflow-y-auto">
          {filtered.map((store) => (
            <button
              key={store}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(store) }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {store}
            </button>
          ))}
          {query.trim() && !STORE_OPTIONS.find((s) => s.toLowerCase() === query.toLowerCase()) && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(query.trim()) }}
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground border-t transition-colors"
            >
              Add &ldquo;{query.trim()}&rdquo; as new store
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AddCardPage() {
  // Single-entry form state
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pageState, setPageState] = useState<"form" | "confirm-duplicate" | "success">("form")
  const [addedCards, setAddedCards] = useState<(FormData & { id: number })[]>([])
  const [pendingDuplicate, setPendingDuplicate] = useState<ReturnType<typeof findDuplicate>>(null)

  // Bulk import state
  const [csvRows, setCsvRows] = useState<CSVRow[]>([])
  const [csvFileName, setCsvFileName] = useState("")
  const [csvImportDone, setCsvImportDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // All cards for duplicate check (existing + added this session)
  const allCards = useMemo(() => [
    ...existingData.cards,
    ...addedCards.map((c, i) => ({
      id: 9000 + i,
      store: c.store,
      last4: c.last4,
      initialBalance: parseFloat(c.amount),
      remainingBalance: parseFloat(c.amount),
      status: "Active",
      addedDate: new Date().toISOString().slice(0, 10),
      addedBy: c.addedBy,
    })),
  ], [addedCards])

  // Live duplicate check
  const liveDuplicate = useMemo(() => {
    if (!form.store || !form.last4 || form.last4.length !== 4) return null
    return findDuplicate(form.store, form.last4, allCards)
  }, [form.store, form.last4, allCards])

  function setField<K extends keyof FormData>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmitClick() {
    const errors = validateForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    const dup = findDuplicate(form.store, form.last4, allCards)
    if (dup) {
      setPendingDuplicate(dup)
      setPageState("confirm-duplicate")
    } else {
      commitCard()
    }
  }

  function commitCard() {
    setAddedCards((prev) => [...prev, { ...form, id: Date.now() }])
    setPageState("success")
  }

  function handleAddAnother() {
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setPendingDuplicate(null)
    setPageState("form")
  }

  // CSV handling
  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) return
    setCsvFileName(file.name)
    setCsvImportDone(false)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvRows(parseCSV(text))
    }
    reader.readAsText(file)
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleCSVImport(includeAll: boolean) {
    const toImport = csvRows.filter((r) =>
      includeAll ? r.status !== "error" : r.status === "valid"
    )
    const newCards = toImport.map((r, i) => ({
      id: Date.now() + i,
      store: r.store,
      last4: r.last4,
      amount: r.amount,
      addedBy: r.addedBy,
      notes: r.notes,
    }))
    setAddedCards((prev) => [...prev, ...newCards])
    setImportedCount(toImport.length)
    setCsvImportDone(true)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "gift_card_import_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const csvValid = csvRows.filter((r) => r.status === "valid").length
  const csvDuplicates = csvRows.filter((r) => r.status === "duplicate").length
  const csvErrors = csvRows.filter((r) => r.status === "error").length

  const latestCard = addedCards[addedCards.length - 1]

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="p-4 lg:p-6 max-w-3xl">

            {/* Page header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Add Gift Card</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter a single card or bulk-import from a CSV spreadsheet.
              </p>
            </div>

            <Tabs defaultValue="single">
              <TabsList className="mb-6">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="size-4" />
                  Single Entry
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-4" />
                  Bulk Import
                </TabsTrigger>
              </TabsList>

              {/* ── Single Entry ─────────────────────────────────────────── */}
              <TabsContent value="single">

                {/* Success state */}
                {pageState === "success" && latestCard && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-green-100 dark:bg-green-900 p-1">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-900 dark:text-green-100">Gift card added successfully!</p>
                          <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                            {latestCard.store} · **** {latestCard.last4} · ${parseFloat(latestCard.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            Added by {latestCard.addedBy}
                            {latestCard.notes ? ` · ${latestCard.notes}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {addedCards.length > 1 && (
                      <p className="text-sm text-muted-foreground">
                        {addedCards.length} cards added this session.
                      </p>
                    )}

                    <div className="flex gap-3">
                      <Button onClick={handleAddAnother}>
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-2 size-4" />
                        Add Another Card
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href="/inventory">
                          View Inventory
                          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Duplicate confirmation state */}
                {pageState === "confirm-duplicate" && pendingDuplicate && (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40 p-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-900 p-1">
                          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-medium text-yellow-900 dark:text-yellow-100">Possible duplicate detected</p>
                          <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                            A <strong>{pendingDuplicate.store}</strong> card ending in{" "}
                            <strong>{pendingDuplicate.last4}</strong> already exists in the system.
                          </p>
                          <p className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                            Added {pendingDuplicate.addedDate} by {pendingDuplicate.addedBy} ·{" "}
                            ${pendingDuplicate.remainingBalance.toFixed(2)} remaining
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={commitCard}>
                        Add Anyway
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPendingDuplicate(null)
                          setPageState("form")
                        }}
                      >
                        Go Back &amp; Edit
                      </Button>
                    </div>
                  </div>
                )}

                {/* Form state */}
                {pageState === "form" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Card Details</CardTitle>
                      <CardDescription>All fields are required except notes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">

                      {/* Store */}
                      <div className="space-y-1.5">
                        <Label htmlFor="store">Store</Label>
                        <StoreCombobox
                          value={form.store}
                          onChange={(v) => setField("store", v)}
                          error={fieldErrors.store}
                        />
                      </div>

                      {/* Last 4 + Amount */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="last4">Last 4 Digits</Label>
                          <Input
                            id="last4"
                            value={form.last4}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "").slice(0, 4)
                              setField("last4", v)
                            }}
                            placeholder="e.g. 1234"
                            maxLength={4}
                            inputMode="numeric"
                            className={fieldErrors.last4 ? "border-destructive" : ""}
                          />
                          {fieldErrors.last4 && (
                            <p className="text-xs text-destructive">{fieldErrors.last4}</p>
                          )}
                          {/* Live duplicate hint */}
                          {!fieldErrors.last4 && liveDuplicate && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                              <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3" />
                              Possible duplicate — review before saving
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="amount">Dollar Amount</Label>
                          <div className="relative">
                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                            <Input
                              id="amount"
                              value={form.amount}
                              onChange={(e) => {
                                const v = e.target.value.replace(/[^0-9.]/g, "")
                                setField("amount", v)
                              }}
                              placeholder="0.00"
                              inputMode="decimal"
                              className={`pl-7 ${fieldErrors.amount ? "border-destructive" : ""}`}
                            />
                          </div>
                          {fieldErrors.amount && (
                            <p className="text-xs text-destructive">{fieldErrors.amount}</p>
                          )}
                        </div>
                      </div>

                      {/* Added By */}
                      <div className="space-y-1.5">
                        <Label htmlFor="addedBy">Added By</Label>
                        <Input
                          id="addedBy"
                          list="volunteers-list"
                          value={form.addedBy}
                          onChange={(e) => setField("addedBy", e.target.value)}
                          placeholder="Volunteer name"
                          className={fieldErrors.addedBy ? "border-destructive" : ""}
                        />
                        <datalist id="volunteers-list">
                          {VOLUNTEERS.map((v) => (
                            <option key={v} value={v} />
                          ))}
                        </datalist>
                        {fieldErrors.addedBy && (
                          <p className="text-xs text-destructive">{fieldErrors.addedBy}</p>
                        )}
                      </div>

                      {/* Notes */}
                      <div className="space-y-1.5">
                        <Label htmlFor="notes">
                          Notes{" "}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Textarea
                          id="notes"
                          value={form.notes}
                          onChange={(e) => setField("notes", e.target.value)}
                          placeholder="Any additional info about this card…"
                          rows={2}
                        />
                      </div>

                      {/* Submit */}
                      <div className="pt-1">
                        <Button onClick={handleSubmitClick} className="w-full sm:w-auto">
                          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-2 size-4" />
                          Add Gift Card
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Bulk Import ──────────────────────────────────────────── */}
              <TabsContent value="bulk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">CSV Import</CardTitle>
                        <CardDescription>
                          Upload a CSV file to import multiple cards at once.
                        </CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={downloadTemplate}>
                        <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="mr-2 size-4" />
                        Download Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    {/* CSV format hint */}
                    <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground font-mono">
                      store, last4, amount, added_by, notes
                    </div>

                    {/* Drop zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleFileDrop}
                      className={`cursor-pointer rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 py-10 text-center
                        ${isDragging
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                        }`}
                    >
                      <div className="rounded-full bg-muted p-3">
                        <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {csvFileName ? csvFileName : "Drop CSV file here or click to browse"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Accepts .csv files only
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Import success */}
                    {csvImportDone && (
                      <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 px-4 py-3 flex items-center gap-3">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>{importedCount} card{importedCount !== 1 ? "s" : ""}</strong> imported successfully.
                        </p>
                      </div>
                    )}

                    {/* Preview table */}
                    {csvRows.length > 0 && (
                      <div className="space-y-3">
                        {/* Summary badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{csvRows.length} rows found</span>
                          {csvValid > 0 && <Badge variant="outline" className="text-green-600 border-green-300">{csvValid} valid</Badge>}
                          {csvDuplicates > 0 && <Badge variant="outline" className="text-yellow-600 border-yellow-300">{csvDuplicates} duplicate{csvDuplicates !== 1 ? "s" : ""}</Badge>}
                          {csvErrors > 0 && <Badge variant="destructive">{csvErrors} error{csvErrors !== 1 ? "s" : ""}</Badge>}
                        </div>

                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-10">#</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Store</TableHead>
                                <TableHead>Last 4</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Added By</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {csvRows.map((row) => (
                                <TableRow
                                  key={row.rowNum}
                                  className={
                                    row.status === "error"
                                      ? "bg-destructive/5"
                                      : row.status === "duplicate"
                                      ? "bg-yellow-50 dark:bg-yellow-950/30"
                                      : ""
                                  }
                                >
                                  <TableCell className="text-muted-foreground text-xs">{row.rowNum}</TableCell>
                                  <TableCell>
                                    {row.status === "valid" && (
                                      <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Valid</Badge>
                                    )}
                                    {row.status === "duplicate" && (
                                      <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">Duplicate</Badge>
                                    )}
                                    {row.status === "error" && (
                                      <div className="space-y-0.5">
                                        <Badge variant="destructive" className="text-xs">Error</Badge>
                                        {row.errors.map((err, i) => (
                                          <p key={i} className="text-xs text-destructive">{err}</p>
                                        ))}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="font-medium">{row.store || <span className="text-muted-foreground italic">—</span>}</TableCell>
                                  <TableCell>{row.last4 || <span className="text-muted-foreground italic">—</span>}</TableCell>
                                  <TableCell>{row.amount ? `$${parseFloat(row.amount).toFixed(2)}` : <span className="text-muted-foreground italic">—</span>}</TableCell>
                                  <TableCell>{row.addedBy || <span className="text-muted-foreground italic">—</span>}</TableCell>
                                  <TableCell className="text-muted-foreground text-xs">{row.notes || "—"}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Import actions */}
                        {!csvImportDone && (
                          <div className="flex gap-3">
                            {csvValid > 0 && (
                              <Button onClick={() => handleCSVImport(false)}>
                                Import Valid ({csvValid})
                              </Button>
                            )}
                            {csvDuplicates > 0 && (
                              <Button variant="outline" onClick={() => handleCSVImport(true)}>
                                Import All Except Errors ({csvValid + csvDuplicates})
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
