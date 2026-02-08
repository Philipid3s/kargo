import { api } from './client'
import type { ExposureSummary } from '@/types'

export const exposureApi = {
  get: () => api.get<ExposureSummary>('/api/v1/exposure'),
}
