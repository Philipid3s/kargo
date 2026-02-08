import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { priceCurvesApi } from '@/api/price-curves'
import type { PriceCurveCreate, PriceCurveUpdate, CurveDataCreate } from '@/types'
import { toast } from 'sonner'

const keys = {
  all: ['price-curves'] as const,
  list: () => [...keys.all, 'list'] as const,
  detail: (id: number) => [...keys.all, id] as const,
  data: (id: number) => [...keys.all, id, 'data'] as const,
}

export function usePriceCurves() {
  return useQuery({ queryKey: keys.list(), queryFn: () => priceCurvesApi.list() })
}

export function usePriceCurve(id: number) {
  return useQuery({ queryKey: keys.detail(id), queryFn: () => priceCurvesApi.get(id), enabled: !!id })
}

export function useCurveData(id: number) {
  return useQuery({ queryKey: keys.data(id), queryFn: () => priceCurvesApi.getData(id), enabled: !!id })
}

export function useCreatePriceCurve() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PriceCurveCreate) => priceCurvesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Price curve created') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUpdatePriceCurve(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: PriceCurveUpdate) => priceCurvesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Price curve updated') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useDeletePriceCurve() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => priceCurvesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Price curve deleted') },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useUploadCurveData(curveId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dataPoints: CurveDataCreate[]) => priceCurvesApi.uploadData(curveId, { data_points: dataPoints }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: keys.all }); toast.success('Curve data uploaded') },
    onError: (e: Error) => toast.error(e.message),
  })
}
