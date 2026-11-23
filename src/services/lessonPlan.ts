import { useEffect, useState } from 'react'
import { askKodu } from './codevantumAI'
import { courseInfo, subjectName, yearNumber } from '../data/ptCurriculum'

// The year's lesson plan of a subject, written once by the AI from the
// Portuguese curriculum (for that subject, year and course) and kept on this
// device. The home screen shows its titles; each lesson uses its topic.

export interface PlannedLesson {
  title: string
  description: string
}

export const PLAN_LENGTH = 20
const KEY = (subject: string, year: string, course?: string | null) => `mivvi_plan_v1_${subject}_${year}_${course || '-'}`
const inFlight = new Map<string, Promise<PlannedLesson[] | null>>()

export function getCachedPlan(subject: string, year?: string | null, course?: string | null): PlannedLesson[] | null {
  if (!year) return null
  try {
    const raw = localStorage.getItem(KEY(subject, year, course))
    const plan = raw ? JSON.parse(raw) : null
    return Array.isArray(plan) && plan.length ? plan : null
  } catch {
    return null
  }
}

export function fetchPlan(subject: string, year: string, course?: string | null): Promise<PlannedLesson[] | null> {
  const key = KEY(subject, year, course)
  const cached = getCachedPlan(subject, year, course)
  if (cached) return Promise.resolve(cached)
  if (inFlight.has(key)) return inFlight.get(key)!

  const n = yearNumber(year)
  const job = askKodu({
    mode: 'plan',
    context: {
      subject: subjectName(subject),
      schoolYear: `${n}.º ano (${n <= 9 ? 'Ensino Básico' : 'Ensino Secundário'}, Portugal)`,
      course: courseInfo(course)?.name,
      count: PLAN_LENGTH,
      language: 'pt-PT',
    },
  })
    .then((reply) => {
      const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim())
      const lessons: PlannedLesson[] = (parsed.lessons || [])
        .filter((l: any) => l && typeof l.title === 'string' && l.title.trim())
        .slice(0, PLAN_LENGTH)
        .map((l: any) => ({ title: String(l.title).trim(), description: String(l.description || '').trim() }))
      if (lessons.length < 5) return null
      localStorage.setItem(key, JSON.stringify(lessons))
      return lessons
    })
    .catch((error) => {
      console.warn('Could not plan the lessons for', subject, error)
      return null
    })
    .finally(() => inFlight.delete(key))

  inFlight.set(key, job)
  return job
}

/** The plan of a subject: cached right away, otherwise fetched in the background. */
export function useLessonPlan(subject: string | null | undefined, year?: string | null, course?: string | null) {
  const [plan, setPlan] = useState<PlannedLesson[] | null>(() => (subject ? getCachedPlan(subject, year, course) : null))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!subject || !year) { setPlan(null); return }
    const cached = getCachedPlan(subject, year, course)
    setPlan(cached)
    if (cached) return
    let alive = true
    setLoading(true)
    fetchPlan(subject, year, course).then((p) => { if (alive) { setPlan(p); setLoading(false) } })
    return () => { alive = false }
  }, [subject, year, course])

  return { plan, loading }
}
