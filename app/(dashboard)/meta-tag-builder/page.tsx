'use client'

import { useState } from 'react'
import { Copy, CopyCheck, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Fields {
  title:       string
  description: string
  url:         string
  siteName:    string
  ogImage:     string
  ogType:      string
  twitterCard: string
  twitterSite: string
  robots:      string
}

const EMPTY: Fields = {
  title: '', description: '', url: '', siteName: '',
  ogImage: '', ogType: 'website', twitterCard: 'summary_large_image',
  twitterSite: '', robots: 'index, follow',
}

// ── HTML generator ────────────────────────────────────────────────────────────
function buildTags(f: Fields): string {
  const lines: string[] = []
  const e = (s: string) => s.replace(/"/g, '&quot;')

  if (f.title)       lines.push(`<title>${f.title}</title>`)
  if (f.description) lines.push(`<meta name="description" content="${e(f.description)}">`)
  if (f.robots)      lines.push(`<meta name="robots" content="${e(f.robots)}">`)
  if (f.url)         lines.push(`<link rel="canonical" href="${e(f.url)}">`)

  lines.push('')
  if (f.title)       lines.push(`<meta property="og:title" content="${e(f.title)}">`)
  if (f.description) lines.push(`<meta property="og:description" content="${e(f.description)}">`)
  if (f.ogType)      lines.push(`<meta property="og:type" content="${e(f.ogType)}">`)
  if (f.url)         lines.push(`<meta property="og:url" content="${e(f.url)}">`)
  if (f.siteName)    lines.push(`<meta property="og:site_name" content="${e(f.siteName)}">`)
  if (f.ogImage)     lines.push(`<meta property="og:image" content="${e(f.ogImage)}">`)

  lines.push('')
  lines.push(`<meta name="twitter:card" content="${e(f.twitterCard)}">`)
  if (f.title)       lines.push(`<meta name="twitter:title" content="${e(f.title)}">`)
  if (f.description) lines.push(`<meta name="twitter:description" content="${e(f.description)}">`)
  if (f.ogImage)     lines.push(`<meta name="twitter:image" content="${e(f.ogImage)}">`)
  if (f.twitterSite) lines.push(`<meta name="twitter:site" content="${e(f.twitterSite.startsWith('@') ? f.twitterSite : '@' + f.twitterSite)}">`)

  return lines.join('\n')
}

// ── Character counter ─────────────────────────────────────────────────────────
function CharCount({ value, optimal, max }: { value: string; optimal: number; max: number }) {
  const n = value.length
  const color = n === 0 ? 'text-muted-foreground/40'
              : n <= optimal ? 'text-green-600 dark:text-green-400'
              : n <= max ? 'text-orange-500'
              : 'text-red-500'
  return (
    <span className={cn('tabular-nums text-[10px]', color)}>
      {n} / {max}
    </span>
  )
}

// ── Google search preview ─────────────────────────────────────────────────────
function GooglePreview({ title, url, description }: { title: string; url: string; description: string }) {
  const displayUrl = url || 'https://example.com'
  const displayTitle = title || 'Your Page Title'
  const displayDesc  = description || 'Your page description will appear here. Keep it under 160 characters for best results in search.'

  let domain = displayUrl
  try { domain = new URL(displayUrl).hostname } catch { /* use as-is */ }

  return (
    <div className="rounded-xl border border-border bg-card p-5 font-sans">
      <div className="mb-1 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px]">G</div>
        <div>
          <p className="text-[11px] font-medium leading-none text-foreground">{domain}</p>
          <p className="text-[10px] text-muted-foreground">{displayUrl}</p>
        </div>
      </div>
      <p
        className={cn(
          'text-lg font-medium leading-snug',
          title ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/40'
        )}
        style={{ maxWidth: 600 }}
      >
        {displayTitle.length > 60 ? displayTitle.slice(0, 60) + '…' : displayTitle}
      </p>
      {title.length > 60 && (
        <p className="mt-0.5 text-[10px] text-orange-500">Title may be truncated ({title.length}/60)</p>
      )}
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground" style={{ maxWidth: 600 }}>
        {displayDesc}
      </p>
      {description.length > 160 && (
        <p className="mt-0.5 text-[10px] text-orange-500">Description may be truncated ({description.length}/160)</p>
      )}
    </div>
  )
}

// ── Social card preview ───────────────────────────────────────────────────────
function SocialCardPreview({ title, description, ogImage, siteName, url }: {
  title: string; description: string; ogImage: string; siteName: string; url: string
}) {
  const [imgError, setImgError] = useState(false)
  const domain = (() => { try { return new URL(url || 'https://example.com').hostname } catch { return 'example.com' } })()

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card font-sans">
      {/* Image area */}
      {ogImage && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ogImage}
          alt=""
          className="h-48 w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-muted/60">
          <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
        </div>
      )}
      {/* Card body */}
      <div className="border-t border-border bg-muted/20 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {siteName || domain}
        </p>
        <p className={cn('mt-0.5 text-sm font-semibold leading-snug', !title && 'text-muted-foreground/40')}>
          {title || 'Your Page Title'}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground">
          {description || 'Your description will appear here.'}
        </p>
      </div>
    </div>
  )
}

// ── Fieldset wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{title}</p>
      {children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function MetaTagBuilderPage() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [tab, setTab]       = useState<'google' | 'social'>('google')
  const [copied, setCopied] = useState(false)

  const set = (key: keyof Fields, val: string) =>
    setFields((f) => ({ ...f, [key]: val }))

  const html = buildTags(fields)

  const copy = async () => {
    await navigator.clipboard.writeText(html)
    setCopied(true)
    toast.success('Meta tags copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full gap-6 p-6">

      {/* ── Left: form ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">

        <Section title="Page Details">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title</Label>
              <CharCount value={fields.title} optimal={60} max={70} />
            </div>
            <Input
              id="title"
              value={fields.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="My Awesome Page"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <CharCount value={fields.description} optimal={160} max={200} />
            </div>
            <textarea
              id="description"
              value={fields.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="A short summary of your page content. Keep it under 160 characters."
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="url">Canonical URL</Label>
              <Input id="url" type="url" value={fields.url} onChange={(e) => set('url', e.target.value)} placeholder="https://example.com/page" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" value={fields.siteName} onChange={(e) => set('siteName', e.target.value)} placeholder="My Site" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="robots">Robots</Label>
            <select
              id="robots"
              value={fields.robots}
              onChange={(e) => set('robots', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="index, follow">index, follow (default)</option>
              <option value="noindex, follow">noindex, follow</option>
              <option value="index, nofollow">index, nofollow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
            </select>
          </div>
        </Section>

        <Section title="Open Graph (Facebook, LinkedIn)">
          <div className="space-y-1.5">
            <Label htmlFor="ogImage">Image URL</Label>
            <Input id="ogImage" type="url" value={fields.ogImage} onChange={(e) => set('ogImage', e.target.value)} placeholder="https://example.com/og-image.jpg" />
            <p className="text-[10px] text-muted-foreground">Recommended: 1200×630px. Used by Facebook, LinkedIn, and Twitter.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ogType">Type</Label>
            <select
              id="ogType"
              value={fields.ogType}
              onChange={(e) => set('ogType', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="website">website</option>
              <option value="article">article</option>
              <option value="product">product</option>
              <option value="profile">profile</option>
              <option value="video">video</option>
            </select>
          </div>
        </Section>

        <Section title="Twitter / X">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="twitterCard">Card Type</Label>
              <select
                id="twitterCard"
                value={fields.twitterCard}
                onChange={(e) => set('twitterCard', e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="summary_large_image">summary_large_image</option>
                <option value="summary">summary</option>
                <option value="app">app</option>
                <option value="player">player</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitterSite">@handle</Label>
              <Input id="twitterSite" value={fields.twitterSite} onChange={(e) => set('twitterSite', e.target.value)} placeholder="@yourhandle" />
            </div>
          </div>
        </Section>
      </div>

      {/* ── Right: preview + output ── */}
      <div className="flex w-96 shrink-0 flex-col gap-4">

        {/* Preview tabs */}
        <div>
          <div className="mb-3 flex gap-1 rounded-lg border border-border bg-card p-0.5">
            {(['google', 'social'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors',
                  tab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t === 'google' ? 'Google' : 'Social Card'}
              </button>
            ))}
          </div>
          {tab === 'google'
            ? <GooglePreview title={fields.title} url={fields.url} description={fields.description} />
            : <SocialCardPreview title={fields.title} description={fields.description} ogImage={fields.ogImage} siteName={fields.siteName} url={fields.url} />
          }
        </div>

        {/* Generated HTML */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-xs font-semibold text-foreground">Generated HTML</span>
            <button
              onClick={copy}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                copied ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[10px] leading-relaxed text-muted-foreground">
            {html || '<!-- Fill in the form to generate tags -->'}
          </pre>
        </div>
      </div>
    </div>
  )
}
