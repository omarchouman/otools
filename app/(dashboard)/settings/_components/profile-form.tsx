'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { updateProfile } from '@/app/actions/update-profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  displayName: string
  avatarUrl: string
  email: string
}

export function ProfileForm({ displayName, avatarUrl, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, null)
  const [preview, setPreview] = useState(avatarUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = (displayName || email || 'U').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (state?.message) toast.success(state.message)
    if (state?.error) toast.error(state.error)
  }, [state])

  return (
    <form action={formAction} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={preview} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Change avatar
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2 MB.</p>
        </div>
        <input
          ref={fileInputRef}
          name="avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setPreview(URL.createObjectURL(file))
          }}
        />
      </div>

      {/* Display name */}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          placeholder="Your name"
          className="max-w-sm"
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          readOnly
          disabled
          className="max-w-sm text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
