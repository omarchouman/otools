'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  KeyRound,
  Megaphone,
  BarChart2,
  Sparkles,
  ChevronLeft,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/password-generator', label: 'Password Generator', icon: KeyRound },
  { href: '/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/analysis', label: 'Analysis', icon: BarChart2 },
  { href: '/ai-tools', label: 'AI Tools', icon: Sparkles },
]

interface SidebarUser {
  email?: string
  displayName?: string
  avatarUrl?: string
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const initials = (user.displayName ?? user.email ?? 'U')
    .slice(0, 2)
    .toUpperCase()

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          'relative flex h-screen flex-col border-r bg-card transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b px-4',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? (
            <span className="text-lg font-bold">O</span>
          ) : (
            <span className="text-lg font-bold tracking-tight">OTools</span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            const linkEl = (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && label}
              </Link>
            )

            return collapsed ? (
              <Tooltip key={href}>
                <TooltipTrigger render={linkEl} />
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            ) : (
              linkEl
            )
          })}
        </nav>

        {/* User / Settings */}
        <div className={cn('border-t p-2', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link href="/settings">
                    <Avatar className="h-8 w-8 cursor-pointer">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                }
              />
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="truncate">
                {user.displayName ?? user.email ?? 'Account'}
              </span>
            </Link>
          )}
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[58px] h-6 w-6 rounded-full border bg-background shadow-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn(
              'h-3 w-3 transition-transform duration-200',
              collapsed && 'rotate-180'
            )}
          />
        </Button>
      </aside>
    </TooltipProvider>
  )
}
