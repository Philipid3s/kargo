import { api } from './client'
import type { MatchOut, MatchCreate } from '@/types'

const BASE = '/api/v1/matching'

export const matchingApi = {
  list: () => api.get<MatchOut[]>(BASE),
  runFifo: () => api.post<MatchOut[]>(`${BASE}/fifo`),
  createManual: (data: MatchCreate) => api.post<MatchOut>(`${BASE}/manual`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
  unwindAll: () => api.delete<{ deleted: number }>(BASE),
}
