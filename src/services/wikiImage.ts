import { useEffect, useState } from 'react'

// Real pictures for the lesson explanation: the main image of a Wikipedia
// article (free licences, Wikimedia Commons), found by the title the AI
// suggests (several titles may be given as "A | B | C", tried in order).
// Portuguese first, then English. Cached per title on this device.

export interface WikiImage {
  src: string
  width: number
  height: number
  title: string
  page: string
}

const CACHE = 'mivvi_wikiimg_v2'
const memory = new Map<string, Promise<WikiImage | null>>()

function readCache(): Record<string, WikiImage | null> {
  try { return JSON.parse(localStorage.getItem(CACHE) || '{}') } catch { return {} }
}

/** The main picture of the article with exactly this title (redirects followed). No free-text search: it found unrelated pictures. */
async function byTitle(lang: string, title: string): Promise<WikiImage | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&titles=${encodeURIComponent(title)}&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=900&pilicense=free`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const page = (Object.values(data?.query?.pages || {}) as any[]).find((p) => !('missing' in p) && p.thumbnail?.source && p.thumbnail.width >= 200)
  if (!page) return null
  return { src: page.thumbnail.source, width: page.thumbnail.width, height: page.thumbnail.height, title: page.title, page: page.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(page.title)}` }
}

/** The picture for one title (Portuguese, then English), cached on this device. */
function imageForTitle(title: string): Promise<WikiImage | null> {
  const key = title.trim().toLowerCase()
  if (!key) return Promise.resolve(null)
  const cached = readCache()
  if (key in cached) return Promise.resolve(cached[key])
  if (memory.has(key)) return memory.get(key)!
  const job = (async () => {
    try {
      const img = (await byTitle('pt', title)) || (await byTitle('en', title))
      const all = readCache()
      all[key] = img
      const keys = Object.keys(all)
      if (keys.length > 400) delete all[keys[0]]
      localStorage.setItem(CACHE, JSON.stringify(all))
      return img
    } catch {
      return null
    }
  })()
  memory.set(key, job)
  return job
}

/** "A | B | C": the first title with a picture that isn't in `skip` (picture addresses). */
export async function findWikiImage(query: string, skip?: Set<string>): Promise<WikiImage | null> {
  for (const title of query.split('|').map((t) => t.trim()).filter(Boolean).slice(0, 6)) {
    const img = await imageForTitle(title)
    if (img && !skip?.has(img.src)) return img
  }
  return null
}

export function useWikiImage(query?: string) {
  const [img, setImg] = useState<WikiImage | null | undefined>(query ? undefined : null)
  useEffect(() => {
    if (!query) { setImg(null); return }
    let alive = true
    setImg(undefined)
    findWikiImage(query).then((r) => { if (alive) setImg(r) })
    return () => { alive = false }
  }, [query])
  return img
}

// ── No repeated pictures ─────────────────────────────────────────────────────
// A lesson's pictures are chosen together, in order, so no picture appears
// twice. Pictures already used by the student's other lessons are skipped too
// (remembered per lesson on this device), so lessons don't repeat each other.

const USED = 'mivvi_img_used_v1'
const readUsed = (): Record<string, string[]> => { try { return JSON.parse(localStorage.getItem(USED) || '{}') } catch { return {} } }

/**
 * Pictures for a list of queries (null where there's none), all different.
 * `owner` names the lesson (its pictures are kept for it); `acrossLessons`
 * also avoids pictures other lessons use.
 */
export function useUniqueImages(owner: string, queries: (string | undefined)[], acrossLessons = true) {
  const sig = queries.map((q) => q || '').join('¦')
  const [list, setList] = useState<(WikiImage | null)[] | undefined>(undefined)
  useEffect(() => {
    let alive = true
    setList(undefined)
    ;(async () => {
      const used = readUsed()
      const mine = used[owner] || []
      const skip = new Set<string>()
      if (acrossLessons) Object.entries(used).forEach(([k, srcs]) => { if (k !== owner) srcs.forEach((x) => skip.add(x)) })
      const out: (WikiImage | null)[] = []
      for (const q of queries) {
        // Prefer the picture this lesson had before (so reopening it looks the same).
        let img: WikiImage | null = null
        if (q) {
          for (const title of q.split('|').map((t) => t.trim()).filter(Boolean).slice(0, 6)) {
            const found = await imageForTitle(title)
            if (found && mine.includes(found.src) && !skip.has(found.src)) { img = found; break }
          }
          if (!img) img = await findWikiImage(q, skip)
        }
        if (img) skip.add(img.src)
        out.push(img)
        if (alive) setList([...out, ...queries.slice(out.length).map(() => undefined as unknown as null)])
      }
      if (!alive) return
      setList(out)
      if (acrossLessons) {
        const all = readUsed()
        delete all[owner]
        all[owner] = out.filter(Boolean).map((i) => i!.src)
        const keys = Object.keys(all)
        while (keys.length > 300) delete all[keys.shift()!]
        localStorage.setItem(USED, JSON.stringify(all))
      }
    })()
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, sig, acrossLessons])
  return list
}

// ── Plain backgrounds out ────────────────────────────────────────────────────
// Many Wikipedia pictures are an object on a white (or other plain) background.
// That background is made transparent, so only the object shows on the app's
// dark page. Real photos (no plain border) are left as they are.

const cutouts = new Map<string, Promise<string | null>>()

/** A PNG (data URL) of the picture without its plain background, or null when it has none. */
export function cutOutBackground(src: string): Promise<string | null> {
  if (cutouts.has(src)) return cutouts.get(src)!
  const job = new Promise<string | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.referrerPolicy = 'no-referrer'
    img.onerror = () => resolve(null)
    img.onload = () => {
      try {
        const scale = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight))
        const w = Math.max(1, Math.round(img.naturalWidth * scale))
        const h = Math.max(1, Math.round(img.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, w, h)
        const data = ctx.getImageData(0, 0, w, h)
        const px = data.data

        // Background colour: the average of the four corners.
        let r = 0, g = 0, b = 0, n = 0
        for (const [cx, cy] of [[0, 0], [w - 4, 0], [0, h - 4], [w - 4, h - 4]]) {
          for (let y = cy; y < cy + 4; y++) for (let x = cx; x < cx + 4; x++) {
            const i = (Math.max(0, y) * w + Math.max(0, x)) * 4
            if (px[i + 3] < 20) continue
            r += px[i]; g += px[i + 1]; b += px[i + 2]; n++
          }
        }
        if (!n) return resolve(null) // already transparent
        r /= n; g /= n; b /= n
        const dist = (i: number) => Math.abs(px[i] - r) + Math.abs(px[i + 1] - g) + Math.abs(px[i + 2] - b)

        // Only when most of the border is that plain colour (otherwise it's a photo).
        let plain = 0, border = 0
        for (let x = 0; x < w; x++) { border += 2; if (dist(x * 4) < 40) plain++; if (dist(((h - 1) * w + x) * 4) < 40) plain++ }
        for (let y = 0; y < h; y++) { border += 2; if (dist(y * w * 4) < 40) plain++; if (dist((y * w + w - 1) * 4) < 40) plain++ }
        if (plain / border < 0.8) return resolve(null)

        // Flood fill from the border through pixels close to the background colour.
        const seen = new Uint8Array(w * h)
        const stack: number[] = []
        const push = (p: number) => { if (!seen[p] && dist(p * 4) < 60) { seen[p] = 1; stack.push(p) } }
        for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
        for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
        let cleared = 0
        while (stack.length) {
          const p = stack.pop()!
          const d = dist(p * 4)
          // Fully clear close matches; soften the edge pixels.
          px[p * 4 + 3] = d < 30 ? 0 : Math.min(px[p * 4 + 3], Math.round(((d - 30) / 30) * 255))
          cleared++
          const x = p % w
          if (x > 0) push(p - 1)
          if (x < w - 1) push(p + 1)
          if (p >= w) push(p - w)
          if (p < w * (h - 1)) push(p + w)
        }
        // Nothing left (or almost nothing removed): keep the original.
        if (cleared > w * h * 0.97 || cleared < w * h * 0.05) return resolve(null)
        ctx.putImageData(data, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null) // e.g. the server didn't allow reading the pixels
      }
    }
    img.src = src
  })
  cutouts.set(src, job)
  return job
}

/** The cut-out picture: undefined while working, null to show the original. */
export function useCutout(src?: string) {
  const [out, setOut] = useState<string | null | undefined>(src ? undefined : null)
  useEffect(() => {
    if (!src) { setOut(null); return }
    let alive = true
    setOut(undefined)
    cutOutBackground(src).then((r) => { if (alive) setOut(r) })
    return () => { alive = false }
  }, [src])
  return out
}
