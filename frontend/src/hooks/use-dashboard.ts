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
