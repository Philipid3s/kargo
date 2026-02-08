import { useState } from 'react'
import { Plus, MoreHorizontal, ChevronDown, ChevronRight, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { usePriceCurves, useCreatePriceCurve, useUpdatePriceCurve, useDeletePriceCurve, useCurveData, useUploadCurveData } from '@/hooks/use-price-curves'
import { formatPrice, formatDate } from '@/lib/formatters'
import type { PriceCurveOut, PriceCurveCreate, CurveDataOut, CurveDataCreate } from '@/types'

export default function PriceCurvesPage() {
  const { data: curves = [], isLoading } = usePriceCurves()
  const createMutation = useCreatePriceCurve()
  const deleteMutation = useDeletePriceCurve()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<PriceCurveCreate>({ code: '', name: '', currency: 'USD', uom: 'DMT' })
  const [deleteTarget, setDeleteTarget] = useState<PriceCurveOut | null>(null)
  const [expandedCurve, setExpandedCurve] = useState<number | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploadCurveId, setUploadCurveId] = useState<number>(0)
  const [uploadText, setUploadText] = useState('')

  function openCreate() {
    setEditingId(null)
    setForm({ code: '', name: '', currency: 'USD', uom: 'DMT' })
    setDialogOpen(true)
  }

  function openEdit(c: PriceCurveOut) {
    setEditingId(c.id)
    setForm({ code: c.code, name: c.name, currency: c.currency, uom: c.uom })
    setDialogOpen(true)
  }

  const updateMutation = useUpdatePriceCurve(editingId ?? 0)

  function handleSubmit() {
    if (editingId) {
      updateMutation.mutate({ name: form.name, currency: form.currency, uom: form.uom }, { onSuccess: () => setDialogOpen(false) })
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function openUpload(curveId: number) {
    setUploadCurveId(curveId)
    setUploadText('')
    setUploadDialogOpen(true)
  }

  const uploadMutation = useUploadCurveData(uploadCurveId)

  function handleUpload() {
    const lines = uploadText.trim().split('\n').filter(Boolean)
    const dataPoints: CurveDataCreate[] = lines.map((line) => {
      const [price_date, price, snapshot_date] = line.split(',').map((s) => s.trim())
      return { price_date, price: +price, snapshot_date: snapshot_date || price_date }
    })
    uploadMutation.mutate(dataPoints, { onSuccess: () => setUploadDialogOpen(false) })
  }

  const columns: Column<PriceCurveOut>[] = [
    {
      key: 'expand', header: '', render: (r) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setExpandedCurve(expandedCurve === r.id ? null : r.id) }}>
          {expandedCurve === r.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      ),
    },
    { key: 'code', header: 'Code', render: (r) => r.code, sortable: true, sortValue: (r) => r.code },
    { key: 'name', header: 'Name', render: (r) => r.name, sortable: true, sortValue: (r) => r.name },
    { key: 'currency', header: 'Currency', render: (r) => r.currency },
    { key: 'uom', header: 'UOM', render: (r) => r.uom },
    {
      key: 'actions', header: '', render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openUpload(r.id)}><Upload className="mr-2 h-4 w-4" />Upload Data</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Price Curves">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Curve</Button>
      </PageHeader>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <>
          <DataTable columns={columns} data={curves} />
          {expandedCurve && <CurveDataPanel curveId={expandedCurve} />}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Price Curve' : 'New Price Curve'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingId && <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>}
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
              <div><Label>UOM</Label><Input value={form.uom} onChange={(e) => setForm({ ...form, uom: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Curve Data</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Enter CSV lines: price_date, price, snapshot_date</p>
            <textarea
              className="min-h-[200px] w-full rounded-md border bg-background p-3 text-sm"
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              placeholder="2025-01-02,108.50,2025-01-02&#10;2025-01-03,109.00,2025-01-03"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploadMutation.isPending}>{uploadMutation.isPending ? 'Uploading...' : 'Upload'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Price Curve"
        description={`Delete curve ${deleteTarget?.code}? This cannot be undone.`}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function CurveDataPanel({ curveId }: { curveId: number }) {
  const { data = [], isLoading } = useCurveData(curveId)

  const columns: Column<CurveDataOut>[] = [
    { key: 'date', header: 'Price Date', render: (r) => formatDate(r.price_date), sortable: true, sortValue: (r) => r.price_date },
    { key: 'price', header: 'Price', render: (r) => formatPrice(r.price), sortable: true, sortValue: (r) => r.price },
    { key: 'snap', header: 'Snapshot Date', render: (r) => formatDate(r.snapshot_date) },
  ]

  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Loading curve data...</p>

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium">Curve Data Points ({data.length})</h3>
      <DataTable columns={columns} data={data} emptyMessage="No data points." />
    </div>
  )
}
