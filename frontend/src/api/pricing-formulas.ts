import { api } from './client'
import type { PricingFormulaOut, PricingFormulaCreate, PricingFormulaUpdate, PriceBreakdown, FormulaEvaluateRequest } from '@/types'

const BASE = '/api/v1/pricing-formulas'

export const pricingFormulasApi = {
  list: () => api.get<PricingFormulaOut[]>(BASE),
  get: (id: number) => api.get<PricingFormulaOut>(`${BASE}/${id}`),
  create: (data: PricingFormulaCreate) => api.post<PricingFormulaOut>(BASE, data),
  update: (id: number, data: PricingFormulaUpdate) => api.patch<PricingFormulaOut>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
  evaluate: (id: number, data: FormulaEvaluateRequest) => api.post<PriceBreakdown>(`${BASE}/${id}/evaluate`, data),
}
