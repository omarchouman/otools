'use client'

import { useState, useMemo } from 'react'
import { Copy, CopyCheck, Link2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Google Ads',     source: 'google',     medium: 'cpc'     },
  { label: 'Google Organic', source: 'google',     medium: 'organic' },
  { label: 'Facebook',       source: 'facebook',   medium: 'social'  },
  { label: 'Instagram',      source: 'instagram',  medium: 'social'  },
  { label: 'Twitter / X',    source: 'twitter',    medium: 'social'  },
  { label: 'LinkedIn',       source: 'linkedin',   medium: 'social'  },
  { label: 'Email',          source: 'newsletter', medium: 'email'   },
  { label: 'YouTube',        source: 'youtube',    medium: 'video'   },
]

// ── URL builder ───────────────────────────────────────────────────────────────
interface Fields {
  url:      string
  source:   string
  medium:   string
  campaign: string
  term:     string
  content:  string
}

function buildUrl(f: Fields): string | null {
  if (!f.url.trim() || !f.source.trim() || !f.medium.trim() || !f.campaign.trim()) return null
  try {
    const u = new URL(f.url.trim())
    u.searchParams.set('utm_source',   f.source.trim())
    u.searchParams.set('utm_medium',   f.medium.trim())
    u.searchParams.set('utm_campaign', f.campaign.trim())
    if (f.term.trim())    u.searchParams.set('utm_term',    f.term.trim())
    if (f.content.trim()) u.searchParams.set('utm_content', f.content.trim())
    return u.toString()
  } catch {
    return null
  }
}

function isValidUrl(s: string): boolean {
  try { new URL(s); return true } catch { return false }
}

// ── UTM param pills for the preview ──────────────────────────────────────────
const PARAM_COLORS: Record<string, string> = {
  utm_source:   'bg-primary/10 text-primary border-primary/20',
  utm_medium:   'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  utm_campaign: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20',
  utm_term:     'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  utm_content:  'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
}

// ── Page ──────────────────────────────────────────────────────────────────────
const EMPTY: Fields = { url: '', source: '', medium: '', campaign: '', term: '', content: '' }

export default function UTMBuilderPage() {
  const [fields, setFields] = useState<Fields>(EMPTY)
  const [copied, setCopied] = useState(false)

  const set = (key: keyof Fields, val: string) =>
    setFields((f) => ({ ...f, [key]: val }))

  const applyPreset = (source: string, medium: string) =>
    setFields((f) => ({ ...f, source, medium }))

  const generatedUrl = useMemo(() => buildUrl(fields), [fields])

  const urlValid  = !fields.url.trim() || isValidUrl(fields.url.trim())
  const hasRequired = fields.url.trim() && fields.source.trim() && fields.medium.trim() && fields.campaign.trim()

  const copy = async () => {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    toast.success('UTM URL copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => setFields(EMPTY)

  // Params for the breakdown display
  const paramEntries = generatedUrl
    ? (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const)
        .map((k) => ({ key: k, value: fields[k.replace('utm_', '') as keyof Fields] }))
        .filter((e) => e.value.trim())
    : []

  return (
    <div className="flex h-full gap-6 p-6">

      {/* ── Left: form ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">

        {/* Base URL */}
        <div className="space-y-1.5">
          <Label htmlFor="url">Website URL <span className="text-red-500">*</span></Label>
          <Input
            id="url"
            type="url"
            value={fields.url}
            onChange={(e) => set('url', e.target.value)}
            placeholder="https://example.com/landing-page"
            className={cn(!urlValid && 'border-red-400/60')}
          />
          {!urlValid && (
            <p className="text-xs text-red-500">Enter a valid URL starting with https://</p>
          )}
        </div>

        {/* Presets */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Quick presets</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(({ label, source, medium }) => {
              const active = fields.source === source && fields.medium === medium
              return (
                <button
                  key={label}
                  onClick={() => applyPreset(source, medium)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Source + Medium */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="source">
              utm_source <span className="text-red-500">*</span>
            </Label>
            <Input
              id="source"
              value={fields.source}
              onChange={(e) => set('source', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="google"
            />
            <p className="text-[10px] text-muted-foreground">Where traffic comes from</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medium">
              utm_medium <span className="text-red-500">*</span>
            </Label>
            <Input
              id="medium"
              value={fields.medium}
              onChange={(e) => set('medium', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="cpc"
            />
            <p className="text-[10px] text-muted-foreground">Marketing channel type</p>
          </div>
        </div>

        {/* Campaign */}
        <div className="space-y-1.5">
          <Label htmlFor="campaign">
            utm_campaign <span className="text-red-500">*</span>
          </Label>
          <Input
            id="campaign"
            value={fields.campaign}
            onChange={(e) => set('campaign', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="spring-sale-2025"
          />
          <p className="text-[10px] text-muted-foreground">Name of the campaign — spaces become hyphens automatically</p>
        </div>

        {/* Term + Content */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="term" className="text-muted-foreground">
              utm_term <span className="text-[10px] font-normal">(optional)</span>
            </Label>
            <Input
              id="term"
              value={fields.term}
              onChange={(e) => set('term', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="running-shoes"
            />
            <p className="text-[10px] text-muted-foreground">Paid search keywords</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-muted-foreground">
              utm_content <span className="text-[10px] font-normal">(optional)</span>
            </Label>
            <Input
              id="content"
              value={fields.content}
              onChange={(e) => set('content', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="hero-banner"
            />
            <p className="text-[10px] text-muted-foreground">Differentiates ads or links</p>
          </div>
        </div>

        {/* Reset */}
        {Object.values(fields).some(Boolean) && (
          <button
            onClick={reset}
            className="self-start text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Right: output ── */}
      <div className="flex w-80 shrink-0 flex-col gap-4">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 py-3">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Generated URL</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {!hasRequired ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
                <Link2 className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">Fill in URL, source, medium, and campaign to generate your link</p>
              </div>
            ) : generatedUrl ? (
              <>
                {/* URL display */}
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <p className="break-all font-mono text-[10px] leading-relaxed text-foreground">
                    {generatedUrl}
                  </p>
                </div>

                {/* Copy + open */}
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-colors',
                      copied
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border bg-card text-foreground hover:bg-muted'
                    )}
                  >
                    {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                  <a
                    href={generatedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg border border-border bg-card px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* URL length */}
                <p className={cn(
                  'text-[10px] tabular-nums',
                  generatedUrl.length > 2000 ? 'text-orange-500' : 'text-muted-foreground/60'
                )}>
                  {generatedUrl.length} characters
                  {generatedUrl.length > 2000 && ' — may be truncated in some tools'}
                </p>

                {/* Param breakdown */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    Parameters
                  </p>
                  {paramEntries.map(({ key, value }) => (
                    <div key={key} className="flex items-start gap-2">
                      <span className={cn(
                        'shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold',
                        PARAM_COLORS[key]
                      )}>
                        {key}
                      </span>
                      <span className="min-w-0 break-all font-mono text-[10px] text-muted-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-red-500">Fix the URL to generate a valid link.</p>
            )}
          </CardContent>
        </Card>

        {/* Reference card */}
        <Card>
          <CardContent className="p-4 text-[10px] leading-relaxed text-muted-foreground space-y-1.5">
            <p className="font-semibold text-foreground">UTM quick reference</p>
            <p><span className="font-mono text-primary">source</span> — who sends traffic (google, newsletter)</p>
            <p><span className="font-mono text-emerald-600 dark:text-emerald-400">medium</span> — the channel (cpc, email, social)</p>
            <p><span className="font-mono text-teal-600 dark:text-teal-400">campaign</span> — campaign name (spring-sale)</p>
            <p><span className="font-mono text-green-600 dark:text-green-400">term</span> — paid keyword (optional)</p>
            <p><span className="font-mono text-cyan-600 dark:text-cyan-400">content</span> — ad variant (optional)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
