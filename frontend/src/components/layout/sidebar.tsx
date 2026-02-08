import { useState } from 'react'
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ThemeToggle } from '@/components/layout/theme-toggle'

const STORAGE_KEY = 'kargo-sidebar-collapsed'

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
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )

  function toggle() {
    const next = !collapsed
    localStorage.setItem(STORAGE_KEY, String(next))
    setCollapsed(next)
  }

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r bg-card transition-[width] duration-200 overflow-hidden',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center border-b whitespace-nowrap',
          collapsed ? 'justify-center px-2' : 'px-4',
        )}
      >
        <h1 className={cn('font-bold tracking-tight', collapsed ? 'text-sm' : 'text-lg')}>
          {collapsed ? 'Kargo' : 'Kargo CTRM'}
        </h1>
      </div>

      <nav
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          collapsed ? 'flex flex-col items-center gap-1 p-2' : 'space-y-1 p-3',
        )}
      >
        {navItems.map((item) =>
          collapsed ? (
            <Tooltip key={item.to} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex size-9 items-center justify-center rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )
                  }
                >
                  <item.icon className="size-4" />
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ),
        )}
      </nav>

      <Separator />
      <div
        className={cn(
          'flex items-center py-3',
          collapsed ? 'flex-col gap-2 px-2' : 'justify-between px-4',
        )}
      >
        {!collapsed && (
          <span className="text-xs text-muted-foreground">Theme</span>
        )}
        <ThemeToggle />
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  )
}
