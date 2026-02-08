import { useState } from 'react'
import { FileText, Ship, TrendingUp, Database, BarChart3, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KpiCard } from '@/components/shared/kpi-card'
import { DataTable, type Column } from '@/components/shared/data-table'
import { PageHeader } from '@/components/layout/page-header'
import { useDashboard, useSeedDatabase } from '@/hooks/use-dashboard'
import { useRunMtm } from '@/hooks/use-mtm'
import { useRunFifo } from '@/hooks/use-matching'
import { formatUSD, formatQuantity } from '@/lib/formatters'
import type { ExposureByMonth, PnlByContract } from '@/types'

const exposureCols: Column<ExposureByMonth>[] = [
  { key: 'month', header: 'Month', render: (r) => r.month, sortable: true, sortValue: (r) => r.month },
  { key: 'long', header: 'Long (MT)', render: (r) => formatQuantity(r.long_quantity), sortable: true, sortValue: (r) => r.long_quantity },
  { key: 'short', header: 'Short (MT)', render: (r) => formatQuantity(r.short_quantity), sortable: true, sortValue: (r) => r.short_quantity },
  { key: 'net', header: 'Net (MT)', render: (r) => formatQuantity(r.net_quantity), sortable: true, sortValue: (r) => r.net_quantity },
  { key: 'exposure', header: 'Net Exposure', render: (r) => formatUSD(r.net_exposure_usd), sortable: true, sortValue: (r) => r.net_exposure_usd },
]

const pnlCols: Column<PnlByContract>[] = [
  { key: 'ref', header: 'Contract', render: (r) => r.reference, sortable: true, sortValue: (r) => r.reference },
  { key: 'dir', header: 'Direction', render: (r) => r.direction },
  { key: 'realized', header: 'Realized', render: (r) => formatUSD(r.realized_pnl), sortable: true, sortValue: (r) => r.realized_pnl },
  { key: 'unrealized', header: 'Unrealized', render: (r) => formatUSD(r.unrealized_pnl), sortable: true, sortValue: (r) => r.unrealized_pnl },
  { key: 'total', header: 'Total P&L', render: (r) => formatUSD(r.total_pnl), sortable: true, sortValue: (r) => r.total_pnl },
]

export default function DashboardPage() {
  const { data, isLoading } = useDashboard()
  const seedMutation = useSeedDatabase()
  const mtmMutation = useRunMtm()
  const fifoMutation = useRunFifo()
  const [mtmDialogOpen, setMtmDialogOpen] = useState(false)
  const [mtmDate, setMtmDate] = useState(() => new Date().toISOString().slice(0, 10))

  function handleRunMtm() {
    mtmMutation.mutate({ valuation_date: mtmDate })
    setMtmDialogOpen(false)
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading dashboard...</div>
  if (!data) return <div className="p-8 text-muted-foreground">No data. Seed the database to get started.</div>

  return (
    <div>
      <PageHeader title="Dashboard">
        <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
          <Database className="mr-2 h-4 w-4" />
          {seedMutation.isPending ? 'Seeding...' : 'Seed Database'}
        </Button>
        <Button variant="outline" onClick={() => setMtmDialogOpen(true)}>
          <BarChart3 className="mr-2 h-4 w-4" />
          Run MTM
        </Button>
        <Button variant="outline" onClick={() => fifoMutation.mutate()} disabled={fifoMutation.isPending}>
          <GitMerge className="mr-2 h-4 w-4" />
          {fifoMutation.isPending ? 'Running...' : 'Run FIFO'}
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Contracts" value={data.total_contracts} icon={FileText} />
        <KpiCard title="Open Contracts" value={data.open_contracts} icon={FileText} description="Currently active" />
        <KpiCard title="Total Shipments" value={data.total_shipments} icon={Ship} />
        <KpiCard title="Active Shipments" value={data.active_shipments} icon={Ship} description="In transit / planned" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total P&L</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(data.pnl.total_pnl)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Realized P&L</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(data.pnl.total_realized)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Net Exposure</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{formatUSD(data.exposure.total_net_exposure_usd)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Exposure by Month</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={exposureCols} data={data.exposure.by_month} emptyMessage="No exposure data." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>P&L by Contract</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={pnlCols} data={data.pnl.by_contract} emptyMessage="No P&L data." />
          </CardContent>
        </Card>
      </div>

      <Dialog open={mtmDialogOpen} onOpenChange={setMtmDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Run Mark-to-Market</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valuation Date</Label>
              <Input type="date" value={mtmDate} onChange={(e) => setMtmDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMtmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRunMtm} disabled={mtmMutation.isPending}>
              {mtmMutation.isPending ? 'Running...' : 'Run MTM'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
