import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchingApi } from '@/api/matching'
import type { MatchCreate } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['matching'] as const,
  list: () => [...keys.all, 'list'] as const,
}

export function useMatches() {
  return useQuery({ queryKey: keys.list(), queryFn: () => matchingApi.list() })
}

export function useRunFifo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => matchingApi.runFifo(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ['pnl'] })
      toast.success(`FIFO matched ${data.length} pairs`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useCreateManualMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MatchCreate) => matchingApi.createManual(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ['pnl'] })
      toast.success('Manual match created')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteMatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => matchingApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ['pnl'] })
      toast.success('Match deleted')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUnwindAll() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => matchingApi.unwindAll(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: keys.all })
      qc.invalidateQueries({ queryKey: ['pnl'] })
      toast.success(`Unwound ${data?.deleted ?? 0} matches`)
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
