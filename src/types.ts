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
  /** Old local-only friend list (before friend requests existed). */
  friends?: string[]
  /** The unique id behind the name (see services/social toHandle), once claimed by an account. */
  handle?: string
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
  /** Final exams by subject: the best result (0–20) and the last attempt. */
  exams?: Record<Subject, ExamResult>
}

export interface ExamResult {
  /** Best mark so far, 0–20. */
  best: number
  /** Last attempt. */
  last: { score: number; correct: number; total: number; date: number; annulled?: boolean; reason?: string }
  attempts: number
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
  /** Other answers that also count as right in typing exercises (synonyms, other spellings). */
  acceptedAnswers?: string[]
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


/** The "aula" part of a lesson: what a teacher would explain before the exercises. */
export interface LessonTheory {
  title: string
  intro: string
  goals?: string[]
  sections: TheorySection[]
  keyPoints: string[]
  think?: string
}

/** A lesson summary kept in the Library after the lesson is done. */
export interface LibraryItem {
  id: string
  subject: Subject
  lessonId: number
  lessonNumber?: number
  title: string
  theory: LessonTheory
  correct: number
  total: number
  date: number
}

export interface TheoryDiagram {
  kind: 'steps' | 'compare' | 'layers' | 'cycle'
  title?: string
  items: { label: string; text?: string }[]
}

export interface TheorySection {
  heading: string
  body: string
  points?: string[]
  terms?: { term: string; meaning: string }[]
  diagram?: TheoryDiagram
  /** A Wikipedia article whose main picture illustrates the section. */
  image?: string
  example?: string
  minutes?: number
}
