'use client'

import { usePathname } from 'next/navigation'
import { Moon, Sun, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { logout } from '@/app/actions/logout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Home', subtitle: 'Overview of your tools' },
  '/password-generator': { title: 'Password Generator', subtitle: 'Create secure passwords' },
  '/marketing': { title: 'Marketing', subtitle: 'Content and campaign tools' },
  '/analysis': { title: 'Analysis', subtitle: 'Data and insights' },
  '/ai-tools': { title: 'AI Tools', subtitle: 'AI-powered utilities' },
  '/jwt-decoder': { title: 'JWT Decoder', subtitle: 'Inspect token claims and structure' },
  '/regex-tester': { title: 'Regex Tester', subtitle: 'Test patterns and inspect matches' },
  '/hash-generator': { title: 'Hash Generator', subtitle: 'MD5, SHA-1, SHA-256, SHA-384, SHA-512' },
  '/diff-viewer': { title: 'Diff Viewer', subtitle: 'Compare two texts line by line' },
  '/color-converter': { title: 'Color Converter', subtitle: 'Convert between HEX, RGB, HSL, and HSB' },
  '/headline-analyzer': { title: 'Headline Analyzer', subtitle: 'Score and improve your headlines' },
  '/utm-builder': { title: 'UTM Builder', subtitle: 'Build and copy UTM-tagged campaign URLs' },
  '/meta-tag-builder': { title: 'Meta Tag Builder', subtitle: 'Generate SEO and social meta tags' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account' },
}

interface TopNavUser {
  email?: string
  displayName?: string
  avatarUrl?: string
}

export function TopNav({ user }: { user: TopNavUser }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const page = pageTitles[pathname] ?? { title: 'OTools', subtitle: '' }
  const initials = (user.displayName ?? user.email ?? 'U').slice(0, 2).toUpperCase()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 bg-card/80 px-6 backdrop-blur-sm">
      {/* Page title */}
      <div>
        <h1 className="text-[15px] font-semibold leading-none text-foreground">{page.title}</h1>
        {page.subtitle && (
          <p className="mt-1 text-[11px] leading-none text-muted-foreground">{page.subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Notifications (placeholder) */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Divider */}
        <div className="mx-1 h-5 w-px bg-border" />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="h-8 gap-2 rounded-full px-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground/80">
                  {user.displayName ?? user.email ?? 'Account'}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col p-2">
              <p className="text-sm font-medium leading-none">{user.displayName ?? 'Account'}</p>
              <p className="mt-1 truncate text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <form action={logout} className="w-full">
                  <button type="submit" className="w-full cursor-pointer text-left text-sm">
                    Log out
                  </button>
                </form>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
