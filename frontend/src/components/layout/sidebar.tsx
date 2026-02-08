import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Ship,
  TrendingUp,
  Calculator,
  FlaskConical,
  BarChart3,
  GitMerge,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/contracts', label: 'Contracts', icon: FileText },
  { to: '/shipments', label: 'Shipments', icon: Ship },
  { to: '/price-curves', label: 'Price Curves', icon: TrendingUp },
  { to: '/pricing-formulas', label: 'Formulas', icon: Calculator },
  { to: '/assays', label: 'Assays', icon: FlaskConical },
  { to: '/mtm', label: 'Mark-to-Market', icon: BarChart3 },
  { to: '/matching', label: 'Matching', icon: GitMerge },
  { to: '/pnl', label: 'P&L', icon: DollarSign },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-bold tracking-tight">Kargo CTRM</h1>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
