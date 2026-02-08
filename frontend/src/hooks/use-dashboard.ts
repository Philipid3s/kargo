import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'
import { toast } from 'sonner'

export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: () => dashboardApi.summary() })
}

export function useSeedDatabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => dashboardApi.seed(),
    onSuccess: () => {
      qc.invalidateQueries()
      toast.success('Database seeded successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useClearDatabase() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => dashboardApi.clear(),
    onSuccess: () => {
      qc.invalidateQueries()
      toast.success('Database cleared')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useValueAllPositions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => dashboardApi.valueAllPositions(),
    onSuccess: (data) => {
      qc.invalidateQueries()
      const msg = `Valued ${data.provisional_computed} provisional, ${data.final_computed} final`
      if (data.errors.length > 0) {
        toast.warning(`${msg} (${data.errors.length} errors)`)
      } else {
        toast.success(msg)
      }
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
