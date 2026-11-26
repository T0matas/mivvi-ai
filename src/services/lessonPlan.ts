import { useEffect, useState } from 'react'
import { askKodu, KoduError } from './codevantumAI'
import { courseInfo, subjectName, yearNumber } from '../data/ptCurriculum'

// The year's lesson plan of a subject. The server reads the official document
// (DGE Aprendizagens Essenciais for that subject and year, or the programme of
// the professional course) and the AI turns it into lessons in the same order:
// lesson 1 = the first content of the document. How many lessons there are
// depends on the document. The plan is kept on this device.

export interface PlannedLesson {
  title: string
  description: string
  /** The learning objectives of the official document this lesson covers. */
  content?: string
}

/** Most lessons a plan can have (lesson ids keep the number in two digits). */
export const MAX_LESSONS = 40
const KEY = (subject: string, year: string, course?: string | null) => `mivvi_plan_v3_${subject}_${year}_${course || '-'}`
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
  // Planning sends the official document to the AI: when the AI is busy (429), wait and try again.
  const ask = async (context: Record<string, unknown>) => {
    for (const wait of [0, 8000, 20000]) {
      if (wait) await new Promise((r) => setTimeout(r, wait))
      try { return await askKodu({ mode: 'plan', context }) } catch (e) { if ((e as KoduError).status !== 429 || wait === 20000) throw e }
    }
    throw new Error('busy')
  }
  const job = ask({
      subject: subjectName(subject),
      subjectId: subject,
      schoolYear: `${n}.º ano (${n <= 9 ? 'Ensino Básico' : 'Ensino Secundário'}, Portugal)`,
      course: courseInfo(course)?.name,
      courseId: course || undefined,
      year: n,
      language: 'pt-PT',
  })
    .then((reply) => {
      const parsed = JSON.parse(reply.replace(/```json|```/g, '').trim())
      const lessons: PlannedLesson[] = (parsed.lessons || [])
        .filter((l: any) => l && typeof l.title === 'string' && l.title.trim())
        .slice(0, MAX_LESSONS)
        .map((l: any) => ({ title: String(l.title).trim().slice(0, 60), description: String(l.description || '').trim().slice(0, 140), content: String(l.content || '').trim().slice(0, 400) || undefined }))
      if (lessons.length < 4) return null
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
