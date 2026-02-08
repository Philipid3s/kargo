import { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KpiCard } from '@/components/shared/kpi-card'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { PageHeader } from '@/components/layout/page-header'
import { usePnlSummary, useRealizedPnl, useUnrealizedPnl } from '@/hooks/use-pnl'
import { useContracts } from '@/hooks/use-contracts'
import { formatQuantity, formatPrice, formatUSD } from '@/lib/formatters'
import type { PnlByContract, RealizedPnlItem, UnrealizedPnlItem } from '@/types'

export default function PnlPage() {
  const { data: summary, isLoading: loadingSummary } = usePnlSummary()
  const { data: realized = [] } = useRealizedPnl()
  const { data: unrealized = [] } = useUnrealizedPnl()
  const { data: contracts = [] } = useContracts()
  const [helpOpen, setHelpOpen] = useState(false)

  const contractRef = (id: number) => contracts.find((c) => c.id === id)?.reference ?? String(id)

  const byContractCols: Column<PnlByContract>[] = [
    { key: 'ref', header: 'Contract', render: (r) => r.reference, sortable: true, sortValue: (r) => r.reference },
    { key: 'dir', header: 'Direction', render: (r) => <StatusBadge value={r.direction} /> },
    { key: 'realized', header: 'Realized', render: (r) => formatUSD(r.realized_pnl), sortable: true, sortValue: (r) => r.realized_pnl },
    { key: 'unrealized', header: 'Unrealized', render: (r) => formatUSD(r.unrealized_pnl), sortable: true, sortValue: (r) => r.unrealized_pnl },
    { key: 'total', header: 'Total P&L', render: (r) => formatUSD(r.total_pnl), sortable: true, sortValue: (r) => r.total_pnl },
  ]

  const realizedCols: Column<RealizedPnlItem>[] = [
    { key: 'match', header: 'Match ID', render: (r) => r.match_id },
    { key: 'buy', header: 'Buy Contract', render: (r) => contractRef(r.buy_contract_id) },
    { key: 'sell', header: 'Sell Contract', render: (r) => contractRef(r.sell_contract_id) },
    { key: 'qty', header: 'Quantity', render: (r) => formatQuantity(r.matched_quantity), sortable: true, sortValue: (r) => r.matched_quantity },
    { key: 'buy_px', header: 'Buy Price', render: (r) => formatPrice(r.buy_price) },
    { key: 'sell_px', header: 'Sell Price', render: (r) => formatPrice(r.sell_price) },
    { key: 'pnl', header: 'Realized P&L', render: (r) => r.realized_pnl != null ? formatUSD(r.realized_pnl) : '-', sortable: true, sortValue: (r) => r.realized_pnl ?? 0 },
  ]

  const unrealizedCols: Column<UnrealizedPnlItem>[] = [
    { key: 'contract', header: 'Contract', render: (r) => contractRef(r.contract_id) },
    { key: 'dir', header: 'Direction', render: (r) => <StatusBadge value={r.direction} /> },
    { key: 'qty', header: 'Open Qty', render: (r) => formatQuantity(r.open_quantity), sortable: true, sortValue: (r) => r.open_quantity },
    { key: 'cpx', header: 'Contract Price', render: (r) => formatPrice(r.contract_price) },
    { key: 'mpx', header: 'Market Price', render: (r) => formatPrice(r.market_price) },
    { key: 'pnl', header: 'Unrealized P&L', render: (r) => r.unrealized_pnl != null ? formatUSD(r.unrealized_pnl) : '-', sortable: true, sortValue: (r) => r.unrealized_pnl ?? 0 },
  ]

  if (loadingSummary) return <div className="p-8 text-muted-foreground">Loading P&L...</div>

  return (
    <div>
      <PageHeader title="Profit & Loss">
        <Button variant="outline" onClick={() => setHelpOpen(true)}>
          <HelpCircle className="mr-2 h-4 w-4" />
          How P&L Works
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <KpiCard title="Total P&L" value={formatUSD(summary?.total_pnl ?? 0)} icon={DollarSign} />
        <KpiCard title="Realized P&L" value={formatUSD(summary?.total_realized ?? 0)} icon={TrendingUp} />
        <KpiCard title="Unrealized P&L" value={formatUSD(summary?.total_unrealized ?? 0)} icon={TrendingDown} />
      </div>

      <Tabs defaultValue="by-contract">
        <TabsList>
          <TabsTrigger value="by-contract">By Contract</TabsTrigger>
          <TabsTrigger value="realized">Realized</TabsTrigger>
          <TabsTrigger value="unrealized">Unrealized</TabsTrigger>
        </TabsList>

        <TabsContent value="by-contract">
          <Card>
            <CardHeader><CardTitle>P&L by Contract</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={byContractCols} data={summary?.by_contract ?? []} emptyMessage="No P&L data." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realized">
          <Card>
            <CardHeader><CardTitle>Realized P&L</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={realizedCols} data={realized} emptyMessage="No realized P&L. Run FIFO matching first." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unrealized">
          <Card>
            <CardHeader><CardTitle>Unrealized P&L</CardTitle></CardHeader>
            <CardContent>
              <DataTable columns={unrealizedCols} data={unrealized} emptyMessage="No unrealized P&L. Run MTM first." />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>P&L Calculation Logic</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm leading-relaxed">

            <section>
              <h3 className="font-semibold text-base">Overview</h3>
              <p className="mt-1 text-muted-foreground">
                Total P&L = Realized P&L + Unrealized P&L. Realized P&L comes from matched
                (closed) positions. Unrealized P&L comes from open positions marked to market.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Realized P&L</h3>
              <p className="mt-1 text-muted-foreground">
                Generated when a BUY contract is matched against a SELL contract via FIFO
                matching or manual matching.
              </p>
              <div className="mt-3 rounded-md bg-muted p-3 font-mono text-xs">
                Realized P&L = (Sell Price - Buy Price) x Matched Quantity
              </div>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Buy Price</strong> &mdash; Weighted average of shipment prices (final if available, otherwise provisional) on the buy contract</li>
                <li><strong>Sell Price</strong> &mdash; Same weighted average on the sell contract</li>
                <li><strong>Matched Quantity</strong> &mdash; The tonnage matched between the two contracts</li>
                <li>Realized P&L is attributed to the BUY side to avoid double-counting</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Unrealized P&L (Mark-to-Market)</h3>
              <p className="mt-1 text-muted-foreground">
                Calculated for each contract that still has open (unshipped) quantity, using the
                latest MTM valuation run.
              </p>
              <div className="mt-3 rounded-md bg-muted p-3 font-mono text-xs">
                Unrealized P&L = (Curve Price - Contract Price) x Open Qty x Direction Factor
              </div>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Curve Price</strong> &mdash; The market price from the price curve on the valuation date</li>
                <li><strong>Contract Price</strong> &mdash; Weighted average price of the contract's priced shipments</li>
                <li><strong>Open Qty</strong> &mdash; Contract quantity minus total shipped quantity</li>
                <li><strong>Direction Factor</strong> &mdash; +1 for BUY (long), -1 for SELL (short)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Shipment Pricing</h3>
              <p className="mt-1 text-muted-foreground">
                Each shipment price is derived from a pricing formula applied to assay results:
              </p>
              <div className="mt-3 rounded-md bg-muted p-3 font-mono text-xs leading-relaxed">
                Shipment Price = QP Average<br />
                &nbsp;&nbsp;+ Fe Adjustment: (Actual Fe% - Basis Fe%) x Fe Rate<br />
                &nbsp;&nbsp;- Moisture Penalty: max(0, Moisture% - Threshold) x Penalty Rate<br />
                &nbsp;&nbsp;- Impurity Penalties: max(0, Element% - Threshold) x Penalty Rate<br />
                &nbsp;&nbsp;+ Fixed Premium
              </div>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>QP Average</strong> &mdash; Average of the price curve over the Quotational Period (determined by the QP convention and BL date)</li>
                <li><strong>Provisional Price</strong> &mdash; Uses the provisional assay</li>
                <li><strong>Final Price</strong> &mdash; Uses the final assay</li>
                <li><strong>P&F Settlement</strong> &mdash; (Final Price - Provisional Price) x BL Quantity</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="font-semibold text-base">Recommended Workflow</h3>
              <ol className="mt-2 list-decimal pl-5 space-y-1 text-muted-foreground">
                <li>Create contracts (BUY and SELL) with a pricing formula</li>
                <li>Create shipments against contracts, add assays</li>
                <li><strong>Value Positions</strong> &mdash; computes provisional/final prices on all shipments</li>
                <li><strong>Run MTM</strong> &mdash; marks open positions to the current curve price</li>
                <li><strong>Run FIFO</strong> &mdash; matches BUY and SELL contracts, calculates realized P&L</li>
                <li>Review P&L here: realized from matches, unrealized from MTM</li>
              </ol>
            </section>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
