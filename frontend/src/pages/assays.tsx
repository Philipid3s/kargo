import { useState } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { useAssays, useCreateAssay, useUpdateAssay, useDeleteAssay } from '@/hooks/use-assays'
import { useShipments } from '@/hooks/use-shipments'
import type { AssayOut, AssayCreate, AssayType } from '@/types'

const emptyForm: AssayCreate = { shipment_id: 0, assay_type: 'PROVISIONAL' }

export default function AssaysPage() {
  const { data: assays = [], isLoading } = useAssays()
  const { data: shipments = [] } = useShipments()
  const createMutation = useCreateAssay()
  const deleteMutation = useDeleteAssay()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<AssayCreate>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<AssayOut | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, shipment_id: shipments[0]?.id ?? 0 })
    setDialogOpen(true)
  }

  function openEdit(a: AssayOut) {
    setEditingId(a.id)
    setForm({
      shipment_id: a.shipment_id, assay_type: a.assay_type,
      fe: a.fe ?? undefined, moisture: a.moisture ?? undefined,
      sio2: a.sio2 ?? undefined, al2o3: a.al2o3 ?? undefined,
      p: a.p ?? undefined, s: a.s ?? undefined,
    })
    setDialogOpen(true)
  }

  const updateMutation = useUpdateAssay(editingId ?? 0)

  function handleSubmit() {
    if (editingId) {
      const { shipment_id: _s, assay_type: _a, ...rest } = form
      updateMutation.mutate(rest, { onSuccess: () => setDialogOpen(false) })
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  const fmtVal = (v: number | null) => v != null ? v.toFixed(2) : '-'
  const shipRef = (id: number) => shipments.find((s) => s.id === id)?.reference ?? String(id)

  const columns: Column<AssayOut>[] = [
    { key: 'shipment', header: 'Shipment', render: (r) => shipRef(r.shipment_id) },
    { key: 'type', header: 'Type', render: (r) => <StatusBadge value={r.assay_type} /> },
    { key: 'fe', header: 'Fe%', render: (r) => fmtVal(r.fe), sortable: true, sortValue: (r) => r.fe ?? 0 },
    { key: 'moisture', header: 'Moisture%', render: (r) => fmtVal(r.moisture) },
    { key: 'sio2', header: 'SiO2%', render: (r) => fmtVal(r.sio2) },
    { key: 'al2o3', header: 'Al2O3%', render: (r) => fmtVal(r.al2o3) },
    { key: 'p', header: 'P%', render: (r) => fmtVal(r.p) },
    { key: 's', header: 'S%', render: (r) => fmtVal(r.s) },
    {
      key: 'actions', header: '', render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Assays">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Assay</Button>
      </PageHeader>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTable columns={columns} data={assays} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Assay' : 'New Assay'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingId && (
              <>
                <div>
                  <Label>Shipment</Label>
                  <Select value={String(form.shipment_id)} onValueChange={(v) => setForm({ ...form, shipment_id: +v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{shipments.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.reference}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assay Type</Label>
                  <Select value={form.assay_type} onValueChange={(v) => setForm({ ...form, assay_type: v as AssayType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROVISIONAL">PROVISIONAL</SelectItem>
                      <SelectItem value="FINAL">FINAL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Fe%</Label><Input type="number" step="0.01" value={form.fe ?? ''} onChange={(e) => setForm({ ...form, fe: e.target.value ? +e.target.value : undefined })} /></div>
              <div><Label>Moisture%</Label><Input type="number" step="0.01" value={form.moisture ?? ''} onChange={(e) => setForm({ ...form, moisture: e.target.value ? +e.target.value : undefined })} /></div>
              <div><Label>SiO2%</Label><Input type="number" step="0.01" value={form.sio2 ?? ''} onChange={(e) => setForm({ ...form, sio2: e.target.value ? +e.target.value : undefined })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Al2O3%</Label><Input type="number" step="0.01" value={form.al2o3 ?? ''} onChange={(e) => setForm({ ...form, al2o3: e.target.value ? +e.target.value : undefined })} /></div>
              <div><Label>P%</Label><Input type="number" step="0.001" value={form.p ?? ''} onChange={(e) => setForm({ ...form, p: e.target.value ? +e.target.value : undefined })} /></div>
              <div><Label>S%</Label><Input type="number" step="0.001" value={form.s ?? ''} onChange={(e) => setForm({ ...form, s: e.target.value ? +e.target.value : undefined })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Assay"
        description="Delete this assay? This cannot be undone."
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
