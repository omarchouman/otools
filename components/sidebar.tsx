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
  Zap,
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
  const initials = (user.displayName ?? user.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          'relative flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
          collapsed ? 'w-[68px]' : 'w-60'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center gap-3 px-5',
            collapsed && 'justify-center px-0'
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm shadow-primary/30">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-bold tracking-tight text-sidebar-foreground">
              OTools
            </span>
          )}
        </div>

        <div className="mx-4 h-px bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-0.5 p-3 pt-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            const linkEl = (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0 transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground'
                  )}
                />
                {!collapsed && <span className="flex-1 leading-none">{label}</span>}
                {isActive && !collapsed && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
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

        <div className="mx-4 h-px bg-sidebar-border" />

        {/* User */}
        <div className={cn('p-3', collapsed && 'flex justify-center')}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Link href="/settings">
                    <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-sidebar-border transition-all hover:ring-sidebar-accent">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-sidebar-accent text-[10px] text-sidebar-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                }
              />
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-sidebar-accent"
            >
              <Avatar className="h-7 w-7 shrink-0 ring-1 ring-sidebar-border">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-sidebar-accent text-[10px] text-sidebar-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-medium leading-none text-sidebar-foreground/90">
                  {user.displayName ?? user.email ?? 'Account'}
                </span>
                {user.displayName && user.email && (
                  <span className="mt-0.5 truncate text-[10px] leading-none text-sidebar-foreground/45">
                    {user.email}
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>

        {/* Collapse toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[72px] h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/50 shadow-sm hover:bg-sidebar hover:text-sidebar-foreground"
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
