import { Lesson, Subject, SchoolYear } from '../types'
import type { PlannedLesson } from './lessonPlan'

/** Lessons shown while a subject has no plan yet (placeholders). */
export const LESSONS_PER_SUBJECT = 20

/**
 * Generates a list of lessons for a given subject and school year
 * Each subject has 20 lessons organized in a progressive curriculum
 */
/** A stable number for a subject + year, so lesson ids never collide between subjects. */
function subjectSeed(subject: string, schoolYear: string): number {
    let h = 2166136261
    for (const ch of subject + '|' + schoolYear) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) }
    return (Math.abs(h) % 90000) + 10000
}

/**
 * The lessons of a subject in a school year: one per lesson of its plan
 * (services/lessonPlan, built from the official curriculum). Without a plan
 * yet, there are none.
 */
export function getLessonsBySubject(subject: Subject, schoolYear: SchoolYear, _language: string = 'pt-PT', plan?: PlannedLesson[] | null): Lesson[] {
    const lessons: Lesson[] = []
    const base = subjectSeed(subject, schoolYear) * 100
    const count = plan?.length || 0
    for (let i = 1; i <= count; i++) {
        lessons.push({
            id: base + i,
            lessonNumber: i,
            title: plan![i - 1].title,
            description: plan![i - 1].description || '',
            subject,
            schoolYear,
            exercises: [],
            xpReward: 100,
            requiredXp: 0,
            difficulty: i <= count / 3 ? 'beginner' : i <= (2 * count) / 3 ? 'intermediate' : 'advanced',
            prerequisites: i > 1 ? [base + i - 1] : undefined,
        })
    }
    return lessons
}


