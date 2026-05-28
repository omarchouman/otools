'use client'

import { useState, useMemo } from 'react'
import { Copy, CopyCheck, ShieldCheck, ShieldAlert, ShieldOff, Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── JWT parsing ──────────────────────────────────────────────────────────────
function decodeBase64Url(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return atob(padded)
}

function parsePart(part: string): Record<string, unknown> | null {
  try {
    return JSON.parse(decodeBase64Url(part))
  } catch {
    return null
  }
}

interface ParsedJWT {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

function parseJWT(token: string): ParsedJWT | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null
  const header = parsePart(parts[0])
  const payload = parsePart(parts[1])
  if (!header || !payload) return null
  return { header, payload, signature: parts[2] }
}

// ── Time helpers ─────────────────────────────────────────────────────────────
function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function relative(ts: number): string {
  const diff = Math.floor(Date.now() / 1000 - ts)
  const abs = Math.abs(diff)
  const str =
    abs < 60 ? `${abs}s` :
    abs < 3600 ? `${Math.floor(abs / 60)}m` :
    abs < 86400 ? `${Math.floor(abs / 3600)}h` :
    `${Math.floor(abs / 86400)}d`
  return diff < 0 ? `in ${str}` : `${str} ago`
}

// ── Syntax highlighting (XSS-safe) ───────────────────────────────────────────
function highlight(obj: Record<string, unknown>): string {
  const json = JSON.stringify(obj, null, 2)
  const safe = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return safe.replace(
    /("(?:[^"\\]|\\.)*"\s*:?|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|true|false|null)/g,
    (match) => {
      const isKey = match.trimEnd().endsWith(':')
      if (isKey) return `<span style="color:inherit;font-weight:600">${match}</span>`
      if (match.startsWith('"')) return `<span style="color:oklch(0.52_0.17_148)">${match}</span>`
      if (match === 'true')  return `<span style="color:oklch(0.55_0.16_148)">${match}</span>`
      if (match === 'false') return `<span style="color:oklch(0.58_0.22_25)">${match}</span>`
      if (match === 'null')  return `<span style="color:oklch(0.55_0.04_148)">${match}</span>`
      return `<span style="color:oklch(0.50_0.15_258)">${match}</span>`
    }
  )
}

// ── Token status ─────────────────────────────────────────────────────────────
type Status = 'valid' | 'expired' | 'not-yet-valid' | 'no-expiry'

function getStatus(payload: Record<string, unknown>): Status {
  const now = Date.now() / 1000
  const exp = typeof payload.exp === 'number' ? payload.exp : null
  const nbf = typeof payload.nbf === 'number' ? payload.nbf : null
  if (exp && now > exp) return 'expired'
  if (nbf && now < nbf) return 'not-yet-valid'
  if (exp) return 'valid'
  return 'no-expiry'
}

// ── Sub-components ────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(`${label} copied`)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? <CopyCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : label}
    </button>
  )
}

function JsonCard({
  title,
  data,
  extra,
}: {
  title: string
  data: Record<string, unknown>
  extra?: React.ReactNode
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <CopyBtn text={JSON.stringify(data, null, 2)} label={title} />
      </CardHeader>
      {extra}
      <CardContent className="min-h-0 flex-1 overflow-auto p-0">
        <pre
          className="p-4 text-[11px] leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: highlight(data) }}
        />
      </CardContent>
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function JWTDecoderPage() {
  const [input, setInput] = useState('')
  const [copiedSig, setCopiedSig] = useState(false)

  const parsed = useMemo(() => {
    if (!input.trim()) return null
    return parseJWT(input)
  }, [input])

  const isInvalid = input.trim().length > 0 && !parsed

  const status = parsed ? getStatus(parsed.payload) : null
  const exp = parsed && typeof parsed.payload.exp === 'number' ? parsed.payload.exp : null
  const iat = parsed && typeof parsed.payload.iat === 'number' ? parsed.payload.iat : null
  const alg = parsed ? String(parsed.header.alg ?? '—') : null

  const copySignature = async () => {
    if (!parsed) return
    await navigator.clipboard.writeText(parsed.signature)
    setCopiedSig(true)
    toast.success('Signature copied')
    setTimeout(() => setCopiedSig(false), 2000)
  }

  const statusConfig = {
    valid: { icon: ShieldCheck, label: 'Valid', cls: 'text-primary bg-primary/10 border-primary/30' },
    expired: { icon: ShieldAlert, label: 'Expired', cls: 'text-red-500 bg-red-500/10 border-red-500/30' },
    'not-yet-valid': { icon: ShieldAlert, label: 'Not yet valid', cls: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
    'no-expiry': { icon: ShieldOff, label: 'No expiry', cls: 'text-muted-foreground bg-muted/60 border-border' },
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      {/* Input */}
      <div className="shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">JWT Token</label>
          {input && (
            <button
              onClick={() => setInput('')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your JWT token here — eyJhbGciOiJIUzI1NiJ9..."
          rows={4}
          spellCheck={false}
          className={cn(
            'w-full resize-none rounded-xl border bg-card p-4 font-mono text-xs leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/30',
            isInvalid ? 'border-red-400/60' : 'border-border'
          )}
        />
        {isInvalid && (
          <p className="mt-1.5 text-xs text-red-500">
            Invalid JWT — token must have three base64url parts separated by dots.
          </p>
        )}
      </div>

      {/* Token info bar */}
      {parsed && status && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {/* Status */}
          {(() => {
            const { icon: Icon, label, cls } = statusConfig[status]
            return (
              <span className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', cls)}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            )
          })()}

          {/* Algorithm */}
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-mono font-medium text-foreground">
            <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
            {alg}
          </span>

          {/* Expiry */}
          {exp && (
            <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              Expires: <span className="font-medium text-foreground">{formatDate(exp)}</span>
              <span className="ml-1 text-muted-foreground/70">({relative(exp)})</span>
            </span>
          )}

          {/* Issued at */}
          {iat && (
            <span className="rounded-full border border-border bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
              Issued: <span className="font-medium text-foreground">{formatDate(iat)}</span>
              <span className="ml-1 text-muted-foreground/70">({relative(iat)})</span>
            </span>
          )}
        </div>
      )}

      {/* Three panels */}
      {parsed ? (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          {/* Header */}
          <JsonCard title="Header" data={parsed.header} />

          {/* Payload */}
          <JsonCard title="Payload" data={parsed.payload} />

          {/* Signature */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-semibold">Signature</CardTitle>
              <button
                onClick={copySignature}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copiedSig ? <CopyCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedSig ? 'Copied' : 'Copy'}
              </button>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 overflow-auto">
              <p className="break-all rounded-lg bg-muted/40 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {parsed.signature}
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                The signature cannot be verified without the secret key. Paste the token into jwt.io for full verification.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
              <ShieldCheck className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Paste a JWT above to inspect it</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Header, payload, and signature will appear here</p>
          </div>
        </div>
      )}
    </div>
  )
}
