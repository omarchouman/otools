'use client'

import { useState, useEffect, useRef } from 'react'
import { Copy, CopyCheck, Pipette } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
type RGB = [number, number, number]  // 0–255
type HSL = [number, number, number]  // 0–360, 0–100, 0–100
type HSB = [number, number, number]  // 0–360, 0–100, 0–100

// ── Color math ────────────────────────────────────────────────────────────────
function r2(n: number) { return Math.round(n * 100) / 100 }

function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): RGB | null {
  const m = hex.replace(/^#/, '').match(/^([0-9a-f]{6})$/i)
  if (!m) return null
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHsl([r, g, b]: RGB): HSL {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  if (max === min) return [0, 0, Math.round(l * 100)]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rr)      h = (gg - bb) / d + (gg < bb ? 6 : 0)
  else if (max === gg) h = (bb - rr) / d + 2
  else                 h = (rr - gg) / d + 4
  return [Math.round((h / 6) * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToRgb([h, s, l]: HSL): RGB {
  const hh = h / 360, ss = s / 100, ll = l / 100
  if (ss === 0) { const v = Math.round(ll * 255); return [v, v, v] }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss
  const p = 2 * ll - q
  function hue2rgb(t: number): number {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [
    Math.round(hue2rgb(hh + 1 / 3) * 255),
    Math.round(hue2rgb(hh) * 255),
    Math.round(hue2rgb(hh - 1 / 3) * 255),
  ]
}

function rgbToHsb([r, g, b]: RGB): HSB {
  const rr = r / 255, gg = g / 255, bb = b / 255
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb)
  const v = max, d = max - min
  const s = max === 0 ? 0 : d / max
  if (max === min) return [0, Math.round(s * 100), Math.round(v * 100)]
  let h = 0
  if (max === rr)      h = (gg - bb) / d + (gg < bb ? 6 : 0)
  else if (max === gg) h = (bb - rr) / d + 2
  else                 h = (rr - gg) / d + 4
  return [Math.round((h / 6) * 360), Math.round(s * 100), Math.round(v * 100)]
}

function hsbToRgb([h, s, b]: HSB): RGB {
  const hh = h / 360, ss = s / 100, vv = b / 100
  if (ss === 0) { const val = Math.round(vv * 255); return [val, val, val] }
  const i = Math.floor(hh * 6), f = hh * 6 - i
  const p = vv * (1 - ss), q = vv * (1 - f * ss), t = vv * (1 - (1 - f) * ss)
  const combos: RGB[] = [
    [vv, t, p], [q, vv, p], [p, vv, t],
    [p, q, vv], [t, p, vv], [vv, p, q],
  ]
  return combos[i % 6].map((c) => Math.round(c * 255)) as RGB
}

// ── WCAG contrast ratio ───────────────────────────────────────────────────────
function wcagContrast(fg: RGB, bg: RGB): number {
  function lum([r, g, b]: RGB): number {
    return [r, g, b].reduce((acc, c, i) => {
      const s = c / 255
      const lin = s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
      return acc + lin * [0.2126, 0.7152, 0.0722][i]
    }, 0)
  }
  const l1 = lum(fg), l2 = lum(bg)
  const [lt, dk] = l1 > l2 ? [l1, l2] : [l2, l1]
  return r2((lt + 0.05) / (dk + 0.05))
}

// ── Draft state ───────────────────────────────────────────────────────────────
interface Drafts {
  hex: string
  r: string; g: string; b: string
  hsl_h: string; hsl_s: string; hsl_l: string
  hsb_h: string; hsb_s: string; hsb_b: string
}

function buildDrafts(rgb: RGB): Drafts {
  const [hsl_h, hsl_s, hsl_l] = rgbToHsl(rgb)
  const [hsb_h, hsb_s, hsb_b] = rgbToHsb(rgb)
  return {
    hex: rgbToHex(rgb),
    r: rgb[0].toString(), g: rgb[1].toString(), b: rgb[2].toString(),
    hsl_h: hsl_h.toString(), hsl_s: hsl_s.toString(), hsl_l: hsl_l.toString(),
    hsb_h: hsb_h.toString(), hsb_s: hsb_s.toString(), hsb_b: hsb_b.toString(),
  }
}

// ── Sub-components ────────────────────────────────────────────────────────────
function FormatRow({
  label, children, onCopy, copied,
}: {
  label: string
  children: React.ReactNode
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="w-9 shrink-0 text-xs font-bold text-muted-foreground">{label}</span>
      <div className="flex flex-1 items-center gap-2">{children}</div>
      <button
        onClick={onCopy}
        className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title={`Copy ${label}`}
      >
        {copied
          ? <CopyCheck className="h-3.5 w-3.5 text-primary" />
          : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

const numInput = 'w-full rounded-lg border border-border bg-muted/40 px-2 py-2 text-center font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

// ── Page ──────────────────────────────────────────────────────────────────────
const INITIAL: RGB = [52, 211, 153] // emerald-400

export default function ColorConverterPage() {
  const [rgb, setRgb]       = useState<RGB>(INITIAL)
  const [focused, setFocus] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Drafts>(() => buildDrafts(INITIAL))
  const [copied, setCopied] = useState<string | null>(null)
  const pickerRef           = useRef<HTMLInputElement>(null)

  // Keep non-focused drafts in sync with rgb
  useEffect(() => {
    const fresh = buildDrafts(rgb)
    setDrafts((prev) => ({
      hex:   focused === 'hex' ? prev.hex : fresh.hex,
      r:     focused === 'rgb' ? prev.r   : fresh.r,
      g:     focused === 'rgb' ? prev.g   : fresh.g,
      b:     focused === 'rgb' ? prev.b   : fresh.b,
      hsl_h: focused === 'hsl' ? prev.hsl_h : fresh.hsl_h,
      hsl_s: focused === 'hsl' ? prev.hsl_s : fresh.hsl_s,
      hsl_l: focused === 'hsl' ? prev.hsl_l : fresh.hsl_l,
      hsb_h: focused === 'hsb' ? prev.hsb_h : fresh.hsb_h,
      hsb_s: focused === 'hsb' ? prev.hsb_s : fresh.hsb_s,
      hsb_b: focused === 'hsb' ? prev.hsb_b : fresh.hsb_b,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rgb])

  const set = (key: keyof Drafts, v: string) =>
    setDrafts((d) => ({ ...d, [key]: v }))

  const copyFormat = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(label)
    toast.success(`${label} copied`)
    setTimeout(() => setCopied(null), 2000)
  }

  const hexStr = rgbToHex(rgb)
  const [hsl_h, hsl_s, hsl_l] = rgbToHsl(rgb)
  const [hsb_h, hsb_s, hsb_b] = rgbToHsb(rgb)

  const contrastWhite = wcagContrast(rgb, [255, 255, 255])
  const contrastBlack = wcagContrast(rgb, [0, 0, 0])

  return (
    <div className="flex h-full flex-col p-6">
      <div className="flex min-h-0 flex-1 gap-6">

        {/* ── Left: swatch + picker + contrast ── */}
        <div className="flex w-44 shrink-0 flex-col gap-3">
          {/* Color swatch */}
          <div
            className="min-h-0 flex-1 rounded-2xl border border-border/60 shadow-lg transition-colors"
            style={{ backgroundColor: hexStr }}
          />

          {/* Native picker (hidden) */}
          <input
            ref={pickerRef}
            type="color"
            value={hexStr}
            onChange={(e) => {
              const parsed = hexToRgb(e.target.value)
              if (parsed) setRgb(parsed)
            }}
            className="sr-only"
            aria-hidden
          />
          <button
            onClick={() => pickerRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pipette className="h-3.5 w-3.5" />
            Pick color
          </button>

          {/* Contrast card */}
          <div className="rounded-xl border border-border bg-card p-3 text-[11px]">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Contrast
            </p>
            {([
              { label: 'on white', ratio: contrastWhite, bg: [255,255,255] as RGB },
              { label: 'on black', ratio: contrastBlack, bg: [0,0,0] as RGB },
            ] as const).map(({ label, ratio, bg }) => {
              const aa  = ratio >= 4.5
              const aaa = ratio >= 7
              return (
                <div key={label} className="mt-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 shrink-0 rounded-sm border border-border"
                        style={{ backgroundColor: `rgb(${bg[0]},${bg[1]},${bg[2]})` }}
                      />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <span className="font-mono font-semibold text-foreground">{ratio}</span>
                  </div>
                  <div className="mt-0.5 flex gap-1">
                    {['AA', 'AAA'].map((grade) => {
                      const pass = grade === 'AA' ? aa : aaa
                      return (
                        <span
                          key={grade}
                          className={cn(
                            'rounded px-1 py-0 text-[9px] font-bold',
                            pass
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                              : 'bg-muted text-muted-foreground/50'
                          )}
                        >
                          {grade}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: format inputs ── */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">

          {/* HEX */}
          <FormatRow
            label="HEX"
            onCopy={() => copyFormat(hexStr, 'HEX')}
            copied={copied === 'HEX'}
          >
            <input
              type="text"
              value={drafts.hex}
              spellCheck={false}
              onFocus={() => setFocus('hex')}
              onBlur={() => setFocus(null)}
              onChange={(e) => {
                const v = e.target.value
                set('hex', v)
                const p = hexToRgb(v)
                if (p) setRgb(p)
              }}
              className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
          </FormatRow>

          {/* RGB */}
          <FormatRow
            label="RGB"
            onCopy={() => copyFormat(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, 'RGB')}
            copied={copied === 'RGB'}
          >
            {(['r', 'g', 'b'] as const).map((ch, ci) => (
              <div key={ch} className="flex flex-1 items-center gap-1">
                <span className="w-3 shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{ch}</span>
                <input
                  type="number"
                  min={0} max={255}
                  value={drafts[ch]}
                  onFocus={() => setFocus('rgb')}
                  onBlur={() => setFocus(null)}
                  onChange={(e) => {
                    const v = e.target.value
                    set(ch, v)
                    const n = parseInt(v)
                    if (!isNaN(n) && n >= 0 && n <= 255) {
                      const next: RGB = [rgb[0], rgb[1], rgb[2]]
                      next[ci] = n
                      setRgb(next)
                    }
                  }}
                  className={numInput}
                />
              </div>
            ))}
          </FormatRow>

          {/* HSL */}
          <FormatRow
            label="HSL"
            onCopy={() => copyFormat(`hsl(${hsl_h}, ${hsl_s}%, ${hsl_l}%)`, 'HSL')}
            copied={copied === 'HSL'}
          >
            {([
              { key: 'hsl_h' as const, lbl: 'H', max: 360, unit: '°' },
              { key: 'hsl_s' as const, lbl: 'S', max: 100, unit: '%' },
              { key: 'hsl_l' as const, lbl: 'L', max: 100, unit: '%' },
            ]).map(({ key, lbl, max, unit }) => (
              <div key={key} className="flex flex-1 items-center gap-1">
                <span className="w-3 shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{lbl}</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0} max={max}
                    value={drafts[key]}
                    onFocus={() => setFocus('hsl')}
                    onBlur={() => setFocus(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      set(key, v)
                      const n = parseFloat(v)
                      if (!isNaN(n) && n >= 0 && n <= max) {
                        const h = key === 'hsl_h' ? n : parseFloat(drafts.hsl_h)
                        const s = key === 'hsl_s' ? n : parseFloat(drafts.hsl_s)
                        const l = key === 'hsl_l' ? n : parseFloat(drafts.hsl_l)
                        if (!isNaN(h) && !isNaN(s) && !isNaN(l)) setRgb(hslToRgb([h, s, l]))
                      }
                    }}
                    className={cn(numInput, 'pr-5')}
                  />
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </FormatRow>

          {/* HSB */}
          <FormatRow
            label="HSB"
            onCopy={() => copyFormat(`hsb(${hsb_h}, ${hsb_s}%, ${hsb_b}%)`, 'HSB')}
            copied={copied === 'HSB'}
          >
            {([
              { key: 'hsb_h' as const, lbl: 'H', max: 360, unit: '°' },
              { key: 'hsb_s' as const, lbl: 'S', max: 100, unit: '%' },
              { key: 'hsb_b' as const, lbl: 'B', max: 100, unit: '%' },
            ]).map(({ key, lbl, max, unit }) => (
              <div key={key} className="flex flex-1 items-center gap-1">
                <span className="w-3 shrink-0 text-[10px] font-bold uppercase text-muted-foreground">{lbl}</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0} max={max}
                    value={drafts[key]}
                    onFocus={() => setFocus('hsb')}
                    onBlur={() => setFocus(null)}
                    onChange={(e) => {
                      const v = e.target.value
                      set(key, v)
                      const n = parseFloat(v)
                      if (!isNaN(n) && n >= 0 && n <= max) {
                        const h = key === 'hsb_h' ? n : parseFloat(drafts.hsb_h)
                        const s = key === 'hsb_s' ? n : parseFloat(drafts.hsb_s)
                        const b = key === 'hsb_b' ? n : parseFloat(drafts.hsb_b)
                        if (!isNaN(h) && !isNaN(s) && !isNaN(b)) setRgb(hsbToRgb([h, s, b]))
                      }
                    }}
                    className={cn(numInput, 'pr-5')}
                  />
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60">
                    {unit}
                  </span>
                </div>
              </div>
            ))}
          </FormatRow>
        </div>
      </div>
    </div>
  )
}
