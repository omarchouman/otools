import Link from 'next/link'
import { KeyRound, Megaphone, BarChart2, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const tools = [
  {
    href: '/password-generator',
    icon: KeyRound,
    title: 'Password Generator',
    description: 'Generate strong, secure passwords with customizable options.',
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
    description: 'AI-powered utilities to boost your productivity.',
  },
]

export default function HomePage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to OTools</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your suite of powerful productivity tools.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
              <CardHeader>
                <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
