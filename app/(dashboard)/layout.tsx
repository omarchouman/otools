import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'
import { TopNav } from '@/components/top-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = {
    email: user.email,
    displayName: user.user_metadata?.display_name as string | undefined,
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={userData} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={userData} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
