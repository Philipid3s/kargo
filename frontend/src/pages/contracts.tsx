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
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract } from '@/hooks/use-contracts'
import { usePricingFormulas } from '@/hooks/use-pricing-formulas'
import { formatQuantity, formatDate } from '@/lib/formatters'
import type { ContractOut, ContractCreate, Direction, ContractStatus, QPConvention } from '@/types'

const emptyForm: ContractCreate = {
  reference: '', direction: 'BUY', counterparty: '', commodity: 'Iron Ore Fines',
  quantity: 0, uom: 'WMT', incoterm: 'CFR', delivery_start: '', delivery_end: '',
  status: 'OPEN', qp_convention: 'MONTH_OF_BL', pricing_formula_id: 0,
}

export default function ContractsPage() {
  const [dirFilter, setDirFilter] = useState<Direction | undefined>()
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>()
  const { data: contracts = [], isLoading } = useContracts(dirFilter, statusFilter)
  const { data: formulas = [] } = usePricingFormulas()
  const createMutation = useCreateContract()
  const deleteMutation = useDeleteContract()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ContractCreate>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<ContractOut | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, pricing_formula_id: formulas[0]?.id ?? 0 })
    setDialogOpen(true)
  }

  function openEdit(c: ContractOut) {
    setEditingId(c.id)
    setForm({
      reference: c.reference, direction: c.direction, counterparty: c.counterparty,
      commodity: c.commodity, quantity: c.quantity, uom: c.uom, incoterm: c.incoterm,
      delivery_start: c.delivery_start, delivery_end: c.delivery_end, status: c.status,
      qp_convention: c.qp_convention, pricing_formula_id: c.pricing_formula_id,
    })
    setDialogOpen(true)
  }

  const updateMutation = useUpdateContract(editingId ?? 0)

  function handleSubmit() {
    if (editingId) {
      updateMutation.mutate(form, { onSuccess: () => setDialogOpen(false) })
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function set<K extends keyof ContractCreate>(key: K, value: ContractCreate[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const columns: Column<ContractOut>[] = [
    { key: 'ref', header: 'Reference', render: (r) => r.reference, sortable: true, sortValue: (r) => r.reference },
    { key: 'dir', header: 'Direction', render: (r) => <StatusBadge value={r.direction} /> },
    { key: 'cpty', header: 'Counterparty', render: (r) => r.counterparty, sortable: true, sortValue: (r) => r.counterparty },
    { key: 'qty', header: 'Quantity', render: (r) => formatQuantity(r.quantity), sortable: true, sortValue: (r) => r.quantity },
    { key: 'del', header: 'Delivery', render: (r) => `${formatDate(r.delivery_start)} - ${formatDate(r.delivery_end)}` },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
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
      <PageHeader title="Contracts">
        <Select value={dirFilter ?? 'ALL'} onValueChange={(v) => setDirFilter(v === 'ALL' ? undefined : v as Direction)}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Dirs</SelectItem>
            <SelectItem value="BUY">BUY</SelectItem>
            <SelectItem value="SELL">SELL</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter ?? 'ALL'} onValueChange={(v) => setStatusFilter(v === 'ALL' ? undefined : v as ContractStatus)}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">OPEN</SelectItem>
            <SelectItem value="EXECUTED">EXECUTED</SelectItem>
            <SelectItem value="CLOSED">CLOSED</SelectItem>
            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Contract</Button>
      </PageHeader>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : (
        <DataTable columns={columns} data={contracts} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Contract' : 'New Contract'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Reference <span className="text-destructive">*</span></Label><Input value={form.reference} onChange={(e) => set('reference', e.target.value)} required /></div>
              <div>
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => set('direction', v as Direction)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="BUY">BUY</SelectItem><SelectItem value="SELL">SELL</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Counterparty</Label><Input value={form.counterparty} onChange={(e) => set('counterparty', e.target.value)} /></div>
              <div><Label>Commodity</Label><Input value={form.commodity} onChange={(e) => set('commodity', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(e) => set('quantity', +e.target.value)} /></div>
              <div><Label>UOM</Label><Input value={form.uom} onChange={(e) => set('uom', e.target.value)} /></div>
              <div><Label>Incoterm</Label><Input value={form.incoterm} onChange={(e) => set('incoterm', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Delivery Start</Label><Input type="date" value={form.delivery_start} onChange={(e) => set('delivery_start', e.target.value)} /></div>
              <div><Label>Delivery End</Label><Input type="date" value={form.delivery_end} onChange={(e) => set('delivery_end', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>QP Convention</Label>
                <Select value={form.qp_convention} onValueChange={(v) => set('qp_convention', v as QPConvention)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTH_OF_BL">Month of BL</SelectItem>
                    <SelectItem value="MONTH_PRIOR_BL">Month Prior BL</SelectItem>
                    <SelectItem value="MONTH_AFTER_BL">Month After BL</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Pricing Formula</Label>
                <Select value={String(form.pricing_formula_id)} onValueChange={(v) => set('pricing_formula_id', +v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {formulas.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {!editingId && (
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v as ContractStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">OPEN</SelectItem>
                    <SelectItem value="EXECUTED">EXECUTED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.reference.trim() || createMutation.isPending || updateMutation.isPending}>
              {editingId ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Contract"
        description={`Delete contract ${deleteTarget?.reference}? This cannot be undone.`}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
