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
  ChevronDown,
  Zap,
  Code2,
  TrendingUp,
  Bot,
  Layers,
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

type LucideIcon = React.ComponentType<{ className?: string }>

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

interface NavCategory {
  id: string
  label: string
  icon: LucideIcon
  items: NavItem[]
}

const homeItem: NavItem = { href: '/', label: 'Home', icon: LayoutDashboard }

const navCategories: NavCategory[] = [
  {
    id: 'developer',
    label: 'Developer Tools',
    icon: Code2,
    items: [
      { href: '/password-generator', label: 'Password Generator', icon: KeyRound },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing Tools',
    icon: TrendingUp,
    items: [
      { href: '/marketing', label: 'Marketing', icon: Megaphone },
    ],
  },
  {
    id: 'ai',
    label: 'AI Tools',
    icon: Bot,
    items: [
      { href: '/ai-tools', label: 'AI Tools', icon: Sparkles },
    ],
  },
  {
    id: 'general',
    label: 'General Tools',
    icon: Layers,
    items: [
      { href: '/analysis', label: 'Analysis', icon: BarChart2 },
    ],
  },
]

const allItems: NavItem[] = [homeItem, ...navCategories.flatMap((c) => c.items)]

interface SidebarUser {
  email?: string
  displayName?: string
  avatarUrl?: string
}

export function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const initials = (user.displayName ?? user.email ?? 'U').slice(0, 2).toUpperCase()

  const activeCategoryId = navCategories.find((cat) =>
    cat.items.some((item) => item.href === pathname)
  )?.id

  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(navCategories.map((c) => c.id))
  )

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href
    const Icon = item.icon
    return (
      <Link
        href={item.href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            isActive
              ? 'text-primary'
              : 'text-sidebar-foreground/40 group-hover:text-sidebar-accent-foreground'
          )}
        />
        <span className="flex-1 leading-none">{item.label}</span>
        {isActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
      </Link>
    )
  }

  return (
    <TooltipProvider delay={0}>
      <aside
        className={cn(
          'relative flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200',
          collapsed ? 'w-[68px]' : 'w-72'
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
        <nav className="flex flex-1 flex-col overflow-y-auto p-4 pt-4">
          {collapsed ? (
            /* Collapsed: flat icon list with tooltips */
            <div className="flex flex-col items-center gap-0.5">
              {allItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger
                      render={
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-sidebar-foreground/45 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                        </Link>
                      }
                    />
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ) : (
            /* Expanded: home link + categorized accordion */
            <div className="flex flex-col gap-4">
              {/* Home */}
              <NavLink item={homeItem} />

              {/* Categories */}
              {navCategories.map((cat, i) => {
                const isOpen = openCategories.has(cat.id)
                const CatIcon = cat.icon
                return (
                  <div key={cat.id}>
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/65"
                    >
                      <CatIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 text-left">{cat.label}</span>
                      <ChevronDown
                        className={cn(
                          'h-3 w-3 shrink-0 transition-transform duration-200',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Category items — animated with CSS grid */}
                    <div
                      className={cn(
                        'grid transition-all duration-200',
                        isOpen ? '[grid-template-rows:1fr]' : '[grid-template-rows:0fr]'
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-3 space-y-0.5 border-l border-sidebar-border py-1 pl-2">
                          {cat.items.map((item) => (
                            <NavLink key={item.href} item={item} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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
