import { api } from './client'
import type { PriceCurveOut, PriceCurveCreate, PriceCurveUpdate, CurveDataOut, CurveDataCreate, CurveAverageResponse } from '@/types'

const BASE = '/api/v1/price-curves'

export const priceCurvesApi = {
  list: () => api.get<PriceCurveOut[]>(BASE),
  get: (id: number) => api.get<PriceCurveOut>(`${BASE}/${id}`),
  create: (data: PriceCurveCreate) => api.post<PriceCurveOut>(BASE, data),
  update: (id: number, data: PriceCurveUpdate) => api.patch<PriceCurveOut>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
  uploadData: (id: number, data: { data_points: CurveDataCreate[] }) => api.post<CurveDataOut[]>(`${BASE}/${id}/data`, data),
  getData: (id: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    const qs = params.toString()
    return api.get<CurveDataOut[]>(`${BASE}/${id}/data${qs ? `?${qs}` : ''}`)
  },
  getAverage: (id: number, startDate: string, endDate: string) =>
    api.get<CurveAverageResponse>(`${BASE}/${id}/average?start_date=${startDate}&end_date=${endDate}`),
}
