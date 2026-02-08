import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mtmApi } from '@/api/mtm'
import type { MtmRunRequest } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['mtm'] as const,
  history: (contractId?: number) => [...keys.all, 'history', contractId] as const,
}

export function useMtmHistory(contractId?: number) {
  return useQuery({ queryKey: keys.history(contractId), queryFn: () => mtmApi.history(contractId) })
}

export function useRunMtm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: MtmRunRequest) => mtmApi.runPortfolio(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('MTM calculation complete') },
    onError: (e: Error) => toast.error(e.message),
  })
}
