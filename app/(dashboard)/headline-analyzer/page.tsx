'use client'

import { useState, useMemo } from 'react'
import { Copy, CopyCheck, Megaphone } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Word lists ────────────────────────────────────────────────────────────────
const POWER_WORDS = new Set([
  'ultimate','essential','proven','secret','exclusive','free','instantly','new',
  'amazing','incredible','revolutionary','guaranteed','powerful','simple','effective',
  'complete','perfect','best','surprising','shocking','important','critical','special',
  'limited','rare','expert','breakthrough','winning','definitive','master','boost',
  'transform','unlock','discover','maximize','supercharge','achieve','crush','dominate',
  'skyrocket','accelerate','improve','optimize','fast','quick','easy','huge','massive',
  'tested','trusted','real','now','today','urgent','top','leading','advanced','bold',
  'smart','clever','brilliant','remarkable','extraordinary','sensational','unbelievable',
  'mindblowing','game-changing','life-changing','must-have','must-know','must-read',
  'effortless','foolproof','step-by-step','actionable','practical','valuable','hidden',
])

const POSITIVE_WORDS = new Set([
  'love','joy','happy','excited','inspired','motivated','confident','empowered',
  'successful','thrilling','wonderful','fantastic','brilliant','outstanding','celebrate',
  'beautiful','magical','cheerful','delightful','energized','passionate','fearless',
  'unstoppable','winning','grow','flourish','thrive','prosper','succeed','achieve',
  'gain','enjoy','benefit','reward','delight','engage','captivate','inspire',
])

const NEGATIVE_WORDS = new Set([
  'fear','avoid','mistake','fail','struggle','pain','problem','danger','risk',
  'warning','terrible','disaster','crisis','threat','losing','costly','fatal',
  'stop','never','worst','bad','broken','dead','dying','kill','destroy','hurt',
  'ruin','waste','loss','damage','wrong','fail','boring','dull','awful','ugly',
])

const STOP_WORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of','with','by',
  'from','as','is','was','are','were','be','been','have','has','had','do','does',
  'did','will','would','could','should','may','might','not','it','its','this',
  'that','these','those','he','she','they','we','you','i','me','my','your','our',
  'his','her','their','what','which','who','how','when','where','why','all',
  'just','more','also','can','get','use','very','much','even','out','up','if',
])

// ── Analysis types ────────────────────────────────────────────────────────────
type HeadlineType = 'List' | 'How-To' | 'Question' | 'Why' | 'What' | 'Command' | 'Statement'
type Sentiment    = 'Positive' | 'Negative' | 'Neutral'
type Grade        = 'Weak' | 'Fair' | 'Good' | 'Great' | 'Excellent'

const COMMAND_VERBS = new Set([
  'do','make','get','try','learn','discover','find','build','create','start',
  'stop','use','take','give','show','tell','write','read','watch','listen',
  'become','master','achieve','boost','grow','optimize','improve',
])

interface Analysis {
  score:        number
  grade:        Grade
  wordCount:    number
  charCount:    number
  type:         HeadlineType
  sentiment:    Sentiment
  powerWords:   string[]
  positiveWords: string[]
  negativeWords: string[]
  commonRatio:  number
  tips:         string[]
  breakdown: {
    wordCount:    number
    charCount:    number
    powerWords:   number
    sentiment:    number
    type:         number
    commonWords:  number
  }
}

// ── Analyzer ──────────────────────────────────────────────────────────────────
function analyze(headline: string): Analysis | null {
  const trimmed = headline.trim()
  if (!trimmed) return null

  const words     = trimmed.split(/\s+/)
  const wordCount = words.length
  const charCount = trimmed.length
  const lower     = words.map((w) => w.toLowerCase().replace(/[^a-z'-]/g, ''))

  // Categorize words
  const powerWords    = lower.filter((w) => POWER_WORDS.has(w))
  const positiveWords = lower.filter((w) => POSITIVE_WORDS.has(w))
  const negativeWords = lower.filter((w) => NEGATIVE_WORDS.has(w))
  const commonWords   = lower.filter((w) => STOP_WORDS.has(w))
  const commonRatio   = commonWords.length / Math.max(wordCount, 1)

  // Headline type
  const firstWord = lower[0] ?? ''
  const lowerFull = trimmed.toLowerCase()
  let type: HeadlineType = 'Statement'
  if (/^\d+\b/.test(trimmed) || /\b\d+\s+(ways|tips|reasons|steps|things|ideas|secrets|tricks|hacks|strategies|mistakes)\b/i.test(trimmed)) {
    type = 'List'
  } else if (/\bhow\s+to\b/i.test(lowerFull) || /\bhow\s+(you|i|we)\b/i.test(lowerFull)) {
    type = 'How-To'
  } else if (trimmed.endsWith('?')) {
    type = 'Question'
  } else if (firstWord === 'why') {
    type = 'Why'
  } else if (firstWord === 'what') {
    type = 'What'
  } else if (COMMAND_VERBS.has(firstWord)) {
    type = 'Command'
  }

  // Sentiment
  let sentiment: Sentiment = 'Neutral'
  if (positiveWords.length > negativeWords.length) sentiment = 'Positive'
  else if (negativeWords.length > positiveWords.length) sentiment = 'Negative'

  // Scoring
  let wordPts = 0
  if      (wordCount >= 6 && wordCount <= 9) wordPts = 20
  else if (wordCount >= 4 && wordCount <= 12) wordPts = 13
  else if (wordCount >= 2)                    wordPts = 7
  else                                        wordPts = 3

  let charPts = 0
  if      (charCount >= 55 && charCount <= 70) charPts = 15
  else if (charCount >= 40 && charCount <= 80) charPts = 10
  else if (charCount >= 20)                    charPts = 6
  else                                         charPts = 2

  const pwCount = powerWords.length
  let powerPts = 0
  if      (pwCount === 0)  powerPts = 0
  else if (pwCount === 1)  powerPts = 15
  else if (pwCount === 2)  powerPts = 20
  else if (pwCount === 3)  powerPts = 15
  else                     powerPts = 10

  let sentPts = 0
  if      (sentiment === 'Positive') sentPts = 15
  else if (sentiment === 'Negative') sentPts = 8
  else                               sentPts = 5

  let typePts = 0
  if      (type === 'List')     typePts = 15
  else if (type === 'How-To')   typePts = 13
  else if (type === 'Question') typePts = 10
  else if (type === 'Why' || type === 'What' || type === 'Command') typePts = 9
  else                          typePts = 5

  let commonPts = 0
  if      (commonRatio < 0.2)  commonPts = 15
  else if (commonRatio < 0.35) commonPts = 10
  else if (commonRatio < 0.5)  commonPts = 5
  else                         commonPts = 2

  const score = Math.min(100, wordPts + charPts + powerPts + sentPts + typePts + commonPts)

  let grade: Grade = 'Weak'
  if      (score >= 90) grade = 'Excellent'
  else if (score >= 75) grade = 'Great'
  else if (score >= 60) grade = 'Good'
  else if (score >= 40) grade = 'Fair'

  // Tips
  const tips: string[] = []
  if (pwCount === 0)
    tips.push('Add a power word like "proven", "ultimate", or "essential" to boost emotional pull.')
  if (wordCount < 6)
    tips.push("Try expanding to 6–9 words — that range consistently performs best for click-throughs.")
  if (wordCount > 12)
    tips.push("Trim to under 12 words. Shorter headlines get read more completely.")
  if (type === 'Statement')
    tips.push('Try a number-led format (e.g. "7 Ways to...") — list headlines can improve CTR by 30%+.')
  if (charCount < 40)
    tips.push("Aim for 55–70 characters to fill the SEO title slot without truncation.")
  if (charCount > 80)
    tips.push("At " + charCount + " chars this may get truncated in search results. Target under 70.")
  if (sentiment === 'Neutral' && positiveWords.length === 0)
    tips.push("Add an emotional word to create a stronger connection with the reader.")
  if (commonRatio > 0.5)
    tips.push("Over half your words are common filler. Replace some with more specific language.")
  if (tips.length === 0)
    tips.push("Strong headline! Try A/B testing it against a question-format version.")

  return {
    score, grade, wordCount, charCount, type, sentiment,
    powerWords: [...new Set(powerWords)],
    positiveWords: [...new Set(positiveWords)],
    negativeWords: [...new Set(negativeWords)],
    commonRatio,
    tips,
    breakdown: {
      wordCount: wordPts, charCount: charPts, powerWords: powerPts,
      sentiment: sentPts, type: typePts, commonWords: commonPts,
    },
  }
}

// ── Score ring ────────────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 90) return 'oklch(0.55 0.17 148)'
  if (score >= 75) return 'oklch(0.60 0.16 155)'
  if (score >= 60) return 'oklch(0.65 0.16 80)'
  if (score >= 40) return 'oklch(0.65 0.18 50)'
  return 'oklch(0.60 0.20 25)'
}

function ScoreRing({ score }: { score: number }) {
  const r    = 48
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = scoreColor(score)
  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor"
        strokeWidth="10" className="text-muted/25" />
      <circle cx="64" cy="64" r={r} fill="none" stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 64 64)"
        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
      />
    </svg>
  )
}

// ── Highlighted headline ──────────────────────────────────────────────────────
function HighlightedHeadline({ text, result }: { text: string; result: Analysis }) {
  const tokens = text.split(/(\s+)/)
  return (
    <p className="font-mono text-sm leading-relaxed">
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>
        const lc = tok.toLowerCase().replace(/[^a-z'-]/g, '')
        if (POWER_WORDS.has(lc))
          return <mark key={i} className="rounded bg-primary/20 text-primary not-italic">{tok}</mark>
        if (POSITIVE_WORDS.has(lc))
          return <mark key={i} className="rounded bg-green-500/15 text-green-700 dark:text-green-400 not-italic">{tok}</mark>
        if (NEGATIVE_WORDS.has(lc))
          return <mark key={i} className="rounded bg-orange-500/15 text-orange-700 dark:text-orange-400 not-italic">{tok}</mark>
        return <span key={i}>{tok}</span>
      })}
    </p>
  )
}

// ── Metric bar ────────────────────────────────────────────────────────────────
function MetricBar({ label, pts, max }: { label: string; pts: number; max: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{pts}/{max}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(pts / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HeadlineAnalyzerPage() {
  const [headline, setHeadline] = useState('')
  const [copied, setCopied]     = useState(false)

  const result = useMemo(() => analyze(headline), [headline])

  const copyHeadline = async () => {
    await navigator.clipboard.writeText(headline)
    setCopied(true)
    toast.success('Headline copied')
    setTimeout(() => setCopied(false), 2000)
  }

  const gradeColor: Record<string, string> = {
    Excellent: 'text-primary',
    Great:     'text-emerald-600 dark:text-emerald-400',
    Good:      'text-yellow-600 dark:text-yellow-400',
    Fair:      'text-orange-500',
    Weak:      'text-red-500',
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      {/* Input */}
      <div className="shrink-0">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Headline</label>
          <div className="flex items-center gap-2">
            {headline && (
              <span className={cn('text-xs tabular-nums', headline.length > 80 ? 'text-orange-500' : 'text-muted-foreground')}>
                {headline.length} chars
              </span>
            )}
            {headline && (
              <button
                onClick={copyHeadline}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {copied ? <CopyCheck className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
            {headline && (
              <button onClick={() => setHeadline('')} className="text-xs text-muted-foreground hover:text-foreground">
                Clear
              </button>
            )}
          </div>
        </div>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Enter your headline here…"
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Results */}
      {!result ? (
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border">
          <div className="text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Type a headline above to analyze it</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Score, word type, power words, tips and more</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-4">

          {/* ── Col 1: Score ── */}
          <Card className="flex flex-col items-center justify-center gap-1 p-6">
            <div className="relative flex items-center justify-center">
              <ScoreRing score={result.score} />
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-bold tabular-nums text-foreground">{result.score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100</span>
              </div>
            </div>
            <span className={cn('mt-2 text-lg font-bold', gradeColor[result.grade])}>
              {result.grade}
            </span>
            <div className="mt-4 w-full space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Words</span>
                <span className={cn('font-semibold', result.wordCount >= 6 && result.wordCount <= 9 ? 'text-primary' : 'text-foreground')}>
                  {result.wordCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Characters</span>
                <span className={cn('font-semibold', result.charCount >= 55 && result.charCount <= 70 ? 'text-primary' : 'text-foreground')}>
                  {result.charCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold text-foreground">{result.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sentiment</span>
                <span className={cn(
                  'font-semibold',
                  result.sentiment === 'Positive' ? 'text-green-600 dark:text-green-400' :
                  result.sentiment === 'Negative' ? 'text-orange-500' : 'text-muted-foreground'
                )}>
                  {result.sentiment}
                </span>
              </div>
            </div>
          </Card>

          {/* ── Col 2: Breakdown + words ── */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">Score Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5 overflow-auto">
              <div className="space-y-3">
                <MetricBar label="Word count"    pts={result.breakdown.wordCount}  max={20} />
                <MetricBar label="Characters"    pts={result.breakdown.charCount}  max={15} />
                <MetricBar label="Power words"   pts={result.breakdown.powerWords} max={20} />
                <MetricBar label="Sentiment"     pts={result.breakdown.sentiment}  max={15} />
                <MetricBar label="Headline type" pts={result.breakdown.type}       max={15} />
                <MetricBar label="Word variety"  pts={result.breakdown.commonWords} max={15} />
              </div>

              {/* Highlighted preview */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Word Highlights
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <HighlightedHeadline text={headline} result={result} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/25" />
                    <span className="text-muted-foreground">Power word</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-500/20" />
                    <span className="text-muted-foreground">Positive</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500/20" />
                    <span className="text-muted-foreground">Negative</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Col 3: Tips + word chips ── */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-semibold">Tips</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 overflow-auto">
              <ul className="space-y-2.5">
                {result.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>

              {/* Word chips */}
              {(result.powerWords.length > 0 || result.positiveWords.length > 0 || result.negativeWords.length > 0) && (
                <div className="mt-auto space-y-2">
                  {result.powerWords.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Power words detected
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.powerWords.map((w) => (
                          <span key={w} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.negativeWords.length > 0 && (
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                        Emotional (negative)
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {result.negativeWords.map((w) => (
                          <span key={w} className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
