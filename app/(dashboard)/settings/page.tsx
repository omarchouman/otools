import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './_components/profile-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>
      <div className="mt-8">
        <ProfileForm
          displayName={user.user_metadata?.display_name ?? ''}
          avatarUrl={user.user_metadata?.avatar_url ?? ''}
          email={user.email ?? ''}
        />
      </div>
    </div>
  )
}
