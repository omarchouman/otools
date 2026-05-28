'use client'

import { useState, useMemo } from 'react'
import { Copy, CopyCheck, GitCompareArrows } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Diff types ────────────────────────────────────────────────────────────────
type DiffLine =
  | { type: 'equal';  line: string; leftNum: number; rightNum: number }
  | { type: 'insert'; line: string; rightNum: number }
  | { type: 'delete'; line: string; leftNum: number }

// ── LCS diff ──────────────────────────────────────────────────────────────────
function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const m = oldLines.length
  const n = newLines.length

  // Build DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = []
  let i = m, j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'equal', line: oldLines[i - 1], leftNum: i, rightNum: j })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', line: newLines[j - 1], rightNum: j })
      j--
    } else {
      result.unshift({ type: 'delete', line: oldLines[i - 1], leftNum: i })
      i--
    }
  }
  return result
}

function diffToText(lines: DiffLine[]): string {
  return lines
    .map((l) => (l.type === 'insert' ? `+ ${l.line}` : l.type === 'delete' ? `- ${l.line}` : `  ${l.line}`))
    .join('\n')
}

// ── Page ──────────────────────────────────────────────────────────────────────
const MAX_LINES = 1500

export default function DiffViewerPage() {
  const [original, setOriginal] = useState('')
  const [modified, setModified] = useState('')
  const [copied, setCopied]     = useState(false)

  const { diffLines, tooLarge } = useMemo(() => {
    const oldLines = original.split('\n')
    const newLines = modified.split('\n')
    if (oldLines.length + newLines.length > MAX_LINES) {
      return { diffLines: [], tooLarge: true }
    }
    return { diffLines: computeDiff(oldLines, newLines), tooLarge: false }
  }, [original, modified])

  const stats = useMemo(() => ({
    added:     diffLines.filter((l) => l.type === 'insert').length,
    deleted:   diffLines.filter((l) => l.type === 'delete').length,
    unchanged: diffLines.filter((l) => l.type === 'equal').length,
  }), [diffLines])

  const copyDiff = async () => {
    await navigator.clipboard.writeText(diffToText(diffLines))
    setCopied(true)
    toast.success('Diff copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const hasInput   = original || modified
  const hasChanges = stats.added > 0 || stats.deleted > 0

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      {/* Two input textareas */}
      <div className="grid shrink-0 grid-cols-2 gap-4">
        {[
          { label: 'Original', value: original, set: setOriginal, placeholder: 'Paste original text here…' },
          { label: 'Modified', value: modified, set: setModified, placeholder: 'Paste modified text here…' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{label}</label>
              {value && (
                <button
                  onClick={() => set('')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              rows={8}
              spellCheck={false}
              className="w-full resize-none rounded-xl border border-border bg-card p-4 font-mono text-xs leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>

      {/* Diff output */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">

        {/* Stats / toolbar */}
        {hasInput && !tooLarge && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-3 text-xs">
              {stats.added > 0 && (
                <span className="font-semibold text-green-600 dark:text-green-400">
                  +{stats.added} addition{stats.added !== 1 ? 's' : ''}
                </span>
              )}
              {stats.deleted > 0 && (
                <span className="font-semibold text-red-500">
                  −{stats.deleted} deletion{stats.deleted !== 1 ? 's' : ''}
                </span>
              )}
              {!hasChanges && (
                <span className="text-muted-foreground">Files are identical</span>
              )}
              {hasChanges && stats.unchanged > 0 && (
                <span className="text-muted-foreground">{stats.unchanged} unchanged</span>
              )}
            </div>

            <button
              onClick={copyDiff}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <CopyCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy diff'}
            </button>
          </div>
        )}

        <CardContent className="min-h-0 flex-1 overflow-auto p-0">
          {!hasInput ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <GitCompareArrows className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Paste text in both fields to see the diff</p>
              <p className="text-xs text-muted-foreground/60">Line-by-line comparison with added and removed highlighting</p>
            </div>
          ) : tooLarge ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Input too large — keep both sides under {MAX_LINES} lines combined.
              </p>
            </div>
          ) : (
            <div className="font-mono text-xs">
              {diffLines.map((dl, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex items-stretch border-b border-transparent',
                    dl.type === 'insert' && 'bg-green-500/8 dark:bg-green-500/12',
                    dl.type === 'delete' && 'bg-red-500/8 dark:bg-red-500/12',
                  )}
                >
                  {/* Left (original) line number */}
                  <span
                    className={cn(
                      'flex w-11 shrink-0 items-center justify-end border-r px-2 text-[10px] leading-5 select-none tabular-nums',
                      dl.type === 'delete'
                        ? 'border-red-300/40 bg-red-500/5 text-red-500/60 dark:border-red-500/20'
                        : dl.type === 'insert'
                        ? 'border-border bg-green-500/5 text-transparent'
                        : 'border-border text-muted-foreground/35'
                    )}
                  >
                    {dl.type !== 'insert' ? dl.leftNum : ''}
                  </span>

                  {/* Right (modified) line number */}
                  <span
                    className={cn(
                      'flex w-11 shrink-0 items-center justify-end border-r px-2 text-[10px] leading-5 select-none tabular-nums',
                      dl.type === 'insert'
                        ? 'border-green-300/40 bg-green-500/5 text-green-600/60 dark:border-green-500/20 dark:text-green-400/60'
                        : dl.type === 'delete'
                        ? 'border-border bg-red-500/5 text-transparent'
                        : 'border-border text-muted-foreground/35'
                    )}
                  >
                    {dl.type !== 'delete' ? dl.rightNum : ''}
                  </span>

                  {/* +/− marker */}
                  <span
                    className={cn(
                      'flex w-7 shrink-0 items-center justify-center text-[11px] font-bold leading-5 select-none',
                      dl.type === 'insert' && 'text-green-600 dark:text-green-400',
                      dl.type === 'delete' && 'text-red-500',
                      dl.type === 'equal'  && 'text-muted-foreground/20',
                    )}
                  >
                    {dl.type === 'insert' ? '+' : dl.type === 'delete' ? '−' : ' '}
                  </span>

                  {/* Line content */}
                  <span
                    className={cn(
                      'min-w-0 flex-1 whitespace-pre py-0.5 pl-1 pr-6 leading-5',
                      dl.type === 'insert' && 'text-green-700 dark:text-green-300',
                      dl.type === 'delete' && 'text-red-600 dark:text-red-400',
                      dl.type === 'equal'  && 'text-foreground/70',
                    )}
                  >
                    {dl.line || ' '}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
