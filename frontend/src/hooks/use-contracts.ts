import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contractsApi } from '@/api/contracts'
import type { ContractCreate, ContractUpdate, ContractStatus, Direction } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['contracts'] as const,
  list: (dir?: Direction, status?: ContractStatus) => [...keys.all, 'list', dir, status] as const,
  detail: (id: number) => [...keys.all, id] as const,
  openQty: (id: number) => [...keys.all, id, 'open-quantity'] as const,
}

export function useContracts(direction?: Direction, status?: ContractStatus) {
  return useQuery({ queryKey: keys.list(direction, status), queryFn: () => contractsApi.list(direction, status) })
}

export function useContract(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => contractsApi.get(id), enabled: !!id })
}

export function useContractOpenQuantity(id: number) {
  return useQuery({ queryKey: keys.openQty(id), queryFn: () => contractsApi.openQuantity(id), enabled: !!id })
}

export function useCreateContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ContractCreate) => contractsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Contract created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateContract(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ContractUpdate) => contractsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Contract updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateContractStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: ContractStatus) => contractsApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Status updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => contractsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Contract deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}
