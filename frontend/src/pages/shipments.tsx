import { useState } from 'react'
import { Plus, MoreHorizontal, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { useShipments, useCreateShipment, useUpdateShipment, useDeleteShipment, useComputeProvisional, useComputeFinal } from '@/hooks/use-shipments'
import { useContracts } from '@/hooks/use-contracts'
import { formatQuantity, formatPrice, formatUSD, formatDate } from '@/lib/formatters'
import type { ShipmentOut, ShipmentCreate, ShipmentStatus } from '@/types'

const emptyForm: ShipmentCreate = {
  reference: '', contract_id: 0, vessel_name: '', bl_date: '', bl_quantity: 0, status: 'PLANNED',
}

export default function ShipmentsPage() {
  const { data: shipments = [], isLoading } = useShipments()
  const { data: contracts = [] } = useContracts()
  const createMutation = useCreateShipment()
  const deleteMutation = useDeleteShipment()
  const computeProvisional = useComputeProvisional()
  const computeFinal = useComputeFinal()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ShipmentCreate>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<ShipmentOut | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, contract_id: contracts[0]?.id ?? 0 })
    setDialogOpen(true)
  }

  function openEdit(s: ShipmentOut) {
    setEditingId(s.id)
    setForm({
      reference: s.reference, contract_id: s.contract_id, vessel_name: s.vessel_name,
      bl_date: s.bl_date, bl_quantity: s.bl_quantity, status: s.status,
    })
    setDialogOpen(true)
  }

  const updateMutation = useUpdateShipment(editingId ?? 0)

  function handleSubmit() {
    if (editingId) {
      updateMutation.mutate({ vessel_name: form.vessel_name, bl_date: form.bl_date, bl_quantity: form.bl_quantity }, { onSuccess: () => setDialogOpen(false) })
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function set<K extends keyof ShipmentCreate>(key: K, value: ShipmentCreate[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const contractRef = (id: number) => contracts.find((c) => c.id === id)?.reference ?? String(id)

  const columns: Column<ShipmentOut>[] = [
    { key: 'ref', header: 'Reference', render: (r) => r.reference, sortable: true, sortValue: (r) => r.reference },
    { key: 'contract', header: 'Contract', render: (r) => contractRef(r.contract_id) },
    { key: 'vessel', header: 'Vessel', render: (r) => r.vessel_name },
    { key: 'bl_date', header: 'BL Date', render: (r) => formatDate(r.bl_date), sortable: true, sortValue: (r) => r.bl_date },
    { key: 'qty', header: 'BL Qty', render: (r) => formatQuantity(r.bl_quantity), sortable: true, sortValue: (r) => r.bl_quantity },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    { key: 'prov', header: 'Prov Price', render: (r) => formatPrice(r.provisional_price) },
    { key: 'final', header: 'Final Price', render: (r) => formatPrice(r.final_price) },
    { key: 'pnf', header: 'P&F', render: (r) => r.pnf_amount != null ? formatUSD(r.pnf_amount) : '-' },
    {
      key: 'actions', header: '', render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => computeProvisional.mutate(r.id)}>
              <Calculator className="mr-2 h-4 w-4" />Compute Provisional
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => computeFinal.mutate(r.id)}>
              <Calculator className="mr-2 h-4 w-4" />Compute Final
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Shipments">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Shipment</Button>
      </PageHeader>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <DataTable columns={columns} data={shipments} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? 'Edit Shipment' : 'New Shipment'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingId && (
              <div><Label>Reference</Label><Input value={form.reference} onChange={(e) => set('reference', e.target.value)} /></div>
            )}
            {!editingId && (
              <div>
                <Label>Contract</Label>
                <Select value={String(form.contract_id)} onValueChange={(v) => set('contract_id', +v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contracts.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.reference}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Vessel Name</Label><Input value={form.vessel_name} onChange={(e) => set('vessel_name', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>BL Date</Label><Input type="date" value={form.bl_date} onChange={(e) => set('bl_date', e.target.value)} /></div>
              <div><Label>BL Quantity</Label><Input type="number" value={form.bl_quantity} onChange={(e) => set('bl_quantity', +e.target.value)} /></div>
            </div>
            {!editingId && (
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v as ShipmentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">PLANNED</SelectItem>
                    <SelectItem value="IN_TRANSIT">IN_TRANSIT</SelectItem>
                    <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                    <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Shipment"
        description={`Delete shipment ${deleteTarget?.reference}? This cannot be undone.`}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
