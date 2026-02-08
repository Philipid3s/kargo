import { api } from './client'
import type { AssayOut, AssayCreate, AssayUpdate } from '@/types'

const BASE = '/api/v1/assays'

export const assaysApi = {
  list: (shipmentId?: number) => {
    const qs = shipmentId ? `?shipment_id=${shipmentId}` : ''
    return api.get<AssayOut[]>(`${BASE}${qs}`)
  },
  get: (id: number) => api.get<AssayOut>(`${BASE}/${id}`),
  create: (data: AssayCreate) => api.post<AssayOut>(BASE, data),
  update: (id: number, data: AssayUpdate) => api.patch<AssayOut>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
}
