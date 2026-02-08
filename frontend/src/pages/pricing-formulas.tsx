import { useState } from 'react'
import { Plus, MoreHorizontal, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DataTable, type Column } from '@/components/shared/data-table'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { PageHeader } from '@/components/layout/page-header'
import { usePricingFormulas, useCreatePricingFormula, useUpdatePricingFormula, useDeletePricingFormula, useEvaluateFormula } from '@/hooks/use-pricing-formulas'
import { usePriceCurves } from '@/hooks/use-price-curves'
import { formatPrice } from '@/lib/formatters'
import type { PricingFormulaOut, PricingFormulaCreate, FormulaAdjustmentCreate, FormulaEvaluateRequest, PriceBreakdown } from '@/types'

const emptyForm: PricingFormulaCreate = {
  name: '', curve_id: 0, basis_fe: 62, fe_rate_per_pct: 0, moisture_threshold: 8,
  moisture_penalty_per_pct: 0, fixed_premium: 0, adjustments: [],
}

const emptyEval: FormulaEvaluateRequest = { qp_average: 0, fe: 62, moisture: 8, sio2: 0, al2o3: 0, p: 0, s: 0 }

export default function PricingFormulasPage() {
  const { data: formulas = [], isLoading } = usePricingFormulas()
  const { data: curves = [] } = usePriceCurves()
  const createMutation = useCreatePricingFormula()
  const deleteMutation = useDeletePricingFormula()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<PricingFormulaCreate>(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState<PricingFormulaOut | null>(null)
  const [evalDialogOpen, setEvalDialogOpen] = useState(false)
  const [evalFormulaId, setEvalFormulaId] = useState(0)
  const [evalForm, setEvalForm] = useState<FormulaEvaluateRequest>(emptyEval)
  const [evalResult, setEvalResult] = useState<PriceBreakdown | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, curve_id: curves[0]?.id ?? 0 })
    setDialogOpen(true)
  }

  function openEdit(f: PricingFormulaOut) {
    setEditingId(f.id)
    setForm({
      name: f.name, curve_id: f.curve_id, basis_fe: f.basis_fe, fe_rate_per_pct: f.fe_rate_per_pct,
      moisture_threshold: f.moisture_threshold, moisture_penalty_per_pct: f.moisture_penalty_per_pct,
      fixed_premium: f.fixed_premium, adjustments: f.adjustments.map((a) => ({ element: a.element, threshold: a.threshold, penalty_per_pct: a.penalty_per_pct })),
    })
    setDialogOpen(true)
  }

  const updateMutation = useUpdatePricingFormula(editingId ?? 0)
  const evalMutation = useEvaluateFormula(evalFormulaId)

  function handleSubmit() {
    if (editingId) {
      const { adjustments: _a, ...rest } = form
      updateMutation.mutate(rest, { onSuccess: () => setDialogOpen(false) })
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) })
    }
  }

  function openEvaluate(f: PricingFormulaOut) {
    setEvalFormulaId(f.id)
    setEvalForm(emptyEval)
    setEvalResult(null)
    setEvalDialogOpen(true)
  }

  function handleEvaluate() {
    evalMutation.mutate(evalForm, { onSuccess: (data) => setEvalResult(data) })
  }

  function addAdjustment() {
    setForm((f) => ({ ...f, adjustments: [...f.adjustments, { element: '', threshold: 0, penalty_per_pct: 0 }] }))
  }

  function updateAdjustment(idx: number, field: keyof FormulaAdjustmentCreate, value: string | number) {
    setForm((f) => {
      const adjs = [...f.adjustments]
      adjs[idx] = { ...adjs[idx], [field]: value }
      return { ...f, adjustments: adjs }
    })
  }

  function removeAdjustment(idx: number) {
    setForm((f) => ({ ...f, adjustments: f.adjustments.filter((_, i) => i !== idx) }))
  }

  const curveName = (id: number) => curves.find((c) => c.id === id)?.code ?? String(id)

  const columns: Column<PricingFormulaOut>[] = [
    { key: 'name', header: 'Name', render: (r) => r.name, sortable: true, sortValue: (r) => r.name },
    { key: 'curve', header: 'Curve', render: (r) => curveName(r.curve_id) },
    { key: 'fe', header: 'Basis Fe%', render: (r) => r.basis_fe },
    { key: 'rate', header: 'Fe Rate', render: (r) => formatPrice(r.fe_rate_per_pct) },
    { key: 'moist', header: 'Moisture Threshold', render: (r) => `${r.moisture_threshold}%` },
    { key: 'premium', header: 'Fixed Premium', render: (r) => formatPrice(r.fixed_premium) },
    { key: 'adjs', header: 'Adjustments', render: (r) => r.adjustments.length },
    {
      key: 'actions', header: '', render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEvaluate(r)}><Play className="mr-2 h-4 w-4" />Evaluate</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(r)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Pricing Formulas">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Formula</Button>
      </PageHeader>

      {isLoading ? <p className="text-muted-foreground">Loading...</p> : <DataTable columns={columns} data={formulas} />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Formula' : 'New Formula'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Curve</Label>
              <Select value={String(form.curve_id)} onValueChange={(v) => setForm({ ...form, curve_id: +v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{curves.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.code} - {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Basis Fe%</Label><Input type="number" value={form.basis_fe} onChange={(e) => setForm({ ...form, basis_fe: +e.target.value })} /></div>
              <div><Label>Fe Rate/pct</Label><Input type="number" step="0.01" value={form.fe_rate_per_pct} onChange={(e) => setForm({ ...form, fe_rate_per_pct: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Moisture Threshold%</Label><Input type="number" value={form.moisture_threshold} onChange={(e) => setForm({ ...form, moisture_threshold: +e.target.value })} /></div>
              <div><Label>Moisture Penalty/pct</Label><Input type="number" step="0.01" value={form.moisture_penalty_per_pct} onChange={(e) => setForm({ ...form, moisture_penalty_per_pct: +e.target.value })} /></div>
            </div>
            <div><Label>Fixed Premium</Label><Input type="number" step="0.01" value={form.fixed_premium} onChange={(e) => setForm({ ...form, fixed_premium: +e.target.value })} /></div>

            {!editingId && (
              <div>
                <div className="flex items-center justify-between">
                  <Label>Adjustments</Label>
                  <Button variant="outline" size="sm" onClick={addAdjustment}>Add</Button>
                </div>
                {form.adjustments.map((adj, i) => (
                  <div key={i} className="mt-2 grid grid-cols-4 gap-2 items-end">
                    <div><Label className="text-xs">Element</Label><Input value={adj.element} onChange={(e) => updateAdjustment(i, 'element', e.target.value)} placeholder="SiO2" /></div>
                    <div><Label className="text-xs">Threshold</Label><Input type="number" step="0.01" value={adj.threshold} onChange={(e) => updateAdjustment(i, 'threshold', +e.target.value)} /></div>
                    <div><Label className="text-xs">Penalty/pct</Label><Input type="number" step="0.01" value={adj.penalty_per_pct} onChange={(e) => updateAdjustment(i, 'penalty_per_pct', +e.target.value)} /></div>
                    <Button variant="ghost" size="sm" onClick={() => removeAdjustment(i)} className="text-destructive">Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Evaluate Formula</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label>QP Average Price</Label><Input type="number" step="0.01" value={evalForm.qp_average} onChange={(e) => setEvalForm({ ...evalForm, qp_average: +e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Fe%</Label><Input type="number" step="0.01" value={evalForm.fe ?? ''} onChange={(e) => setEvalForm({ ...evalForm, fe: +e.target.value })} /></div>
              <div><Label>Moisture%</Label><Input type="number" step="0.01" value={evalForm.moisture ?? ''} onChange={(e) => setEvalForm({ ...evalForm, moisture: +e.target.value })} /></div>
              <div><Label>SiO2%</Label><Input type="number" step="0.01" value={evalForm.sio2 ?? ''} onChange={(e) => setEvalForm({ ...evalForm, sio2: +e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Al2O3%</Label><Input type="number" step="0.01" value={evalForm.al2o3 ?? ''} onChange={(e) => setEvalForm({ ...evalForm, al2o3: +e.target.value })} /></div>
              <div><Label>P%</Label><Input type="number" step="0.001" value={evalForm.p ?? ''} onChange={(e) => setEvalForm({ ...evalForm, p: +e.target.value })} /></div>
              <div><Label>S%</Label><Input type="number" step="0.001" value={evalForm.s ?? ''} onChange={(e) => setEvalForm({ ...evalForm, s: +e.target.value })} /></div>
            </div>
            <Button onClick={handleEvaluate} disabled={evalMutation.isPending}>{evalMutation.isPending ? 'Evaluating...' : 'Evaluate'}</Button>

            {evalResult && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Breakdown</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Base Price</span><span>{formatPrice(evalResult.base_price)}</span></div>
                  <div className="flex justify-between"><span>Fe Adjustment</span><span>{formatPrice(evalResult.fe_adjustment)}</span></div>
                  <div className="flex justify-between"><span>Moisture Penalty</span><span>{formatPrice(evalResult.moisture_penalty)}</span></div>
                  {Object.entries(evalResult.impurity_penalties).map(([k, v]) => (
                    <div key={k} className="flex justify-between"><span>{k} Penalty</span><span>{formatPrice(v)}</span></div>
                  ))}
                  <div className="flex justify-between"><span>Fixed Premium</span><span>{formatPrice(evalResult.fixed_premium)}</span></div>
                  <div className="flex justify-between border-t pt-1 font-bold"><span>Total Price</span><span>{formatPrice(evalResult.total_price)}</span></div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Formula"
        description={`Delete formula ${deleteTarget?.name}? This cannot be undone.`}
        onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
