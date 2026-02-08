import { useState } from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
      <PageHeader title="Mark-to-Market" />

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
    </div>
  )
}
