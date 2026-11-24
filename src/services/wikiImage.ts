import { useEffect, useState } from 'react'

// Real pictures for the lesson explanation: the main image of a Wikipedia
// article (free licences, Wikimedia Commons), found by the title the AI
// suggests. Portuguese first, then English. Cached per title on this device.

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

export function findWikiImage(query: string): Promise<WikiImage | null> {
  const key = query.trim().toLowerCase()
  if (!key) return Promise.resolve(null)
  const cached = readCache()
  if (key in cached) return Promise.resolve(cached[key])
  if (memory.has(key)) return memory.get(key)!
  const job = (async () => {
    try {
      const img = (await byTitle('pt', query)) || (await byTitle('en', query))
      const all = readCache()
      all[key] = img
      const keys = Object.keys(all)
      if (keys.length > 300) delete all[keys[0]]
      localStorage.setItem(CACHE, JSON.stringify(all))
      return img
    } catch {
      return null
    }
  })()
  memory.set(key, job)
  return job
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
