import { useState } from 'react'
import { Play, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { useRunMtm, useMtmHistory } from '@/hooks/use-mtm'
import { useContracts } from '@/hooks/use-contracts'
import { formatPrice, formatQuantity, formatUSD, formatDate } from '@/lib/formatters'
import type { MtmRecordOut, MtmPortfolioOut } from '@/types'

export default function MtmPage() {
  const [valuationDate, setValuationDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [result, setResult] = useState<MtmPortfolioOut | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const { data: history = [] } = useMtmHistory()
  const { data: contracts = [] } = useContracts()
  const runMtm = useRunMtm()

  const contractRef = (id: number) => contracts.find((c) => c.id === id)?.reference ?? String(id)

  function handleRun() {
    runMtm.mutate({ valuation_date: valuationDate }, { onSuccess: (data) => setResult(data) })
  }

  const resultCols: Column<MtmRecordOut>[] = [
    { key: 'contract', header: 'Contract', render: (r) => contractRef(r.contract_id) },
    { key: 'dir', header: 'Direction', render: (r) => <StatusBadge value={r.direction} /> },
    { key: 'curve', header: 'Curve Price', render: (r) => formatPrice(r.curve_price), sortable: true, sortValue: (r) => r.curve_price },
    { key: 'contract_px', header: 'Contract Price', render: (r) => formatPrice(r.contract_price) },
    { key: 'open_qty', header: 'Open Qty', render: (r) => formatQuantity(r.open_quantity) },
    { key: 'mtm', header: 'MTM Value', render: (r) => formatUSD(r.mtm_value), sortable: true, sortValue: (r) => r.mtm_value },
  ]

  const historyCols: Column<MtmRecordOut>[] = [
    { key: 'date', header: 'Valuation Date', render: (r) => formatDate(r.valuation_date), sortable: true, sortValue: (r) => r.valuation_date },
    { key: 'contract', header: 'Contract', render: (r) => contractRef(r.contract_id) },
    { key: 'dir', header: 'Direction', render: (r) => <StatusBadge value={r.direction} /> },
    { key: 'curve', header: 'Curve Price', render: (r) => formatPrice(r.curve_price) },
    { key: 'mtm', header: 'MTM Value', render: (r) => formatUSD(r.mtm_value), sortable: true, sortValue: (r) => r.mtm_value },
  ]

  return (
    <div>
      <PageHeader title="Mark-to-Market">
        <Button variant="outline" onClick={() => setHelpOpen(true)}>
          <HelpCircle className="mr-2 h-4 w-4" />
          How MTM Works
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">Run MTM Valuation</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div>
              <Label>Valuation Date</Label>
              <Input type="date" value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} className="w-[200px]" />
            </div>
            <Button onClick={handleRun} disabled={runMtm.isPending}>
              <Play className="mr-2 h-4 w-4" />{runMtm.isPending ? 'Running...' : 'Run MTM'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Results - {formatDate(result.valuation_date)}</span>
              <span className="text-lg">Total MTM: {formatUSD(result.total_mtm)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={resultCols} data={result.records} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>MTM History</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={historyCols} data={history} emptyMessage="No MTM history. Run an MTM valuation first." />
        </CardContent>
      </Card>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mark-to-Market Calculation Logic</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm leading-relaxed">

            <section>
              <h3 className="font-semibold text-base">What is Mark-to-Market?</h3>
              <p className="mt-1 text-muted-foreground">
                Mark-to-Market (MTM) measures the unrealized profit or loss on open contract
                positions by comparing the current market price to the contract's weighted
                average price. It answers: "If I closed all positions today, what would the gain or loss be?"
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Core Formula</h3>
              <div className="mt-3 rounded-md bg-muted p-3 font-mono text-xs">
                MTM Value = (Curve Price - Contract Price) x Open Quantity x Direction Factor
              </div>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Curve Price</strong> &mdash; The current market price from the reference price curve (e.g. TSI 62% Fe) on the valuation date</li>
                <li><strong>Contract Price</strong> &mdash; Weighted average of priced shipments on the contract (final price if available, otherwise provisional)</li>
                <li><strong>Open Quantity</strong> &mdash; Contract quantity minus total shipped BL quantity</li>
                <li><strong>Direction Factor</strong> &mdash; +1 for BUY (long position), -1 for SELL (short position)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Direction Factor Explained</h3>
              <p className="mt-1 text-muted-foreground">
                The direction factor ensures the P&L sign is correct for each side of the trade:
              </p>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>BUY (+1)</strong> &mdash; You profit when the market rises above your purchase price. If Curve Price &gt; Contract Price, MTM is positive (gain)</li>
                <li><strong>SELL (-1)</strong> &mdash; You profit when the market falls below your selling price. If Curve Price &lt; Contract Price, MTM is positive (gain)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Curve Price Lookup</h3>
              <p className="mt-1 text-muted-foreground">
                The system looks up the curve price using the following fallback chain:
              </p>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Exact match for the valuation date with the given snapshot</li>
                <li>Exact match for the valuation date (any snapshot)</li>
                <li>Latest available price at or before the valuation date</li>
                <li>Most recent price in the entire curve</li>
              </ol>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Example</h3>
              <div className="mt-2 rounded-md border p-3 text-muted-foreground space-y-1">
                <p>Contract: <strong>BUY 120,000 DMT</strong>, shipped 75,000 DMT</p>
                <p>Open Quantity: <strong>45,000 DMT</strong></p>
                <p>Contract Price (weighted avg): <strong>$110.50/DMT</strong></p>
                <p>Curve Price (valuation date): <strong>$112.50/DMT</strong></p>
                <div className="mt-2 rounded-md bg-muted p-2 font-mono text-xs">
                  MTM = ($112.50 - $110.50) x 45,000 x (+1) = <strong>+$90,000</strong>
                </div>
                <p className="mt-1 text-xs">The market moved in your favor: you bought at $110.50, it's now worth $112.50.</p>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Results Table Columns</h3>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Contract</strong> &mdash; The contract reference</li>
                <li><strong>Direction</strong> &mdash; BUY or SELL</li>
                <li><strong>Curve Price</strong> &mdash; Market price used for valuation</li>
                <li><strong>Contract Price</strong> &mdash; Weighted avg shipment price (shown as "-" if no shipments are priced yet)</li>
                <li><strong>Open Qty</strong> &mdash; Remaining unshipped quantity (0 if fully shipped)</li>
                <li><strong>MTM Value</strong> &mdash; The unrealized gain/loss for this contract</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Prerequisites</h3>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Price curve data must exist (seed or upload manually)</li>
                <li>Contracts must be in OPEN or EXECUTED status</li>
                <li>Run <strong>Value Positions</strong> first so shipments have computed prices</li>
                <li>Contracts need open quantity (contract qty &gt; shipped qty) for a non-zero MTM</li>
              </ol>
            </section>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
