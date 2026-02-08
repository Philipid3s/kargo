import { api } from './client'
import type { DashboardSummary } from '@/types'

export interface ValueAllPositionsResponse {
  provisional_computed: number
  final_computed: number
  errors: string[]
}

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/api/v1/dashboard/summary'),
  seed: () => api.post<{ message: string }>('/seed'),
  clear: () => api.post<{ status: string }>('/clear'),
  valueAllPositions: () => api.post<ValueAllPositionsResponse>('/api/v1/dashboard/value-all-positions'),
}
