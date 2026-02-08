import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pricingFormulasApi } from '@/api/pricing-formulas'
import type { PricingFormulaCreate, PricingFormulaUpdate, FormulaEvaluateRequest } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['pricing-formulas'] as const,
  list: () => [...keys.all, 'list'] as const,
  detail: (id: number) => [...keys.all, id] as const,
}

export function usePricingFormulas() {
  return useQuery({ queryKey: keys.list(), queryFn: () => pricingFormulasApi.list() })
}

export function usePricingFormula(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => pricingFormulasApi.get(id), enabled: !!id })
}

export function useCreatePricingFormula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PricingFormulaCreate) => pricingFormulasApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Formula created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePricingFormula(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PricingFormulaUpdate) => pricingFormulasApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Formula updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePricingFormula() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => pricingFormulasApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Formula deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useEvaluateFormula(id: number) {
  return useMutation({
    mutationFn: (data: FormulaEvaluateRequest) => pricingFormulasApi.evaluate(id, data),
    onError: (e: Error) => toast.error(e.message),
  })
}
