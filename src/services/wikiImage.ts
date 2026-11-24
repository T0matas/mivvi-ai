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

const CACHE = 'mivvi_wikiimg_v1'
const memory = new Map<string, Promise<WikiImage | null>>()

function readCache(): Record<string, WikiImage | null> {
  try { return JSON.parse(localStorage.getItem(CACHE) || '{}') } catch { return {} }
}

async function search(lang: string, query: string): Promise<WikiImage | null> {
  const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=900`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const pages = Object.values(data?.query?.pages || {}) as any[]
  pages.sort((a, b) => (a.index || 0) - (b.index || 0))
  const hit = pages.find((p) => p.thumbnail?.source && p.thumbnail.width >= 200)
  if (!hit) return null
  return { src: hit.thumbnail.source, width: hit.thumbnail.width, height: hit.thumbnail.height, title: hit.title, page: hit.fullurl || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(hit.title)}` }
}

export function findWikiImage(query: string): Promise<WikiImage | null> {
  const key = query.trim().toLowerCase()
  if (!key) return Promise.resolve(null)
  const cached = readCache()
  if (key in cached) return Promise.resolve(cached[key])
  if (memory.has(key)) return memory.get(key)!
  const job = (async () => {
    try {
      const img = (await search('pt', query)) || (await search('en', query))
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
