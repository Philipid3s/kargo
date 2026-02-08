import { api } from './client'
import type { ContractOut, ContractCreate, ContractUpdate, ContractOpenQuantity, Direction, ContractStatus } from '@/types'

const BASE = '/api/v1/contracts'

export const contractsApi = {
  list: (direction?: Direction, status?: ContractStatus) => {
    const params = new URLSearchParams()
    if (direction) params.set('direction', direction)
    if (status) params.set('status', status)
    const qs = params.toString()
    return api.get<ContractOut[]>(`${BASE}${qs ? `?${qs}` : ''}`)
  },
  get: (id: number) => api.get<ContractOut>(`${BASE}/${id}`),
  create: (data: ContractCreate) => api.post<ContractOut>(BASE, data),
  update: (id: number, data: ContractUpdate) => api.patch<ContractOut>(`${BASE}/${id}`, data),
  updateStatus: (id: number, status: ContractStatus) => api.patch<ContractOut>(`${BASE}/${id}/status`, { status }),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
  openQuantity: (id: number) => api.get<ContractOpenQuantity>(`${BASE}/${id}/open-quantity`),
}
