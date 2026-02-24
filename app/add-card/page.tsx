"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon, CreditCardIcon, File01Icon, DownloadIcon,
  CheckmarkCircle01Icon, AlertCircleIcon, ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import existingData from "../redemption/data.json"

// ── Constants ──────────────────────────────────────────────────────────────────

const STORE_OPTIONS = [
  "Amazon", "Applebee's", "Best Buy", "Burger King", "Chick-fil-A", "Chipotle",
  "Costco", "CVS Pharmacy", "Dollar General", "Domino's", "Dunkin'", "Gap",
  "Home Depot", "IHOP", "KFC", "Kohl's", "Kroger", "Macy's", "McDonald's",
  "Old Navy", "Olive Garden", "Panera Bread", "Pizza Hut", "Safeway", "Starbucks",
  "Subway", "Taco Bell", "Target", "Trader Joe's", "TJ Maxx", "Walgreens",
  "Walmart", "Wendy's", "Whole Foods",
].sort()

const VOLUNTEERS = ["Amy Brown", "James Lee", "Lisa Chen", "Mike Davis", "Sarah Johnson"]
const CSV_TEMPLATE = `store,last4,amount,added_by,notes\nWalmart,1234,100.00,Sarah Johnson,Example card\nTarget,5678,50.00,Mike Davis,`
const today = new Date().toISOString().slice(0, 10)

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormData {
  store: string; last4: string; amount: string
  dateAdded: string; addedBy: string; notes: string
}
interface FieldErrors { store?: string; last4?: string; amount?: string; addedBy?: string }
interface CSVRow {
  rowNum: number; store: string; last4: string; amount: string
  addedBy: string; notes: string; status: "valid" | "duplicate" | "error"; errors: string[]
}

const EMPTY_FORM: FormData = { store: "", last4: "", amount: "", dateAdded: today, addedBy: "", notes: "" }

// ── Helpers ────────────────────────────────────────────────────────────────────

function validateForm(f: FormData): FieldErrors {
  const e: FieldErrors = {}
  if (!f.store.trim()) e.store = "Store is required"
  if (!/^\d{4}$/.test(f.last4)) e.last4 = "Must be exactly 4 digits"
  const amt = parseFloat(f.amount)
  if (!f.amount || isNaN(amt) || amt <= 0) e.amount = "Enter a valid dollar amount"
  if (!f.addedBy.trim()) e.addedBy = "Added by is required"
  return e
}

function findDuplicate(store: string, last4: string, cards: typeof existingData.cards) {
  return cards.find(c => c.store.toLowerCase() === store.toLowerCase() && c.last4 === last4) ?? null
}

function parseCSV(text: string): CSVRow[] {
  const lines = text.trim().split(/\r?\n/)
  const data = lines[0]?.toLowerCase().includes("store") ? lines.slice(1) : lines
  return data.filter(l => l.trim()).map((line, i) => {
    const [store = "", last4 = "", amount = "", addedBy = "", ...rest] = line.split(",").map(p => p.trim())
    const errors: string[] = []
    if (!store) errors.push("Store missing")
    if (!/^\d{4}$/.test(last4)) errors.push("Last 4 must be 4 digits")
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) errors.push("Invalid amount")
    if (!addedBy) errors.push("Added by missing")
    const isDup = findDuplicate(store, last4, existingData.cards)
    return {
      rowNum: i + 1, store, last4, amount, addedBy, notes: rest.join(",").trim(),
      status: errors.length ? "error" : isDup ? "duplicate" : "valid", errors,
    } as CSVRow
  })
}

// ── Store Combobox ─────────────────────────────────────────────────────────────

function StoreCombobox({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() =>
    !query.trim() ? STORE_OPTIONS : STORE_OPTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()))
  , [query])

  useEffect(() => { setQuery(value) }, [value])
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Search or type a store name…"
        className={error ? "border-destructive" : ""}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-52 overflow-y-auto">
          {filtered.map(store => (
            <button key={store} type="button"
              onMouseDown={e => { e.preventDefault(); onChange(store); setQuery(store); setOpen(false) }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >{store}</button>
          ))}
          {query.trim() && !STORE_OPTIONS.find(s => s.toLowerCase() === query.toLowerCase()) && (
            <button type="button"
              onMouseDown={e => { e.preventDefault(); onChange(query.trim()); setQuery(query.trim()); setOpen(false) }}
              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent border-t hover:text-accent-foreground transition-colors"
            >Add &ldquo;{query.trim()}&rdquo; as new store</button>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AddCardPage() {
  // Single entry state
  const [form, setFormState] = useState<FormData>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [pageState, setPageState] = useState<"form" | "confirm-duplicate" | "success">("form")
  const [addedCards, setAddedCards] = useState<(FormData & { id: number })[]>([])
  const [pendingDuplicate, setPendingDuplicate] = useState<ReturnType<typeof findDuplicate>>(null)

  // CSV state
  const [csvRows, setCsvRows] = useState<CSVRow[]>([])
  const [csvFileName, setCsvFileName] = useState("")
  const [csvImportDone, setCsvImportDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allCards = useMemo(() => [
    ...existingData.cards,
    ...addedCards.map((c, i) => ({
      id: 9000 + i, store: c.store, last4: c.last4,
      initialBalance: parseFloat(c.amount), remainingBalance: parseFloat(c.amount),
      status: "Active", addedDate: c.dateAdded, addedBy: c.addedBy,
    })),
  ], [addedCards])

  const liveDuplicate = useMemo(() => {
    if (!form.store || form.last4.length !== 4) return null
    return findDuplicate(form.store, form.last4, allCards)
  }, [form.store, form.last4, allCards])

  function setField<K extends keyof FormData>(key: K, value: string) {
    setFormState(prev => ({ ...prev, [key]: value }))
    setFieldErrors(prev => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit() {
    const errors = validateForm(form)
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    const dup = findDuplicate(form.store, form.last4, allCards)
    if (dup) { setPendingDuplicate(dup); setPageState("confirm-duplicate") }
    else commitCard()
  }

  function commitCard() {
    setAddedCards(prev => [...prev, { ...form, id: Date.now() }])
    setPageState("success")
  }

  function handleAddAnother() {
    setFormState(EMPTY_FORM); setFieldErrors({})
    setPendingDuplicate(null); setPageState("form")
  }

  function processFile(file: File) {
    if (!file.name.endsWith(".csv")) return
    setCsvFileName(file.name); setCsvImportDone(false)
    const reader = new FileReader()
    reader.onload = e => setCsvRows(parseCSV(e.target?.result as string))
    reader.readAsText(file)
  }

  function handleCSVImport(includeAll: boolean) {
    const toImport = csvRows.filter(r => includeAll ? r.status !== "error" : r.status === "valid")
    setAddedCards(prev => [...prev, ...toImport.map((r, i) => ({
      id: Date.now() + i, store: r.store, last4: r.last4,
      amount: r.amount, dateAdded: today, addedBy: r.addedBy, notes: r.notes,
    }))])
    setImportedCount(toImport.length); setCsvImportDone(true)
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "gift_card_import_template.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const csvValid = csvRows.filter(r => r.status === "valid").length
  const csvDuplicates = csvRows.filter(r => r.status === "duplicate").length
  const csvErrors = csvRows.filter(r => r.status === "error").length
  const latestCard = addedCards[addedCards.length - 1]

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Page header */}
          <div className="border-b px-6 py-4 shrink-0">
            <h1 className="text-lg font-semibold">Add Gift Card</h1>
            <p className="text-sm text-muted-foreground">Drop a CSV on the left to bulk import, or fill in the form to add a single card.</p>
          </div>

          {/* Two-column body */}
          <div className="flex flex-1 overflow-hidden">

            {/* ── Left: Single Entry form ──────────────────────────── */}
            <div className="flex-1 border-r flex flex-col overflow-y-auto">

              {/* ── Success ── */}
              {pageState === "success" && latestCard && (
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0 rounded-full bg-green-100 dark:bg-green-900 p-1">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-100 text-sm">Gift card added!</p>
                          <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                            {latestCard.store} · **** {latestCard.last4} · ${parseFloat(latestCard.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            Added by {latestCard.addedBy}{latestCard.notes ? ` · ${latestCard.notes}` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    {addedCards.length > 1 && (
                      <p className="text-xs text-muted-foreground">{addedCards.length} cards added this session.</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <Button onClick={handleAddAnother} className="w-full">
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="mr-2 size-4" />
                      Add Another Card
                    </Button>
                    <Link href="/inventory" className="w-full">
                      <Button variant="outline" className="w-full">
                        View Inventory
                        <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-2 size-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* ── Duplicate confirm ── */}
              {pageState === "confirm-duplicate" && pendingDuplicate && (
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0 rounded-full bg-yellow-100 dark:bg-yellow-900 p-1">
                        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">Possible duplicate</p>
                        <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                          A <strong>{pendingDuplicate.store}</strong> card ending in <strong>{pendingDuplicate.last4}</strong> already exists.
                        </p>
                        <p className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-300">
                          Added {pendingDuplicate.addedDate} by {pendingDuplicate.addedBy} · ${pendingDuplicate.remainingBalance.toFixed(2)} remaining
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-4">
                    <Button onClick={commitCard} className="w-full">Add Anyway</Button>
                    <Button variant="outline" className="w-full"
                      onClick={() => { setPendingDuplicate(null); setPageState("form") }}>
                      Go Back &amp; Edit
                    </Button>
                  </div>
                </div>
              )}

              {/* ── Form ── */}
              {pageState === "form" && (
                <div className="flex flex-1 flex-col">
                  <div className="p-6 space-y-4">
                    <p className="text-sm font-semibold">Summary</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Store</Label>
                      <StoreCombobox value={form.store} onChange={v => setField("store", v)} error={fieldErrors.store} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Last 4 Digits</Label>
                        <Input
                          value={form.last4}
                          onChange={e => setField("last4", e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="1234" inputMode="numeric" maxLength={4}
                          className={fieldErrors.last4 ? "border-destructive" : ""}
                        />
                        {fieldErrors.last4 && <p className="text-xs text-destructive">{fieldErrors.last4}</p>}
                        {!fieldErrors.last4 && liveDuplicate && (
                          <p className="text-xs text-yellow-600 flex items-center gap-1">
                            <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3" />
                            Possible duplicate
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Amount</Label>
                        <div className="relative">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">$</span>
                          <Input
                            value={form.amount}
                            onChange={e => setField("amount", e.target.value.replace(/[^0-9.]/g, ""))}
                            placeholder="0.00" inputMode="decimal"
                            className={`pl-7 ${fieldErrors.amount ? "border-destructive" : ""}`}
                          />
                        </div>
                        {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Date added</Label>
                      <Input type="date" value={form.dateAdded} onChange={e => setField("dateAdded", e.target.value)} />
                    </div>
                  </div>
                  <Separator />
                  <div className="p-6 space-y-4">
                    <p className="text-sm font-semibold">Card Details</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Added by</Label>
                      <Input
                        list="volunteers-list"
                        value={form.addedBy}
                        onChange={e => setField("addedBy", e.target.value)}
                        placeholder="Volunteer name"
                        className={fieldErrors.addedBy ? "border-destructive" : ""}
                      />
                      <datalist id="volunteers-list">
                        {VOLUNTEERS.map(v => <option key={v} value={v} />)}
                      </datalist>
                      {fieldErrors.addedBy && <p className="text-xs text-destructive">{fieldErrors.addedBy}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Notes <span className="text-muted-foreground/60">(optional)</span>
                      </Label>
                      <Textarea
                        value={form.notes}
                        onChange={e => setField("notes", e.target.value)}
                        placeholder="Any additional info about this card…"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="mt-auto border-t p-4 flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm"
                      onClick={() => { setFormState(EMPTY_FORM); setFieldErrors({}) }}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={handleSubmit}>
                      <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} className="mr-2 size-3.5" />
                      Add Gift Card
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Bulk Import drop zone ────────────────────── */}
            <div className="flex-1 flex flex-col overflow-y-auto">

              {/* Drop area */}
              <div
                onClick={() => !csvRows.length && fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault(); setIsDragging(false)
                  const f = e.dataTransfer.files[0]; if (f) processFile(f)
                }}
                className={`flex flex-col items-center justify-center gap-3 transition-colors
                  ${csvRows.length ? "py-6 border-b cursor-default" : "flex-1 cursor-pointer"}
                  ${isDragging ? "bg-primary/5" : csvRows.length ? "bg-muted/30" : "hover:bg-muted/20"}`}
              >
                <div className={`rounded-full p-4 transition-colors ${isDragging ? "bg-primary/10" : "bg-muted"}`}>
                  <HugeiconsIcon
                    icon={csvImportDone ? CheckmarkCircle01Icon : File01Icon}
                    strokeWidth={1.5}
                    className={`size-8 transition-colors ${isDragging ? "text-primary" : csvImportDone ? "text-green-500" : "text-muted-foreground"}`}
                  />
                </div>
                <div className="text-center">
                  {csvRows.length ? (
                    <p className="text-sm font-medium">{csvFileName}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">
                        {isDragging ? "Release to upload" : "Drop CSV file here"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or{" "}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); fileInputRef.current?.click() }}
                          className="underline underline-offset-2 hover:text-foreground transition-colors"
                        >
                          browse files
                        </button>
                      </p>
                    </>
                  )}
                </div>

                {/* Format hint shown when empty */}
                {!csvRows.length && (
                  <div className="mt-2 rounded-md border bg-background/80 px-4 py-2 text-xs text-muted-foreground font-mono">
                    store, last4, amount, added_by, notes
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />

              {/* CSV preview + actions */}
              {csvRows.length > 0 && (
                <div className="flex flex-col flex-1 p-4 gap-4">

                  {/* Summary row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{csvRows.length} rows</span>
                      {csvValid > 0 && <Badge variant="outline" className="text-green-600 border-green-300 text-xs">{csvValid} valid</Badge>}
                      {csvDuplicates > 0 && <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">{csvDuplicates} duplicate{csvDuplicates !== 1 ? "s" : ""}</Badge>}
                      {csvErrors > 0 && <Badge variant="destructive" className="text-xs">{csvErrors} error{csvErrors !== 1 ? "s" : ""}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setCsvRows([]); setCsvFileName(""); setCsvImportDone(false) }}>
                        Clear
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadTemplate}>
                        <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="mr-1.5 size-3.5" />
                        Template
                      </Button>
                    </div>
                  </div>

                  {/* Import success banner */}
                  {csvImportDone && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 px-4 py-3 flex items-center gap-3">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 text-green-600 shrink-0" />
                      <p className="text-sm text-green-800 dark:text-green-200">
                        <strong>{importedCount} card{importedCount !== 1 ? "s" : ""}</strong> imported successfully.
                      </p>
                    </div>
                  )}

                  {/* Preview table */}
                  <div className="rounded-md border overflow-auto flex-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8">#</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Store</TableHead>
                          <TableHead>Last 4</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Added By</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvRows.map(row => (
                          <TableRow key={row.rowNum}
                            className={row.status === "error" ? "bg-destructive/5" : row.status === "duplicate" ? "bg-yellow-50 dark:bg-yellow-950/30" : ""}
                          >
                            <TableCell className="text-muted-foreground text-xs">{row.rowNum}</TableCell>
                            <TableCell>
                              {row.status === "valid" && <Badge variant="outline" className="text-green-600 border-green-300 text-xs">Valid</Badge>}
                              {row.status === "duplicate" && <Badge variant="outline" className="text-yellow-600 border-yellow-300 text-xs">Duplicate</Badge>}
                              {row.status === "error" && (
                                <div className="space-y-0.5">
                                  <Badge variant="destructive" className="text-xs">Error</Badge>
                                  {row.errors.map((err, i) => <p key={i} className="text-xs text-destructive">{err}</p>)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium text-sm">{row.store || <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-sm">{row.last4 || <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-sm">{row.amount ? `$${parseFloat(row.amount).toFixed(2)}` : <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-sm">{row.addedBy || <span className="text-muted-foreground italic">—</span>}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{row.notes || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Import action buttons */}
                  {!csvImportDone && (
                    <div className="flex gap-2 shrink-0">
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

              {/* Empty state download hint */}
              {!csvRows.length && (
                <div className="p-4 border-t mt-auto">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HugeiconsIcon icon={DownloadIcon} strokeWidth={2} className="size-3.5" />
                    Download CSV template
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
