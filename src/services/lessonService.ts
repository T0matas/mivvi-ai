import { Lesson, Subject, SchoolYear } from '../types'
import type { PlannedLesson } from './lessonPlan'

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
 * The 20 lessons of a subject in a school year. Titles come from the AI plan
 * of that subject/year/course (services/lessonPlan) when it is ready.
 */
export function getLessonsBySubject(subject: Subject, schoolYear: SchoolYear, _language: string = 'pt-PT', plan?: PlannedLesson[] | null): Lesson[] {
    const lessons: Lesson[] = []
    const base = subjectSeed(subject, schoolYear) * 100
    for (let i = 1; i <= LESSONS_PER_SUBJECT; i++) {
        lessons.push({
            id: base + i,
            lessonNumber: i,
            title: plan?.[i - 1]?.title || `Lição ${i}`,
            description: plan?.[i - 1]?.description || '',
            subject,
            schoolYear,
            exercises: [],
            xpReward: 100,
            requiredXp: i === 1 ? 0 : Math.floor(((i - 1) * 40) + (i > 15 ? Math.pow(i - 15, 2) * 150 : 0)),
            difficulty: i <= 7 ? 'beginner' : i <= 14 ? 'intermediate' : 'advanced',
            prerequisites: i > 1 ? [base + i - 1] : undefined,
        })
    }
    return lessons
}


