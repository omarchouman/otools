import Link from 'next/link'
import { KeyRound, Megaphone, BarChart2, Sparkles, ArrowRight, Layers } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const tools = [
  {
    href: '/password-generator',
    icon: KeyRound,
    title: 'Password Generator',
    description: 'Generate strong, secure passwords with customizable rules.',
  },
  {
    href: '/marketing',
    icon: Megaphone,
    title: 'Marketing',
    description: 'Create compelling copy, email campaigns, and social posts.',
  },
  {
    href: '/analysis',
    icon: BarChart2,
    title: 'Analysis',
    description: 'Analyze data and surface insights with powerful visualizations.',
  },
  {
    href: '/ai-tools',
    icon: Sparkles,
    title: 'AI Tools',
    description: 'AI-powered utilities to supercharge your workflow.',
  },
]

export default function HomePage() {
  return (
    <div className="p-6 space-y-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-8">
        <div className="relative z-10 max-w-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Dashboard
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Welcome to OTools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your all-in-one productivity suite. Browse tools below to get started.
          </p>
        </div>
        <Layers className="absolute right-8 top-1/2 -translate-y-1/2 h-28 w-28 text-primary/10 pointer-events-none" />
      </div>

      {/* Tools grid */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Tools
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full cursor-pointer border transition-all hover:border-primary/40 hover:shadow-sm">
                <CardHeader className="pb-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="flex items-center justify-between text-sm font-semibold">
                    {title}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
