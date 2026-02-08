import { api } from './client'
import type { MtmPortfolioOut, MtmRecordOut, MtmRunRequest } from '@/types'

const BASE = '/api/v1/mtm'

export const mtmApi = {
  runPortfolio: (data: MtmRunRequest) => api.post<MtmPortfolioOut>(`${BASE}/run`, data),
  runContract: (contractId: number, data: MtmRunRequest) => api.post<MtmRecordOut>(`${BASE}/run/${contractId}`, data),
  history: (contractId?: number, valuationDate?: string) => {
    const params = new URLSearchParams()
    if (contractId) params.set('contract_id', String(contractId))
    if (valuationDate) params.set('valuation_date', valuationDate)
    const qs = params.toString()
    return api.get<MtmRecordOut[]>(`${BASE}/history${qs ? `?${qs}` : ''}`)
  },
  portfolio: (valuationDate?: string) => {
    const qs = valuationDate ? `?valuation_date=${valuationDate}` : ''
    return api.get<MtmPortfolioOut>(`${BASE}/portfolio${qs}`)
  },
}
