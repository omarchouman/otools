'use client'

import { useState, useEffect } from 'react'
import { Copy, CopyCheck, Hash } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── MD5 (pure JS, RFC 1321) ──────────────────────────────────────────────────
function md5(input: string): Uint8Array {
  const bytes = Array.from(new TextEncoder().encode(input))

  function add32(a: number, b: number): number {
    const lo = (a & 0xffff) + (b & 0xffff)
    const hi = (a >>> 16) + (b >>> 16) + (lo >>> 16)
    return ((hi << 16) | (lo & 0xffff)) >>> 0
  }
  function rol32(n: number, c: number): number { return ((n << c) | (n >>> (32 - c))) >>> 0 }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return add32(rol32(add32(add32(a, q), add32(x >>> 0, t >>> 0)), s), b)
  }
  const ff = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & c) | (~b & d), a, b, x, s, t)
  const gg = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn((b & d) | (c & ~d), a, b, x, s, t)
  const hh = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(b ^ c ^ d, a, b, x, s, t)
  const ii = (a: number, b: number, c: number, d: number, x: number, s: number, t: number) =>
    cmn(c ^ (b | ~d), a, b, x, s, t)

  // Padding
  const origLen = bytes.length
  bytes.push(0x80)
  while (bytes.length % 64 !== 56) bytes.push(0)
  const bitLen = origLen * 8
  for (let i = 0; i < 4; i++) bytes.push((bitLen >>> (i * 8)) & 0xff)
  for (let i = 0; i < 4; i++) bytes.push(0) // high 32 bits of length (always 0 here)

  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476

  for (let i = 0; i < bytes.length; i += 64) {
    const M: number[] = []
    for (let j = 0; j < 16; j++) {
      M[j] = (bytes[i + j * 4]) | (bytes[i + j * 4 + 1] << 8) |
              (bytes[i + j * 4 + 2] << 16) | (bytes[i + j * 4 + 3] << 24)
    }
    const [oa, ob, oc, od] = [a, b, c, d]
    // Round 1
    a=ff(a,b,c,d,M[0], 7,-680876936);  d=ff(d,a,b,c,M[1],12,-389564586)
    c=ff(c,d,a,b,M[2],17, 606105819);  b=ff(b,c,d,a,M[3],22,-1044525330)
    a=ff(a,b,c,d,M[4], 7,-176418897);  d=ff(d,a,b,c,M[5],12, 1200080426)
    c=ff(c,d,a,b,M[6],17,-1473231341); b=ff(b,c,d,a,M[7],22,  -45705983)
    a=ff(a,b,c,d,M[8], 7,1770035416);  d=ff(d,a,b,c,M[9],12,-1958414417)
    c=ff(c,d,a,b,M[10],17,  -42063);   b=ff(b,c,d,a,M[11],22,-1990404162)
    a=ff(a,b,c,d,M[12],7,1804603682);  d=ff(d,a,b,c,M[13],12,  -40341101)
    c=ff(c,d,a,b,M[14],17,-1502002290);b=ff(b,c,d,a,M[15],22, 1236535329)
    // Round 2
    a=gg(a,b,c,d,M[1], 5, -165796510); d=gg(d,a,b,c,M[6], 9,-1069501632)
    c=gg(c,d,a,b,M[11],14,  643717713); b=gg(b,c,d,a,M[0],20, -373897302)
    a=gg(a,b,c,d,M[5], 5, -701558691); d=gg(d,a,b,c,M[10],9,   38016083)
    c=gg(c,d,a,b,M[15],14,-660478335); b=gg(b,c,d,a,M[4],20, -405537848)
    a=gg(a,b,c,d,M[9], 5,  568446438); d=gg(d,a,b,c,M[14],9,-1019803690)
    c=gg(c,d,a,b,M[3],14, -187363961); b=gg(b,c,d,a,M[8],20, 1163531501)
    a=gg(a,b,c,d,M[13],5,-1444681467); d=gg(d,a,b,c,M[2], 9,  -51403784)
    c=gg(c,d,a,b,M[7],14,1735328473);  b=gg(b,c,d,a,M[12],20,-1926607734)
    // Round 3
    a=hh(a,b,c,d,M[5], 4,   -378558); d=hh(d,a,b,c,M[8],11,-2022574463)
    c=hh(c,d,a,b,M[11],16,1839030562);b=hh(b,c,d,a,M[14],23,  -35309556)
    a=hh(a,b,c,d,M[1], 4,-1530992060);d=hh(d,a,b,c,M[4],11, 1272893353)
    c=hh(c,d,a,b,M[7],16, -155497632);b=hh(b,c,d,a,M[10],23,-1094730640)
    a=hh(a,b,c,d,M[13],4,  681279174);d=hh(d,a,b,c,M[0],11,  -358537222)
    c=hh(c,d,a,b,M[3],16, -722521979);b=hh(b,c,d,a,M[6],23,    76029189)
    a=hh(a,b,c,d,M[9], 4, -640364487);d=hh(d,a,b,c,M[12],11, -421815835)
    c=hh(c,d,a,b,M[15],16, 530742520);b=hh(b,c,d,a,M[2],23,  -995338651)
    // Round 4
    a=ii(a,b,c,d,M[0], 6, -198630844); d=ii(d,a,b,c,M[7],10, 1126891415)
    c=ii(c,d,a,b,M[14],15,-1416354905);b=ii(b,c,d,a,M[5],21,  -57434055)
    a=ii(a,b,c,d,M[12],6, 1700485571); d=ii(d,a,b,c,M[3],10,-1894986606)
    c=ii(c,d,a,b,M[10],15,   -1051523); b=ii(b,c,d,a,M[1],21,-2054922799)
    a=ii(a,b,c,d,M[8], 6, 1873313359); d=ii(d,a,b,c,M[15],10,  -30611744)
    c=ii(c,d,a,b,M[6],15,-1560198380); b=ii(b,c,d,a,M[13],21, 1309151649)
    a=ii(a,b,c,d,M[4], 6, -145523070); d=ii(d,a,b,c,M[11],10,-1120210379)
    c=ii(c,d,a,b,M[2],15,  718787259); b=ii(b,c,d,a,M[9],21,  -343485551)

    a=add32(a,oa); b=add32(b,ob); c=add32(c,oc); d=add32(d,od)
  }

  const out = new Uint8Array(16)
  ;[a, b, c, d].forEach((v, i) => {
    out[i * 4]     = v & 0xff
    out[i * 4 + 1] = (v >>> 8)  & 0xff
    out[i * 4 + 2] = (v >>> 16) & 0xff
    out[i * 4 + 3] = (v >>> 24) & 0xff
  })
  return out
}

// ── Encoding helpers ─────────────────────────────────────────────────────────
function toHex(buf: Uint8Array): string {
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function toBase64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
}

async function digestSHA(algo: string, text: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return new Uint8Array(buf)
}

// ── Algorithm definitions ────────────────────────────────────────────────────
const ALGOS = [
  { id: 'md5',    label: 'MD5',     bits: 128, sha: null      },
  { id: 'sha1',   label: 'SHA-1',   bits: 160, sha: 'SHA-1'   },
  { id: 'sha256', label: 'SHA-256', bits: 256, sha: 'SHA-256' },
  { id: 'sha384', label: 'SHA-384', bits: 384, sha: 'SHA-384' },
  { id: 'sha512', label: 'SHA-512', bits: 512, sha: 'SHA-512' },
] as const

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HashGeneratorPage() {
  const [input, setInput]       = useState('')
  const [encoding, setEncoding] = useState<'hex' | 'base64'>('hex')
  const [hashes, setHashes]     = useState<Record<string, string>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!input) { setHashes({}); return }

    let cancelled = false
    async function compute() {
      const results: Record<string, string> = {}

      const md5Bytes = md5(input)
      results.md5 = encoding === 'hex' ? toHex(md5Bytes) : toBase64(md5Bytes)

      await Promise.all(
        ALGOS.filter((a) => a.sha !== null).map(async ({ id, sha }) => {
          const bytes = await digestSHA(sha!, input)
          results[id] = encoding === 'hex' ? toHex(bytes) : toBase64(bytes)
        })
      )

      if (!cancelled) setHashes(results)
    }

    compute()
    return () => { cancelled = true }
  }, [input, encoding])

  const copy = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value)
    setCopiedId(id)
    toast.success('Hash copied')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">

      {/* Input + encoding toggle */}
      <div className="shrink-0">
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Input</label>
          <div className="flex items-center rounded-lg border border-border bg-card p-0.5">
            {(['hex', 'base64'] as const).map((enc) => (
              <button
                key={enc}
                onClick={() => setEncoding(enc)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  encoding === enc
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {enc === 'hex' ? 'Hex' : 'Base64'}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste text to hash…"
          rows={5}
          spellCheck={false}
          className="w-full resize-none rounded-xl border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/30"
        />
        {input && (
          <p className="mt-1 text-right text-[10px] text-muted-foreground/60">
            {new TextEncoder().encode(input).length} bytes · {input.length} chars
          </p>
        )}
      </div>

      {/* Hash list */}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardContent className="min-h-0 flex-1 overflow-auto p-0">
          {!input ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <Hash className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">Type something above to generate hashes</p>
              <p className="text-xs text-muted-foreground/60">MD5 · SHA-1 · SHA-256 · SHA-384 · SHA-512</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {ALGOS.map(({ id, label, bits }) => (
                <div
                  key={id}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/30"
                >
                  {/* Algorithm label */}
                  <div className="flex w-20 shrink-0 flex-col gap-0.5">
                    <span className="text-xs font-bold text-foreground">{label}</span>
                    <span className="text-[10px] text-muted-foreground">{bits} bit</span>
                  </div>

                  {/* Hash value */}
                  <span className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
                    {hashes[id] ?? (
                      <span className="animate-pulse text-muted-foreground/40">computing…</span>
                    )}
                  </span>

                  {/* Copy */}
                  <button
                    onClick={() => hashes[id] && copy(id, hashes[id])}
                    disabled={!hashes[id]}
                    className="shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                  >
                    {copiedId === id
                      ? <CopyCheck className="h-4 w-4 text-primary" />
                      : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
