'use client'

import { useState, useMemo } from 'react'
import { Copy, CopyCheck, Regex as RegexIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Flag definitions ─────────────────────────────────────────────────────────
const FLAGS = [
  { key: 'g' as const, label: 'g', desc: 'global',     title: 'Global — find all matches' },
  { key: 'i' as const, label: 'i', desc: 'no case',    title: 'Case insensitive' },
  { key: 'm' as const, label: 'm', desc: 'multiline',  title: 'Multiline — ^ and $ match line boundaries' },
  { key: 's' as const, label: 's', desc: 'dot all',    title: 'Dot all — . matches newlines too' },
  { key: 'u' as const, label: 'u', desc: 'unicode',    title: 'Unicode mode' },
]

type FlagKey = 'g' | 'i' | 'm' | 's' | 'u'

// ── Match type ───────────────────────────────────────────────────────────────
interface MatchResult {
  value: string
  index: number
  end: number
  groups: (string | undefined)[]
  namedGroups: Record<string, string> | null
}

// ── Engine ───────────────────────────────────────────────────────────────────
function buildRegex(pattern: string, flags: Set<FlagKey>): { regex: RegExp | null; error: string | null } {
  if (!pattern) return { regex: null, error: null }
  try {
    return { regex: new RegExp(pattern, [...flags].join('')), error: null }
  } catch (e) {
    return { regex: null, error: (e as Error).message }
  }
}

function collectMatches(regex: RegExp | null, text: string): MatchResult[] {
  if (!regex || !text) return []
  const results: MatchResult[] = []
  const isGlobal = regex.flags.includes('g')

  if (isGlobal) {
    const r = new RegExp(regex.source, regex.flags)
    let m: RegExpExecArray | null
    while ((m = r.exec(text)) !== null) {
      results.push({
        value: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups: m.slice(1),
        namedGroups: m.groups ? { ...m.groups } : null,
      })
      if (m[0].length === 0) r.lastIndex++
    }
  } else {
    const m = regex.exec(text)
    if (m) {
      results.push({
        value: m[0],
        index: m.index,
        end: m.index + m[0].length,
        groups: m.slice(1),
        namedGroups: m.groups ? { ...m.groups } : null,
      })
    }
  }

  return results
}

// ── Highlighted preview ──────────────────────────────────────────────────────
function HighlightedText({ text, matches }: { text: string; matches: MatchResult[] }) {
  if (!text) {
    return <span className="text-muted-foreground/40">Test string will appear here with matches highlighted…</span>
  }

  if (!matches.length) {
    return <span>{text}</span>
  }

  const segments: { text: string; isMatch: boolean; matchIdx: number }[] = []
  let pos = 0

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    if (m.index > pos) {
      segments.push({ text: text.slice(pos, m.index), isMatch: false, matchIdx: -1 })
    }
    if (m.index >= pos) {
      segments.push({ text: m.value, isMatch: true, matchIdx: i })
      pos = m.end
    }
  }

  if (pos < text.length) {
    segments.push({ text: text.slice(pos), isMatch: false, matchIdx: -1 })
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.isMatch ? (
          <mark
            key={i}
            className="rounded bg-primary/25 text-primary not-italic"
            title={`Match ${seg.matchIdx + 1}`}
          >
            {seg.text || <span className="border-x-2 border-primary/60 text-primary">{'​'}</span>}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Set<FlagKey>>(new Set(['g']))
  const [testStr, setTestStr] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const toggleFlag = (flag: FlagKey) => {
    setFlags((prev) => {
      const next = new Set(prev)
      next.has(flag) ? next.delete(flag) : next.add(flag)
      return next
    })
  }

  const { regex, error } = useMemo(() => buildRegex(pattern, flags), [pattern, flags])
  const matches = useMemo(() => collectMatches(regex, testStr), [regex, testStr])

  const copyMatch = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    toast.success('Copied')
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      {/* Pattern bar */}
      <div className="shrink-0">
        <div
          className={cn(
            'flex items-stretch overflow-hidden rounded-xl border bg-card transition-colors focus-within:ring-2 focus-within:ring-primary/30',
            error ? 'border-red-400/60' : 'border-border'
          )}
        >
          {/* Opening delimiter */}
          <span className="flex items-center border-r border-border px-3 font-mono text-lg text-muted-foreground/50 select-none">
            /
          </span>

          {/* Pattern input */}
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="enter pattern"
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent px-3 py-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/35"
          />

          {/* Closing delimiter */}
          <span className="flex items-center border-l border-border px-1 font-mono text-lg text-muted-foreground/50 select-none">
            /
          </span>

          {/* Flag toggles */}
          <div className="flex items-center gap-0.5 border-l border-border px-2">
            {FLAGS.map(({ key, label, desc, title }) => (
              <button
                key={key}
                onClick={() => toggleFlag(key)}
                title={title}
                className={cn(
                  'flex flex-col items-center justify-center rounded px-2 py-1 transition-colors',
                  flags.has(key)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground/45 hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="font-mono text-xs font-bold leading-none">{label}</span>
                <span className="mt-0.5 text-[8px] leading-none opacity-70">{desc}</span>
              </button>
            ))}
          </div>

          {/* Match count badge */}
          <div className="flex items-center border-l border-border px-3">
            {error ? (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                error
              </span>
            ) : pattern ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  matches.length > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/40">no pattern</span>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-red-500">{error}</p>
        )}
      </div>

      {/* Two-panel main area */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">

        {/* Left: test string + highlighted preview */}
        <div className="flex min-h-0 flex-col gap-3">
          <div className="shrink-0">
            <label className="mb-1.5 block text-sm font-medium text-foreground">Test String</label>
            <textarea
              value={testStr}
              onChange={(e) => setTestStr(e.target.value)}
              placeholder="Paste or type your test string here…"
              rows={8}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">Highlighted Preview</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-auto">
              <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground">
                <HighlightedText text={testStr} matches={matches} />
              </pre>
            </CardContent>
          </Card>
        </div>

        {/* Right: match list */}
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader className="shrink-0 py-3">
            <CardTitle className="text-sm font-semibold">
              {matches.length > 0
                ? `${matches.length} Match${matches.length > 1 ? 'es' : ''}`
                : 'Matches'}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-auto p-0">
            {!pattern ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                <RegexIcon className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">Enter a pattern to see matches</p>
                <p className="text-xs text-muted-foreground/60">Toggle flags on the right of the input bar</p>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <p className="text-sm text-red-500">Fix the pattern error to see matches</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <p className="text-sm text-muted-foreground">No matches in the test string</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {matches.map((m, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        {/* Match header */}
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <span className="truncate font-mono text-xs font-semibold text-foreground">
                            {m.value || (
                              <span className="italic text-muted-foreground">empty match</span>
                            )}
                          </span>
                        </div>

                        {/* Index range */}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          index {m.index}–{m.end}
                          <span className="ml-2 text-muted-foreground/50">
                            ({m.end - m.index} char{m.end - m.index !== 1 ? 's' : ''})
                          </span>
                        </span>

                        {/* Numbered capture groups */}
                        {m.groups.length > 0 && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {m.groups.map((g, gi) => (
                              <span
                                key={gi}
                                className="rounded border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]"
                              >
                                <span className="text-muted-foreground">${ gi + 1}:</span>{' '}
                                <span className="text-foreground">
                                  {g !== undefined ? g : <span className="italic text-muted-foreground/60">undefined</span>}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Named capture groups */}
                        {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(m.namedGroups).map(([name, val]) => (
                              <span
                                key={name}
                                className="rounded border border-primary/30 bg-primary/5 px-1.5 py-0.5 font-mono text-[10px]"
                              >
                                <span className="text-muted-foreground">{name}:</span>{' '}
                                <span className="text-foreground">{val}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Copy button */}
                      <button
                        onClick={() => copyMatch(m.value, i)}
                        className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title="Copy match value"
                      >
                        {copiedIdx === i
                          ? <CopyCheck className="h-3.5 w-3.5 text-primary" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
