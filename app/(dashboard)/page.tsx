import Link from 'next/link'
import { KeyRound, Megaphone, BarChart2, Sparkles, ArrowUpRight, ShieldCheck, Regex } from 'lucide-react'

const tools = [
  {
    href: '/password-generator',
    icon: KeyRound,
    title: 'Password Generator',
    description:
      'Generate strong, secure passwords with customizable length, symbols, and strength analysis.',
    gradient: 'from-emerald-500 to-green-600',
    glow: 'shadow-emerald-500/20',
    tag: 'Security',
  },
  {
    href: '/marketing',
    icon: Megaphone,
    title: 'Marketing',
    description:
      'Create compelling copy, email campaigns, and social content that drives real engagement.',
    gradient: 'from-green-500 to-teal-600',
    glow: 'shadow-green-500/20',
    tag: 'Content',
  },
  {
    href: '/analysis',
    icon: BarChart2,
    title: 'Analysis',
    description:
      'Visualize your data and surface meaningful insights with charts and smart summaries.',
    gradient: 'from-teal-500 to-emerald-700',
    glow: 'shadow-teal-500/20',
    tag: 'Data',
  },
  {
    href: '/ai-tools',
    icon: Sparkles,
    title: 'AI Tools',
    description:
      'AI-powered utilities that automate repetitive tasks and supercharge your workflow.',
    gradient: 'from-emerald-400 to-green-500',
    glow: 'shadow-emerald-400/20',
    tag: 'AI',
  },
  {
    href: '/jwt-decoder',
    icon: ShieldCheck,
    title: 'JWT Decoder',
    description:
      'Paste any JWT and instantly inspect its header, payload claims, and expiry status.',
    gradient: 'from-green-600 to-teal-700',
    glow: 'shadow-green-600/20',
    tag: 'Developer',
  },
  {
    href: '/regex-tester',
    icon: Regex,
    title: 'Regex Tester',
    description:
      'Write and test regular expressions live, with match highlighting, capture groups, and flag toggles.',
    gradient: 'from-teal-500 to-green-600',
    glow: 'shadow-teal-500/20',
    tag: 'Developer',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-full p-8">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary/70">
            Dashboard
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome to OTools</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a tool below to get started. More coming soon.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-xs font-medium text-muted-foreground">6 tools available</span>
        </div>
      </div>

      {/* Tools grid */}
      <div className="grid gap-5 sm:grid-cols-2">
        {tools.map(({ href, icon: Icon, title, description, gradient, glow, tag }) => (
          <Link key={href} href={href} className="group">
            <div
              className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${glow}`}
            >
              {/* Gradient top bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />

              <div className="flex flex-1 flex-col p-6">
                {/* Icon + tag row */}
                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-md`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {tag}
                  </span>
                </div>

                {/* Text */}
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>

                {/* CTA */}
                <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary transition-all duration-200 group-hover:gap-2">
                  Open tool
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
