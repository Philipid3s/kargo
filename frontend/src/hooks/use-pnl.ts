import { useQuery } from '@tanstack/react-query'
import { pnlApi } from '@/api/pnl'

const keys = {
  all: ['pnl'] as const,
  summary: () => [...keys.all, 'summary'] as const,
  realized: () => [...keys.all, 'realized'] as const,
  unrealized: () => [...keys.all, 'unrealized'] as const,
}

export function usePnlSummary() {
  return useQuery({ queryKey: keys.summary(), queryFn: () => pnlApi.summary() })
}

export function useRealizedPnl() {
  return useQuery({ queryKey: keys.realized(), queryFn: () => pnlApi.realized() })
}

export function useUnrealizedPnl() {
  return useQuery({ queryKey: keys.unrealized(), queryFn: () => pnlApi.unrealized() })
}
