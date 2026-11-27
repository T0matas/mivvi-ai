import { Exercise, AIResponse, Subject, LessonTheory } from '../types';
import { askKodu, streamKodu, KoduMessage } from './codevantumAI';
import { subjectName, yearNumber, courseInfo, isMathSubject, isLanguageSubject } from '../data/ptCurriculum';
import { getCachedPlan, fetchPlan } from './lessonPlan';

// The AI is Kodu, the Codevantum tutor (Groq gpt-oss), reached through this
// app's server at /api/ai/chat. Each lesson has two parts written by the AI
// for the subject, year and topic: the "aula" (explanation) and 10 exercises.
// There are no offline questions any more: when the AI can't answer, the
// lesson says so and offers to try again, instead of showing questions from
// another subject.

const getSchoolYearDescription = (year: string): string => {
  const n = yearNumber(year);
  if (!n) return year;
  const cycle = n <= 4 ? '1.º ciclo do Ensino Básico' : n <= 6 ? '2.º ciclo do Ensino Básico' : n <= 9 ? '3.º ciclo do Ensino Básico' : 'Ensino Secundário';
  return `${n}.º ano (${cycle}, Portugal, about ${n + 5} years old)`;
};

/** Foreign-language subjects are taught in their own language. */
const FOREIGN: Record<string, string> = { ingles: 'en', frances: 'fr', espanhol: 'es', alemao: 'de', italiano: 'it' };
export const subjectLanguage = (subject?: string | null) => (subject && FOREIGN[subject]) || null;

const parseJson = (reply: string): any => JSON.parse(reply.replace(/```json|```/g, '').trim());

export interface LessonRequest {
  lessonId: number
  subject: Subject
  schoolYear: string
  language?: string
  course?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

/** Context shared by the explanation and the exercises of one lesson. */
function lessonContext({ lessonId, subject, schoolYear, language = 'pt-PT', course, difficulty = 'medium' }: LessonRequest) {
  const lessonNumber = lessonId === 99999 ? undefined : lessonId % 100;
  const topic = lessonNumber ? getCachedPlan(subject, schoolYear, course)?.[lessonNumber - 1] : undefined;
  return {
    subject: subjectName(subject),
    subjectId: subject,
    schoolYear: getSchoolYearDescription(schoolYear),
    difficulty,
    language,
    course: courseInfo(course)?.name,
    lessonNumber,
    topic: topic?.title,
    topicDescription: [topic?.description, topic?.content].filter(Boolean).join(' — ') || undefined,
    totalLessons: getCachedPlan(subject, schoolYear, course)?.length || 20,
    isMath: isMathSubject(subject),
    isLanguage: isLanguageSubject(subject),
  };
}

// ── Exercise clean-up ───────────────────────────────────────────────────────

/** Keeps only well-formed visuals, trimmed to sensible sizes. */
const cleanVisual = (v: any): Exercise['visual'] => {
  if (!v || typeof v !== 'object') return undefined;
  const str = (s: any, n = 300) => (typeof s === 'string' ? s.trim().slice(0, n) : '');
  switch (v.kind) {
    case 'excerpt': return str(v.text) ? { kind: 'excerpt', text: str(v.text), source: str(v.source, 80) || undefined } : undefined;
    case 'formula': return str(v.text, 120) ? { kind: 'formula', text: str(v.text, 120) } : undefined;
    case 'table': {
      const headers = Array.isArray(v.headers) ? v.headers.map((h: any) => str(String(h), 40)).slice(0, 4) : [];
      const rows = Array.isArray(v.rows) ? v.rows.filter(Array.isArray).slice(0, 6).map((r: any[]) => r.map((c) => str(String(c), 60)).slice(0, headers.length)) : [];
      return headers.length >= 2 && rows.length ? { kind: 'table', headers, rows } : undefined;
    }
    case 'bars': {
      const items = Array.isArray(v.items) ? v.items.filter((i: any) => i && Number.isFinite(Number(i.value))).slice(0, 6).map((i: any) => ({ label: str(String(i.label), 30), value: Number(i.value) })) : [];
      return items.length >= 2 ? { kind: 'bars', title: str(v.title, 80) || undefined, items } : undefined;
    }
    case 'list': {
      const items = Array.isArray(v.items) ? v.items.map((i: any) => str(String(i), 120)).filter(Boolean).slice(0, 6) : [];
      return items.length >= 2 ? { kind: 'list', title: str(v.title, 80) || undefined, items } : undefined;
    }
    default: return undefined;
  }
};

/** Options without repeats (case/spacing ignored), always including the right answer. */
const uniqueOptions = (ex: any): string[] => {
  if (!Array.isArray(ex.options)) return [];
  const key = (o: string) => o.toLowerCase().replace(/\s+/g, ' ');
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of ex.options.map((x: any) => String(x).trim()).filter(Boolean)) {
    if (!seen.has(key(o))) { seen.add(key(o)); out.push(o); }
  }
  const correct = String(ex.correctAnswer || '').trim();
  if (correct && out.length && !seen.has(key(correct))) out[out.length - 1] = correct;
  return out;
};

/** A visual must help, not answer: hide the result in formulas, drop data visuals that show it. */
const safeVisual = (visual: Exercise['visual'], answer: string): Exercise['visual'] => {
  const ans = answer.trim();
  if (!visual || !ans) return visual;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const esc = ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const token = () => new RegExp(`(^|[^\\p{L}\\p{N}])${esc}(?=$|[^\\p{L}\\p{N}])`, 'giu');
  switch (visual.kind) {
    case 'formula': {
      const eq = visual.text.lastIndexOf('=');
      if (eq < 0) return visual;
      const left = visual.text.slice(0, eq + 1);
      const right = visual.text.slice(eq + 1);
      return token().test(right) ? { ...visual, text: left + right.replace(token(), '$1?') } : visual;
    }
    case 'list':
      return visual.items.some((i) => norm(i) === norm(ans)) ? undefined : visual;
    case 'table':
      return visual.rows.some((r) => r.some((c) => norm(c) === norm(ans))) ? undefined : visual;
    case 'bars':
      return visual.items.some((i) => norm(String(i.value)) === norm(ans) || norm(i.label) === norm(ans)) ? undefined : visual;
    case 'excerpt':
      return norm(visual.text) === norm(ans) ? undefined : visual;
  }
};

/** A picture for the question only if it doesn't give the answer away (no word in common with it). */
const imageThatHelps = (ex: any): string | undefined => {
  if (typeof ex.image !== 'string' || !ex.image.trim()) return undefined
  const SMALL = ['dos', 'das', 'com', 'por', 'para', 'uma', 'the', 'and', 'que']
  const words = (t: string) => new Set(normalizeAnswer(t).split(/[\s,.;:()\-]+/).filter((w) => w.length >= 3 && !SMALL.includes(w)))
  const img = words(ex.image)
  const answers = [ex.correctAnswer, ...(Array.isArray(ex.acceptedAnswers) ? ex.acceptedAnswers : [])].map((a: any) => String(a || ''))
  if (answers.some((a) => [...words(a)].some((w) => img.has(w)) || normalizeAnswer(ex.image) === normalizeAnswer(a))) return undefined
  return ex.image.trim().slice(0, 100)
}

const normalizeExercise = (ex: any, index: number): Exercise => {
  const options = uniqueOptions(ex);
  const typing = ex.type === 'typing' || options.length < 2;
  return {
    id: String(index + 1),
    question: String(ex.question || ''),
    correctAnswer: String(ex.correctAnswer || ''),
    acceptedAnswers: Array.isArray(ex.acceptedAnswers) ? ex.acceptedAnswers.map((a: any) => String(a).trim()).filter(Boolean).slice(0, 8) : [],
    options: typing ? [] : options,
    type: typing ? 'typing' : 'multiple-choice',
    exerciseType: ex.exerciseType === 'listening' && ex.audioText ? 'listening' : 'text',
    audioText: ex.audioText || undefined,
    hint: ex.hint ? String(ex.hint) : undefined,
    image: imageThatHelps(ex),
    // A listening exercise must not show what the student is supposed to hear.
    visual: ex.exerciseType === 'listening' ? undefined : safeVisual(cleanVisual(ex.visual), String(ex.correctAnswer || '')),
  };
};

const isUsable = (ex: any) => ex && typeof ex.question === 'string' && ex.question.trim() && String(ex.correctAnswer || '').trim();

// ── Lesson parts ────────────────────────────────────────────────────────────

/** Before trying again: when the AI was busy (429), give its per-minute limit time to recover. */
const BUSY_WAITS = [6000, 15000]
const isBusy = (e: unknown) => (e as any)?.status === 429
const pauseIfBusy = (e: unknown, attempt: number) => (isBusy(e) ? new Promise((r) => setTimeout(r, BUSY_WAITS[attempt] ?? 15000)) : Promise.resolve())

/** The explanation part ("aula") of a lesson. Returns null when the AI can't write it. */
export async function generateTheory(req: LessonRequest): Promise<LessonTheory | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = parseJson(await askKodu({ mode: 'lesson', context: lessonContext(req) }));
      const str = (s: any, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');
      const sections = (Array.isArray(data.sections) ? data.sections : [])
        .map((s: any) => {
          const items = Array.isArray(s?.diagram?.items) ? s.diagram.items.map((i: any) => ({ label: str(i?.label, 40), text: str(i?.text, 120) || undefined })).filter((i: any) => i.label).slice(0, 5) : []
          return {
            heading: str(s?.heading, 60),
            body: str(s?.body, 900),
            points: (Array.isArray(s?.points) ? s.points : []).map((p: any) => str(p, 140)).filter(Boolean).slice(0, 5),
            terms: (Array.isArray(s?.terms) ? s.terms : []).map((t: any) => ({ term: str(t?.term, 40), meaning: str(t?.meaning, 140) })).filter((t: any) => t.term && t.meaning).slice(0, 4),
            diagram: ['steps', 'compare', 'layers', 'cycle'].includes(s?.diagram?.kind) && items.length >= 2 ? { kind: s.diagram.kind, title: str(s.diagram.title, 60) || undefined, items } : undefined,
            // The Wikipedia titles the AI suggested (tried in order).
            image: str(s?.image, 200) || undefined,
            example: str(s?.example, 400) || undefined,
            minutes: Math.min(9, Math.max(1, Number(s?.minutes) || 2)),
          }
        })
        .filter((s: any) => s.heading && s.body)
        .slice(0, 5);
      if (!sections.length) throw new Error('empty lesson');
      return {
        title: str(data.title, 70) || sections[0].heading,
        goals: (Array.isArray(data.goals) ? data.goals : []).map((g: any) => str(g, 110)).filter(Boolean).slice(0, 4),
        intro: str(data.intro, 400),
        sections,
        keyPoints: (Array.isArray(data.keyPoints) ? data.keyPoints : []).map((k: any) => str(k, 140)).filter(Boolean).slice(0, 6),
        think: str(data.think, 200) || undefined,
      };
    } catch (error) {
      console.warn('Kodu could not write the explanation', error);
      if (attempt === 1 && !isBusy(error)) break;
      if (attempt < 2) await pauseIfBusy(error, attempt);
    }
  }
  return null;
}

/** The 10 exercises of a lesson, tied to its explanation when there is one. Throws when the AI can't write them. */
export async function generateLessonExercises(req: LessonRequest, theory?: LessonTheory | null): Promise<Exercise[]> {
  const context = {
    ...lessonContext(req),
    theory: theory ? [theory.title, ...theory.sections.map((s) => `${s.heading}: ${s.body}`), ...theory.keyPoints].join(' | ').slice(0, 1500) : undefined,
  };
  const STORAGE_KEY = `seen_questions_${req.subject}_${req.schoolYear}`;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let parsed: any = parseJson(await askKodu({ mode: 'exercises', context }));
      if (!Array.isArray(parsed)) parsed = parsed.exercises || Object.values(parsed).find(Array.isArray) || [];
      const all = (parsed as any[]).filter(isUsable);

      // Prefer questions this student hasn't seen lately, but never end up with too few.
      const seen = new Set<string>(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
      const sig = (ex: any) => String(ex.question).trim().toLowerCase();
      const fresh = all.filter((ex) => !seen.has(sig(ex)));
      const list = (fresh.length >= 6 ? fresh : all).slice(0, 10);
      if (list.length < 4) throw new Error('too few exercises');

      list.forEach((ex) => seen.add(sig(ex)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen].slice(-60)));
      return list.sort(() => Math.random() - 0.5).map(normalizeExercise);
    } catch (error) {
      lastError = error;
      console.warn('Kodu could not write the exercises (attempt ' + (attempt + 1) + ')', error);
      if (attempt === 1 && !isBusy(error)) break;
      if (attempt < 2) await pauseIfBusy(error, attempt);
    }
  }
  throw lastError || new Error('no exercises');
}

/** Kept for older callers. */
export function generateExercises(lessonId: number, difficulty: 'easy' | 'medium' | 'hard' = 'medium', subject: Subject = 'matematica', schoolYear = '1ano', language = 'pt-PT', course?: string) {
  return generateLessonExercises({ lessonId, difficulty, subject, schoolYear, language, course });
}

/** The final exam of a subject: questions over every topic of its plan. Throws when the AI can't write it. */
export async function generateExam(subject: Subject, schoolYear: string, course?: string, count = 20): Promise<Exercise[]> {
  // The exam covers the year's plan: make sure it exists first.
  const plan = getCachedPlan(subject, schoolYear, course) || (await fetchPlan(subject, schoolYear, course)) || []
  const context = {
    subject: subjectName(subject),
    subjectId: subject,
    schoolYear: getSchoolYearDescription(schoolYear),
    course: courseInfo(course)?.name,
    language: 'pt-PT',
    count,
    topics: plan.map((l) => [l.title, l.content || l.description].filter(Boolean).join(': ')),
  };
  let last: unknown = null;
  for (const wait of [0, 8000, 20000]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    try {
      let parsed: any = parseJson(await askKodu({ mode: 'exam', context }));
      if (!Array.isArray(parsed)) parsed = parsed.exercises || Object.values(parsed).find(Array.isArray) || [];
      const list = (parsed as any[]).filter(isUsable).slice(0, count).map(normalizeExercise);
      if (list.length >= Math.min(8, count)) return list;
      last = new Error('too few questions');
    } catch (e) {
      last = e;
      if ((e as any)?.status && (e as any).status !== 429) break;
    }
  }
  throw last || new Error('no exam');
}

// ── Checking answers ────────────────────────────────────────────────────────

/** Forgiving comparison: case, accents, punctuation and extra spaces don't matter. */
export const normalizeAnswer = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    // Signs matter in answers: "-7" is not "7" (the Unicode minus and dashes count as minus).
    .replace(/[−–—]/g, '-')
    .replace(/[^\p{L}\p{N}\s.,+\-/%=<>]/gu, ' ').replace(/\s+/g, ' ').trim();

const ARTICLES = /^(o|a|os|as|um|uma|the|a|an|el|la|los|las|le|les|un|une|der|die|das|il|lo|gli)\s+/;

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

const numbersIn = (s: string) => (s.replace(/(\d),(\d)/g, '$1.$2').match(/-?\d+(\.\d+)?/g) || []).map(Number);

/** Right without asking the AI? Same text, an accepted alternative, the same number, or a small typo. */
export function isCloseEnough(answer: string, exercise: Exercise): boolean {
  const user = normalizeAnswer(answer).replace(ARTICLES, '');
  if (!user) return false;
  const targets = [exercise.correctAnswer, ...(exercise.acceptedAnswers || [])].map((t) => normalizeAnswer(t).replace(ARTICLES, '')).filter(Boolean);
  for (const t of targets) {
    if (user === t || user.replace(/[.,\s]/g, '') === t.replace(/[.,\s]/g, '')) return true;
    // "100", "100 graus", "100°C" when the answer is "100 °C"
    const un = numbersIn(user), tn = numbersIn(t);
    if (tn.length === 1 && un.length === 1 && un[0] === tn[0] && t.replace(/[-\d.,\s]/g, '').length <= 8) return true;
    // a small typo in a word answer
    if (!tn.length && t.length >= 4) {
      const allowed = t.length >= 10 ? 2 : 1;
      if (levenshtein(user, t) <= allowed) return true;
    }
  }
  return false;
}

/** Checks a typed answer: locally first, then the AI decides whether a different wording is also right. */
export async function checkTypedAnswer(answer: string, exercise: Exercise): Promise<{ correct: boolean; exact: boolean }> {
  if (normalizeAnswer(answer) === normalizeAnswer(exercise.correctAnswer)) return { correct: true, exact: true };
  if (isCloseEnough(answer, exercise)) return { correct: true, exact: false };
  try {
    const data = parseJson(await askKodu({ mode: 'grade', context: { question: exercise.question, correctAnswer: [exercise.correctAnswer, ...(exercise.acceptedAnswers || [])].join(' / '), userAnswer: answer } }));
    return { correct: data.correct === true, exact: false };
  } catch {
    return { correct: false, exact: false };
  }
}

// ── Feedback and tutor chat ─────────────────────────────────────────────────

export async function getAIFeedback(
  exercise: Exercise,
  isCorrect: boolean,
  language = 'pt-PT',
  userAnswer?: string,
  subject?: string | null,
  lessonContext?: { schoolYear?: string | null; summary?: string },
): Promise<AIResponse> {
  const reasoning = exercise.explanation?.trim() || exercise.hint?.trim()
  const offline: AIResponse = isCorrect
    ? { feedback: 'Muito bem!', explanation: reasoning || `A resposta certa é "${exercise.correctAnswer}".`, encouragement: 'Continua assim!' }
    : {
        feedback: 'Vamos rever',
        explanation: reasoning || 'Volta à ideia principal da aula e identifica o que a pergunta está a pedir.',
        encouragement: 'O erro ajuda-nos a perceber o que vale a pena rever.',
      };
  try {
    const data = parseJson(await askKodu({
      mode: 'feedback',
      context: {
        question: exercise.question,
        options: exercise.options,
        correctAnswer: exercise.correctAnswer,
        userAnswer,
        isCorrect,
        language,
        subject: subject ? subjectName(subject) : undefined,
        subjectId: subject || undefined,
        schoolYear: lessonContext?.schoolYear || undefined,
        lessonSummary: lessonContext?.summary,
        hint: exercise.hint,
        exerciseExplanation: exercise.explanation,
      },
    }));
    return {
      feedback: data.feedback || offline.feedback,
      explanation: data.explanation || offline.explanation,
      encouragement: data.encouragement || offline.encouragement,
    };
  } catch (error) {
    console.warn('Kodu feedback unavailable, using offline text.', error);
    return offline;
  }
}

export interface TutorContext {
  language?: string
  name?: string
  schoolYear?: string | null
  subjects?: Subject[]
  subject?: Subject | null
  /** During a lesson: what is on screen. */
  lesson?: { topic?: string; summary?: string; question?: string; options?: string[]; answered?: boolean; correctAnswer?: string }
}

export const tutorContext = (ctx: TutorContext) => ({
  lessonTopic: ctx.lesson?.topic,
  lessonSummary: ctx.lesson?.summary,
  question: ctx.lesson?.question,
  options: ctx.lesson?.options,
  answered: ctx.lesson?.answered,
  correctAnswer: ctx.lesson?.answered ? ctx.lesson.correctAnswer : undefined,
  language: ctx.language,
  name: ctx.name,
  schoolYear: ctx.schoolYear ? getSchoolYearDescription(ctx.schoolYear) : undefined,
  subjects: (ctx.subjects || []).map(subjectName),
  subject: ctx.subject ? subjectName(ctx.subject) : undefined,
});

/** Kodu's tutor chat, streamed. `onToken` receives the text so far. */
export function chatWithKodu(messages: KoduMessage[], ctx: TutorContext, onToken: (text: string) => void, signal?: AbortSignal) {
  return streamKodu({ messages, context: tutorContext(ctx), signal }, onToken);
}

/** Kept for older callers: one non-streamed tutor answer. */
export async function chatWithAI(message: string, history: { role: string, content: string }[], language = 'pt-PT'): Promise<string> {
  const messages: KoduMessage[] = [
    ...history.map((h) => ({ role: (h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user') as KoduMessage['role'], content: h.content })),
    { role: 'user', content: message },
  ];
  try {
    return await askKodu({ mode: 'tutor', messages, context: { language } });
  } catch (error) {
    console.error('Kodu chat error:', error);
    return 'O Mivvi está offline de momento. Tenta outra vez daqui a pouco.';
  }
}
