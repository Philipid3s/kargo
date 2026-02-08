import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { shipmentsApi } from '@/api/shipments'
import type { ShipmentCreate, ShipmentUpdate, ShipmentStatus } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['shipments'] as const,
  list: (contractId?: number) => [...keys.all, 'list', contractId] as const,
  detail: (id: number) => [...keys.all, id] as const,
}

export function useShipments(contractId?: number) {
  return useQuery({ queryKey: keys.list(contractId), queryFn: () => shipmentsApi.list(contractId) })
}

export function useShipment(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => shipmentsApi.get(id), enabled: !!id })
}

export function useCreateShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentCreate) => shipmentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Shipment created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateShipment(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ShipmentUpdate) => shipmentsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Shipment updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdateShipmentStatus(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (status: ShipmentStatus) => shipmentsApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Status updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeleteShipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Shipment deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useComputeProvisional() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipmentsApi.computeProvisional(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Provisional price computed') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useComputeFinal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => shipmentsApi.computeFinal(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Final price computed') },
    onError: (e: Error) => toast.error(e.message),
  })
}
