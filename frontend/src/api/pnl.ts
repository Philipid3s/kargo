import { api } from './client'
import type { PnlSummary, RealizedPnlItem, UnrealizedPnlItem } from '@/types'

const BASE = '/api/v1/pnl'

export const pnlApi = {
  summary: () => api.get<PnlSummary>(`${BASE}/summary`),
  realized: () => api.get<RealizedPnlItem[]>(`${BASE}/realized`),
  unrealized: () => api.get<UnrealizedPnlItem[]>(`${BASE}/unrealized`),
}
