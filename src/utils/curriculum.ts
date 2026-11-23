// Country-specific curriculum configuration
// Based on official education standards for each country

export type Country = 'BR' | 'PT' | 'US' | 'ES' | 'FR' | 'DE' | 'IT' | 'GB'

export interface CurriculumConfig {
    country: Country
    grades: {
        [key: string]: string[] // grade/year -> subjects
    }
}

// Map language codes to countries
export const languageToCountry: Record<string, Country> = {
    'pt-BR': 'BR',
    'pt-PT': 'PT',
    'en-US': 'US',
    'en-GB': 'GB',
    'en': 'US',
    'es': 'ES',
    'fr': 'FR',
    'de': 'DE',
    'it': 'IT'
}

// 🇧🇷 Brasil - Ensino Fundamental + Novo Ensino Médio
const brazilCurriculum: CurriculumConfig = {
    country: 'BR',
    grades: {
        '1ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia'],
        '2ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia'],
        '3ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia'],
        '4ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia'],
        '5ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '6ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '7ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '8ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'fisica', 'quimica', 'ingles'],
        '9ano': ['portugues', 'matematica', 'biologia', 'historia', 'geografia', 'fisica', 'quimica', 'ingles'],
        '1medio': ['portugues', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia'],
        '2medio': ['portugues', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia'],
        '3medio': ['portugues', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia']
    }
}

// 🇵🇹 Portugal - Ensino Básico + Secundário
const portugalCurriculum: CurriculumConfig = {
    country: 'PT',
    grades: {
        '1ano': ['portugues', 'matematica', 'ciencias'],
        '2ano': ['portugues', 'matematica', 'ciencias'],
        '3ano': ['portugues', 'matematica', 'ciencias', 'ingles'],
        '4ano': ['portugues', 'matematica', 'ciencias', 'ingles'],
        '5ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '6ano': ['portugues', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '7ano': ['portugues', 'matematica', 'ciencias', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '8ano': ['portugues', 'matematica', 'ciencias', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '9ano': ['portugues', 'matematica', 'ciencias', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '1medio': ['portugues', 'matematica', 'biologia', 'fisica', 'quimica'],
        '2medio': ['portugues', 'matematica', 'biologia', 'fisica', 'quimica'],
        '3medio': ['portugues', 'matematica', 'biologia', 'fisica', 'quimica']
    }
}

// 🇺🇸 USA - K-12
const usaCurriculum: CurriculumConfig = {
    country: 'US',
    grades: {
        '1ano': ['ingles', 'matematica', 'ciencias'],
        '2ano': ['ingles', 'matematica', 'ciencias'],
        '3ano': ['ingles', 'matematica', 'ciencias'],
        '4ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '5ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '6ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '7ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '8ano': ['ingles', 'matematica', 'ciencias', 'fisica', 'quimica', 'historia', 'geografia'],
        '9ano': ['ingles', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia'],
        '1medio': ['ingles', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia'],
        '2medio': ['ingles', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia'],
        '3medio': ['ingles', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia']
    }
}

// 🇬🇧 Inglaterra - Primary + Secondary + Sixth Form (A-Levels)
const ukCurriculum: CurriculumConfig = {
    country: 'GB',
    grades: {
        '1ano': ['ingles', 'matematica', 'ciencias'],
        '2ano': ['ingles', 'matematica', 'ciencias'],
        '3ano': ['ingles', 'matematica', 'ciencias'],
        '4ano': ['ingles', 'matematica', 'ciencias'],
        '5ano': ['ingles', 'matematica', 'ciencias'],
        '6ano': ['ingles', 'matematica', 'ciencias'],
        '7ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '8ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '9ano': ['ingles', 'matematica', 'ciencias', 'historia', 'geografia'],
        '1medio': ['ingles', 'matematica', 'fisica', 'quimica'], // A-Levels: 3-4 matérias especializadas
        '2medio': ['ingles', 'matematica', 'fisica', 'quimica'],
        '3medio': ['ingles', 'matematica', 'fisica', 'quimica']
    }
}

// 🇪🇸 Espanha - Primaria + ESO + Bachillerato
const spainCurriculum: CurriculumConfig = {
    country: 'ES',
    grades: {
        '1ano': ['espanhol', 'matematica', 'ciencias'],
        '2ano': ['espanhol', 'matematica', 'ciencias'],
        '3ano': ['espanhol', 'matematica', 'ciencias', 'ingles'],
        '4ano': ['espanhol', 'matematica', 'ciencias', 'ingles'],
        '5ano': ['espanhol', 'matematica', 'ciencias', 'ingles'],
        '6ano': ['espanhol', 'matematica', 'ciencias', 'ingles'],
        '7ano': ['espanhol', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '8ano': ['espanhol', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '9ano': ['espanhol', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '1medio': ['espanhol', 'matematica', 'biologia', 'fisica', 'quimica'],
        '2medio': ['espanhol', 'matematica', 'biologia', 'fisica', 'quimica'],
        '3medio': ['espanhol', 'matematica', 'biologia', 'fisica', 'quimica']
    }
}

// 🇫🇷 França - Élémentaire + Collège + Lycée (Baccalauréat)
const franceCurriculum: CurriculumConfig = {
    country: 'FR',
    grades: {
        '1ano': ['frances', 'matematica', 'ciencias'],
        '2ano': ['frances', 'matematica', 'ciencias'],
        '3ano': ['frances', 'matematica', 'ciencias'],
        '4ano': ['frances', 'matematica', 'ciencias', 'historia', 'geografia'],
        '5ano': ['frances', 'matematica', 'ciencias', 'historia', 'geografia'],
        '6ano': ['frances', 'matematica', 'ciencias', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '7ano': ['frances', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '8ano': ['frances', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '9ano': ['frances', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '1medio': ['frances', 'matematica', 'fisica', 'biologia', 'historia', 'geografia'],
        '2medio': ['frances', 'matematica', 'fisica', 'biologia'],
        '3medio': ['frances', 'matematica', 'fisica', 'biologia'] // Filosofia + Especialidades
    }
}

// 🇩🇪 Alemanha - Grundschule + Gymnasium (Abitur)
const germanyCurriculum: CurriculumConfig = {
    country: 'DE',
    grades: {
        '1ano': ['alemao', 'matematica', 'ciencias'],
        '2ano': ['alemao', 'matematica', 'ciencias'],
        '3ano': ['alemao', 'matematica', 'ciencias'],
        '4ano': ['alemao', 'matematica', 'ciencias'],
        '5ano': ['alemao', 'matematica', 'biologia', 'historia', 'geografia', 'ingles'],
        '6ano': ['alemao', 'matematica', 'biologia', 'fisica', 'historia', 'geografia', 'ingles'],
        '7ano': ['alemao', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '8ano': ['alemao', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '9ano': ['alemao', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '1medio': ['alemao', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '2medio': ['alemao', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles'],
        '3medio': ['alemao', 'matematica', 'biologia', 'fisica', 'quimica', 'historia', 'geografia', 'ingles']
    }
}

// 🇮🇹 Itália - Primaria + Media + Superiore (Liceo Scientifico)
const italyCurriculum: CurriculumConfig = {
    country: 'IT',
    grades: {
        '1ano': ['italiano', 'matematica', 'ciencias'],
        '2ano': ['italiano', 'matematica', 'ciencias', 'historia'],
        '3ano': ['italiano', 'matematica', 'ciencias', 'historia', 'geografia'],
        '4ano': ['italiano', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '5ano': ['italiano', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '6ano': ['italiano', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '7ano': ['italiano', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '8ano': ['italiano', 'matematica', 'ciencias', 'historia', 'geografia', 'ingles'],
        '9ano': ['italiano', 'matematica', 'biologia', 'fisica', 'historia'],
        '1medio': ['italiano', 'matematica', 'biologia', 'fisica', 'quimica'],
        '2medio': ['italiano', 'matematica', 'biologia', 'fisica', 'quimica'],
        '3medio': ['italiano', 'matematica', 'biologia', 'fisica', 'quimica']
    }
}

// All curricula
export const curricula: Record<Country, CurriculumConfig> = {
    BR: brazilCurriculum,
    PT: portugalCurriculum,
    US: usaCurriculum,
    GB: ukCurriculum,
    ES: spainCurriculum,
    FR: franceCurriculum,
    DE: germanyCurriculum,
    IT: italyCurriculum
}

export function getSubjectsForGrade(country: Country, schoolYear: string): string[] {
    const curriculum = curricula[country]
    if (!curriculum) {
        console.warn(`No curriculum found for country: ${country}`)
        return ['matematica', 'portugues', 'ciencias']
    }

    const subjects = curriculum.grades[schoolYear]
    if (!subjects) {
        console.warn(`No subjects found for ${country} - ${schoolYear}`)
        return ['matematica', 'portugues', 'ciencias']
    }

    return subjects
}

export function getCountryFromLanguage(language: string): Country {
    return languageToCountry[language] || 'BR'
}
