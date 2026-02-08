import { Badge } from '@/components/ui/badge'

const colorMap: Record<string, string> = {
  BUY: 'bg-blue-100 text-blue-800',
  SELL: 'bg-red-100 text-red-800',
  OPEN: 'bg-green-100 text-green-800',
  EXECUTED: 'bg-yellow-100 text-yellow-800',
  CLOSED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-gray-200 text-gray-500',
  PLANNED: 'bg-blue-50 text-blue-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-green-100 text-green-800',
  PROVISIONAL: 'bg-amber-100 text-amber-800',
  FINAL: 'bg-indigo-100 text-indigo-800',
}

export function StatusBadge({ value }: { value: string }) {
  return (
    <Badge variant="outline" className={colorMap[value] || ''}>
      {value.replace('_', ' ')}
    </Badge>
  )
}
