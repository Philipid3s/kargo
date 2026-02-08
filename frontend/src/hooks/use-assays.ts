import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assaysApi } from '@/api/assays'
import type { AssayCreate, AssayUpdate } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['assays'] as const,
  list: (shipmentId?: number) => [...keys.all, 'list', shipmentId] as const,
  detail: (id: number) => [...keys.all, id] as const,
}

export function useAssays(shipmentId?: number) {
  return useQuery({ queryKey: keys.list(shipmentId), queryFn: () => assaysApi.list(shipmentId) })
}

export function useAssay(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => assaysApi.get(id), enabled: !!id })
}

export function useCreateAssay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssayCreate) => assaysApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Assay created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateAssay(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AssayUpdate) => assaysApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Assay updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteAssay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => assaysApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Assay deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}
