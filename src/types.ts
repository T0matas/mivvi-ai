export type SchoolYear = '1ano' | '2ano' | '3ano' | '4ano' | '5ano' | '6ano' | '7ano' | '8ano' | '9ano' | '1medio' | '2medio' | '3medio'
/** A subject id from the curriculum catalogue (src/data/ptCurriculum.ts), e.g. 'matematica_a'. */
export type Subject = string

export interface UserProfile {
  schoolYear: SchoolYear | null
  /** Secondary course id (ptCurriculum COURSES), from 10.º ano on. */
  course?: string
  selectedSubjects: Subject[]
  difficulty: 'easy' | 'medium' | 'hard'
  language: 'pt-BR' | 'pt-PT' | 'en' | 'es' | 'fr' | 'de' | 'it'
  isOnboarded: boolean
  name?: string
  uid?: string
  lastNameChangeDate?: string
  friends?: string[] // List of friend UIDs or Names
}

export interface UserProgress {
  level: number
  xp: number
  streak: number
  hearts: number
  gems: number
  currentOutfit: string
  unlockedOutfits: string[]
  completedLessons: number[]
  currentLesson: number
  subjectProgress: Partial<Record<Subject, {
    completedLessons: number[]
    currentLesson: number
    xp: number
  }>>
  hasSeenTutorial?: boolean
  heartsRefillCount?: number
  lastRefillDate?: string
  lastDailyBonusDate?: string
  lastTrainingDate?: string
  dailyXP?: number
  lastXPDate?: string
  dailyLessons?: number
  dailyPerfectLessons?: number
  weeklyXP?: number
  claimedMissionIds?: string[]
}

export interface Exercise {
  id: string
  question: string
  options: string[]
  correctAnswer: string
  explanation?: string
  exerciseType?: 'text' | 'listening' | 'speaking' | 'matching'
  audioText?: string // Text to be spoken for listening exercises
  type?: 'typing' | 'multiple-choice' | 'speaking' // UI interaction type
  hint?: string // Optional hint for the exercise
  /** Something to look at with the question (from the AI). */
  visual?: ExerciseVisual
}

export interface Lesson {
  id: number
  title: string
  description: string
  subject: Subject
  schoolYear: SchoolYear
  lessonNumber: number
  exercises: Exercise[]
  xpReward: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  prerequisites?: number[]
  requiredXp?: number // Total XP required to unlock
}

export interface RoadmapNode {
  id: number
  lessonId: number
  position: { x: number; y: number }
  completed: boolean
  locked: boolean
}

export interface AIResponse {
  feedback: string
  explanation: string
  encouragement: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  imageUrl?: string // For attached or generated images
  imageType?: 'attachment' | 'generated' // Track image source
}


export type ExerciseVisual =
  | { kind: 'excerpt'; text: string; source?: string }
  | { kind: 'formula'; text: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'bars'; title?: string; items: { label: string; value: number }[] }
  | { kind: 'list'; title?: string; items: string[] }
