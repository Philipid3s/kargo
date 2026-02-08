import { api } from './client'
import type { ShipmentOut, ShipmentCreate, ShipmentUpdate, ShipmentStatus, ProvisionalPriceResponse, FinalPriceResponse } from '@/types'

const BASE = '/api/v1/shipments'

export const shipmentsApi = {
  list: (contractId?: number) => {
    const qs = contractId ? `?contract_id=${contractId}` : ''
    return api.get<ShipmentOut[]>(`${BASE}${qs}`)
  },
  get: (id: number) => api.get<ShipmentOut>(`${BASE}/${id}`),
  create: (data: ShipmentCreate) => api.post<ShipmentOut>(BASE, data),
  update: (id: number, data: ShipmentUpdate) => api.patch<ShipmentOut>(`${BASE}/${id}`, data),
  updateStatus: (id: number, status: ShipmentStatus) => api.patch<ShipmentOut>(`${BASE}/${id}/status`, { status }),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
  computeProvisional: (id: number) => api.post<ProvisionalPriceResponse>(`${BASE}/${id}/compute-provisional`),
  computeFinal: (id: number) => api.post<FinalPriceResponse>(`${BASE}/${id}/compute-final`),
}
