import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <PageHeader title="Profit & Loss" />

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
    </div>
  )
}
