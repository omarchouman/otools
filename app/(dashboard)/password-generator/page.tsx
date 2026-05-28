'use client'

import { useState, useCallback } from 'react'
import { Copy, RefreshCw, CopyCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Character sets ──────────────────────────────────────────────────────────
const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const

const AMBIGUOUS = new Set('O0Il1|B8S5Z2')

// ── Types ───────────────────────────────────────────────────────────────────
interface Options {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
  count: number
}

interface Strength {
  label: string
  score: number
  textColor: string
  barColor: string
}

// ── Engine ──────────────────────────────────────────────────────────────────
function buildCharset(opts: Options): string {
  let chars = ''
  if (opts.uppercase) chars += CHARSET.uppercase
  if (opts.lowercase) chars += CHARSET.lowercase
  if (opts.numbers) chars += CHARSET.numbers
  if (opts.symbols) chars += CHARSET.symbols
  if (opts.excludeAmbiguous) {
    chars = chars.split('').filter((c) => !AMBIGUOUS.has(c)).join('')
  }
  return chars
}

function generatePassword(charset: string, length: number): string {
  if (!charset) return ''
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => charset[n % charset.length]).join('')
}

function calculateStrength(charsetSize: number, length: number): Strength {
  if (charsetSize === 0) {
    return { label: 'Invalid', score: 0, textColor: 'text-destructive', barColor: 'bg-destructive' }
  }
  const entropy = length * Math.log2(charsetSize)
  if (entropy < 40)  return { label: 'Weak',        score: 1, textColor: 'text-red-500',    barColor: 'bg-red-500' }
  if (entropy < 60)  return { label: 'Fair',        score: 2, textColor: 'text-orange-500', barColor: 'bg-orange-500' }
  if (entropy < 80)  return { label: 'Good',        score: 3, textColor: 'text-yellow-500', barColor: 'bg-yellow-500' }
  if (entropy < 100) return { label: 'Strong',      score: 4, textColor: 'text-primary',    barColor: 'bg-primary' }
  return               { label: 'Very Strong', score: 5, textColor: 'text-primary',    barColor: 'bg-primary' }
}

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_OPTS: Options = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: false,
  excludeAmbiguous: false,
  count: 1,
}

const CHAR_TOGGLES = [
  { key: 'uppercase' as const, label: 'A–Z', sublabel: 'Uppercase' },
  { key: 'lowercase' as const, label: 'a–z', sublabel: 'Lowercase' },
  { key: 'numbers'  as const, label: '0–9', sublabel: 'Numbers' },
  { key: 'symbols'  as const, label: '!@#', sublabel: 'Symbols' },
]

// ── Page ────────────────────────────────────────────────────────────────────
export default function PasswordGeneratorPage() {
  const [opts, setOpts] = useState<Options>(DEFAULT_OPTS)
  const [passwords, setPasswords] = useState<string[]>(() => {
    const charset = buildCharset(DEFAULT_OPTS)
    return [generatePassword(charset, DEFAULT_OPTS.length)]
  })
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const charset = buildCharset(opts)
  const strength = calculateStrength(charset.length, opts.length)
  const entropy = Math.round(opts.length * Math.log2(Math.max(charset.length, 1)))

  const generate = useCallback(() => {
    setPasswords(
      Array.from({ length: opts.count }, () => generatePassword(charset, opts.length))
    )
    setCopiedIdx(null)
  }, [opts, charset])

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const copyAll = async () => {
    await navigator.clipboard.writeText(passwords.join('\n'))
    toast.success(`Copied ${passwords.length} passwords`)
  }

  const setOpt = <K extends keyof Options>(key: K, value: Options[K]) =>
    setOpts((prev) => ({ ...prev, [key]: value }))

  const toggleOpt = (key: keyof Options) =>
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="flex h-full gap-6 p-6">

      {/* ── Left: Controls ─────────────────────────────────────────────── */}
      <Card className="w-72 shrink-0 self-start">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Length */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Length</Label>
              <span className="font-mono text-sm font-semibold text-primary">{opts.length}</span>
            </div>
            <input
              type="range"
              min={8}
              max={128}
              value={opts.length}
              onChange={(e) => setOpt('length', Number(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>8</span><span>128</span>
            </div>
          </div>

          <Separator />

          {/* Character types */}
          <div className="space-y-2">
            <Label>Character Types</Label>
            <div className="grid grid-cols-2 gap-2">
              {CHAR_TOGGLES.map(({ key, label, sublabel }) => (
                <button
                  key={key}
                  onClick={() => toggleOpt(key)}
                  className={cn(
                    'flex flex-col items-center rounded-xl border py-3 text-center transition-all',
                    opts[key]
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
                  )}
                >
                  <span className="font-mono text-sm font-bold">{label}</span>
                  <span className="mt-0.5 text-[10px]">{sublabel}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            <button
              onClick={() => toggleOpt('excludeAmbiguous')}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all',
                opts.excludeAmbiguous
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/20 hover:text-foreground'
              )}
            >
              <div className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all',
                opts.excludeAmbiguous ? 'border-primary bg-primary' : 'border-current opacity-40'
              )}>
                {opts.excludeAmbiguous && (
                  <svg viewBox="0 0 10 8" className="h-2.5 w-2.5 fill-none stroke-white stroke-2">
                    <polyline points="1,4 4,7 9,1" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-medium">Exclude ambiguous</p>
                <p className="text-[10px] text-muted-foreground">Removes 0, O, I, l, 1, |…</p>
              </div>
            </button>
          </div>

          <Separator />

          {/* Bulk count */}
          <div className="space-y-2">
            <Label htmlFor="count">Quantity</Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={50}
              value={opts.count}
              onChange={(e) =>
                setOpt('count', Math.min(50, Math.max(1, Number(e.target.value) || 1)))
              }
            />
            <p className="text-[10px] text-muted-foreground">Generate 1–50 passwords at once</p>
          </div>

          {charset.length === 0 && (
            <p className="text-xs text-destructive">Select at least one character type.</p>
          )}

          <Button onClick={generate} className="w-full gap-2" disabled={charset.length === 0}>
            <RefreshCw className="h-4 w-4" />
            Generate
          </Button>
        </CardContent>
      </Card>

      {/* ── Right: Output ──────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col">
        {opts.count === 1 ? (

          /* Single password */
          <Card className="flex-1">
            <CardContent className="flex h-full flex-col items-center justify-center gap-6 p-8">
              <div className="w-full rounded-2xl border bg-muted/30 p-6 text-center">
                <p className="break-all font-mono text-xl font-semibold tracking-widest">
                  {passwords[0]}
                </p>
              </div>

              {/* Strength meter */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Strength</span>
                  <span className={cn('font-semibold', strength.textColor)}>{strength.label}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', strength.barColor)}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
                <p className="text-right text-[10px] text-muted-foreground">{entropy} bits entropy</p>
              </div>

              <Button size="lg" className="gap-2" onClick={() => copy(passwords[0], 0)}>
                {copiedIdx === 0
                  ? <CopyCheck className="h-4 w-4" />
                  : <Copy className="h-4 w-4" />}
                {copiedIdx === 0 ? 'Copied!' : 'Copy password'}
              </Button>
            </CardContent>
          </Card>

        ) : (

          /* Bulk list */
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between py-3">
              <CardTitle className="text-sm font-medium">
                {passwords.length} passwords generated
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copy all
              </Button>
            </CardHeader>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-border">
                {passwords.map((pw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className="w-7 shrink-0 text-xs text-muted-foreground">{i + 1}</span>
                    <span className="flex-1 truncate font-mono text-sm">{pw}</span>
                    <button
                      onClick={() => copy(pw, i)}
                      className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {copiedIdx === i
                        ? <CopyCheck className="h-4 w-4 text-primary" />
                        : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

        )}
      </div>
    </div>
  )
}
