import { useState } from 'react'
import { GitMerge, Trash2, Plus, RotateCcw, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { useMatches, useRunFifo, useCreateManualMatch, useDeleteMatch, useUnwindAll } from '@/hooks/use-matching'
import { useContracts } from '@/hooks/use-contracts'
import { formatQuantity, formatPrice, formatUSD, formatDate } from '@/lib/formatters'
import type { MatchOut, MatchCreate } from '@/types'

export default function MatchingPage() {
  const { data: matches = [], isLoading } = useMatches()
  const { data: contracts = [] } = useContracts()
  const runFifo = useRunFifo()
  const deleteMutation = useDeleteMatch()
  const unwindAll = useUnwindAll()
  const createManual = useCreateManualMatch()

  const [helpOpen, setHelpOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [unwindOpen, setUnwindOpen] = useState(false)
  const [manualForm, setManualForm] = useState<MatchCreate>({
    buy_contract_id: 0, sell_contract_id: 0, matched_quantity: 0,
    match_date: new Date().toISOString().slice(0, 10),
  })
  const [deleteTarget, setDeleteTarget] = useState<MatchOut | null>(null)

  const buyContracts = contracts.filter((c) => c.direction === 'BUY')
  const sellContracts = contracts.filter((c) => c.direction === 'SELL')

  const contractRef = (id: number) => contracts.find((c) => c.id === id)?.reference ?? String(id)

  function openManual() {
    setManualForm({
      buy_contract_id: buyContracts[0]?.id ?? 0,
      sell_contract_id: sellContracts[0]?.id ?? 0,
      matched_quantity: 0,
      match_date: new Date().toISOString().slice(0, 10),
    })
    setManualOpen(true)
  }

  function handleManualSubmit() {
    createManual.mutate(manualForm, { onSuccess: () => setManualOpen(false) })
  }

  const columns: Column<MatchOut>[] = [
    { key: 'id', header: 'ID', render: (r) => r.id },
    { key: 'buy', header: 'Buy Contract', render: (r) => contractRef(r.buy_contract_id) },
    { key: 'sell', header: 'Sell Contract', render: (r) => contractRef(r.sell_contract_id) },
    { key: 'qty', header: 'Matched Qty', render: (r) => formatQuantity(r.matched_quantity), sortable: true, sortValue: (r) => r.matched_quantity },
    { key: 'buy_px', header: 'Buy Price', render: (r) => formatPrice(r.buy_price) },
    { key: 'sell_px', header: 'Sell Price', render: (r) => formatPrice(r.sell_price) },
    { key: 'pnl', header: 'Realized P&L', render: (r) => r.realized_pnl != null ? formatUSD(r.realized_pnl) : '-', sortable: true, sortValue: (r) => r.realized_pnl ?? 0 },
    { key: 'date', header: 'Match Date', render: (r) => formatDate(r.match_date) },
    {
      key: 'actions', header: '', render: (r) => (
        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Matching">
        <Button variant="outline" onClick={() => setHelpOpen(true)}>
          <HelpCircle className="mr-2 h-4 w-4" />
          How Matching Works
        </Button>
        <Button variant="outline" onClick={() => runFifo.mutate()} disabled={runFifo.isPending}>
          <GitMerge className="mr-2 h-4 w-4" />{runFifo.isPending ? 'Running...' : 'Run FIFO'}
        </Button>
        <Button variant="outline" onClick={openManual}>
          <Plus className="mr-2 h-4 w-4" />Manual Match
        </Button>
        <Button variant="outline" onClick={() => setUnwindOpen(true)} disabled={matches.length === 0}>
          <RotateCcw className="mr-2 h-4 w-4" />Unwind All
        </Button>
      </PageHeader>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <Card>
          <CardHeader><CardTitle>Matches ({matches.length})</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={columns} data={matches} emptyMessage="No matches. Run FIFO or create a manual match." />
          </CardContent>
        </Card>
      )}

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Manual Match</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Buy Contract</Label>
              <Select value={String(manualForm.buy_contract_id)} onValueChange={(v) => setManualForm({ ...manualForm, buy_contract_id: +v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{buyContracts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.reference}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sell Contract</Label>
              <Select value={String(manualForm.sell_contract_id)} onValueChange={(v) => setManualForm({ ...manualForm, sell_contract_id: +v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{sellContracts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.reference}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Matched Quantity</Label><Input type="number" value={manualForm.matched_quantity} onChange={(e) => setManualForm({ ...manualForm, matched_quantity: +e.target.value })} /></div>
            <div><Label>Match Date</Label><Input type="date" value={manualForm.match_date} onChange={(e) => setManualForm({ ...manualForm, match_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button onClick={handleManualSubmit} disabled={createManual.isPending}>{createManual.isPending ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Match"
        description={`Delete match #${deleteTarget?.id}?`}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        loading={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={unwindOpen}
        onOpenChange={setUnwindOpen}
        title="Unwind All Matches"
        description={`Delete all ${matches.length} matches? This will reset all matching data.`}
        onConfirm={() => unwindAll.mutate(undefined, { onSuccess: () => setUnwindOpen(false) })}
        loading={unwindAll.isPending}
      />

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How Matching Works</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm leading-relaxed">

            <section>
              <h3 className="font-semibold text-base">What is Matching?</h3>
              <p className="mt-1 text-muted-foreground">
                Matching pairs BUY contracts with SELL contracts to realize profit or loss.
                When a buy and a sell are matched, the system computes the realized P&L based on
                the difference between the weighted average prices of each side. Kargo supports
                two matching modes: <strong>FIFO (automatic)</strong> and <strong>Manual</strong>.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">FIFO Matching (Automatic)</h3>
              <p className="mt-1 text-muted-foreground">
                FIFO (First In, First Out) matches contracts in chronological order of their
                delivery start date. It is a full re-run: all existing matches are cleared and
                rebuilt from scratch.
              </p>
              <ol className="mt-3 list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Collect all BUY contracts with status OPEN or EXECUTED, sorted by <strong>delivery_start ASC</strong></li>
                <li>Collect all SELL contracts with status OPEN or EXECUTED, sorted by <strong>delivery_start ASC</strong></li>
                <li>Walk through BUYs in order; for each BUY, consume SELLs from earliest to latest</li>
                <li>The matched quantity is the <strong>minimum</strong> of the remaining quantity on each side</li>
                <li>Partial matches are allowed &mdash; a contract can be split across multiple matches</li>
                <li>Continue until either all BUY or all SELL quantity is exhausted</li>
              </ol>
              <div className="mt-3 rounded-md bg-muted p-3 font-mono text-xs">
                match_qty = min(buy_remaining, sell_remaining)
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Manual Matching</h3>
              <p className="mt-1 text-muted-foreground">
                Manual matching lets you explicitly pair a specific BUY contract with a specific
                SELL contract for a given quantity and date. This is useful when:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li>You need to override the FIFO order for a specific trade</li>
                <li>A back-to-back deal should be matched to a particular counterparty</li>
                <li>You want to partially match a contract while keeping the rest unmatched</li>
              </ul>
              <p className="mt-2 text-muted-foreground">
                Manual matches are <strong>additive</strong> &mdash; they do not clear existing
                matches. To start fresh, use <strong>Unwind All</strong> first.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Pricing &amp; Realized P&L</h3>
              <p className="mt-1 text-muted-foreground">
                For each match, the system calculates a realized P&L using the weighted average
                shipment prices on each contract:
              </p>
              <div className="mt-3 rounded-md bg-muted p-3 font-mono text-xs">
                Realized P&L = (Sell Price - Buy Price) x Matched Quantity
              </div>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Buy Price</strong> &mdash; Weighted average of shipment prices on the buy contract (final price preferred over provisional)</li>
                <li><strong>Sell Price</strong> &mdash; Weighted average of shipment prices on the sell contract</li>
                <li>If either side has no priced shipments, Realized P&L shows as "-" (not yet calculable)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Example</h3>
              <div className="mt-2 rounded-md border p-3 text-muted-foreground space-y-1">
                <p>BUY contract: <strong>50,000 DMT</strong>, weighted avg price <strong>$108.00/DMT</strong></p>
                <p>SELL contract: <strong>30,000 DMT</strong>, weighted avg price <strong>$115.00/DMT</strong></p>
                <p>FIFO matched quantity: <strong>30,000 DMT</strong> (limited by the smaller side)</p>
                <div className="mt-2 rounded-md bg-muted p-2 font-mono text-xs">
                  Realized P&L = ($115.00 - $108.00) x 30,000 = <strong>+$210,000</strong>
                </div>
                <p className="mt-1 text-xs">The BUY contract has 20,000 DMT remaining to match against future SELLs.</p>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Unwind All</h3>
              <p className="mt-1 text-muted-foreground">
                Deletes every match in the system, resetting all matching data. Use this to start
                fresh before re-running FIFO or building manual matches from scratch. This action
                is irreversible.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Results Table Columns</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Buy Contract</strong> &mdash; The BUY side contract reference</li>
                <li><strong>Sell Contract</strong> &mdash; The SELL side contract reference</li>
                <li><strong>Matched Qty</strong> &mdash; Quantity matched between the two contracts (DMT)</li>
                <li><strong>Buy Price</strong> &mdash; Weighted avg price on the buy contract</li>
                <li><strong>Sell Price</strong> &mdash; Weighted avg price on the sell contract</li>
                <li><strong>Realized P&L</strong> &mdash; (Sell Price - Buy Price) x Matched Qty</li>
                <li><strong>Match Date</strong> &mdash; Date the match was created</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Prerequisites</h3>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>At least one BUY and one SELL contract in OPEN or EXECUTED status</li>
                <li>Run <strong>Value Positions</strong> (pricing) first so shipments have computed prices</li>
                <li>Contracts need shipments with prices for Realized P&L to be calculated</li>
              </ol>
            </section>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
