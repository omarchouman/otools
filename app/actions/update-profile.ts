'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(
  _prevState: { error?: string; message?: string } | null,
  formData: FormData
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated.' }

  const displayName = formData.get('displayName') as string | null
  const avatarFile = formData.get('avatar') as File | null

  let avatarUrl: string | undefined

  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split('.').pop() ?? 'png'
    const filePath = `${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true })

    if (uploadError) return { error: uploadError.message }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    avatarUrl = publicUrl
  }

  const updates: Record<string, string> = {}
  if (displayName !== null) updates.display_name = displayName
  if (avatarUrl) updates.avatar_url = avatarUrl

  if (Object.keys(updates).length === 0) {
    return { message: 'No changes to save.' }
  }

  const { error } = await supabase.auth.updateUser({ data: updates })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  return { message: 'Profile updated.' }
}
