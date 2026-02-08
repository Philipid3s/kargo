import { useState } from 'react'
import { GitMerge, Trash2, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    </div>
  )
}
