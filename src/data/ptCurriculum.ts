// The Portuguese school curriculum (Ensino Básico and Secundário), following the
// official matrices: which subjects each year and each secondary course has.
// For now the app is focused on Portugal; language is always European Portuguese.

import { SchoolYear } from '../types'

export type IconKind =
    | 'calculator' | 'book' | 'microscope' | 'columns' | 'globe' | 'atom' | 'flask' | 'leaf' | 'rock'
    | 'palette' | 'pencil' | 'music' | 'ball' | 'heart' | 'people' | 'monitor' | 'gear' | 'scales'
    | 'chart' | 'brain' | 'ruler' | 'quill' | 'bulb' | 'film' | 'mask' | 'chef' | 'plane' | 'cross'
    | 'lang'

export type Area = 'lingua' | 'matematica' | 'ciencias' | 'sociais' | 'artes' | 'expressoes' | 'tecnologia' | 'cidadania' | 'profissional'

export interface SubjectInfo {
    id: string
    name: string
    icon: IconKind
    area: Area
    /** Language subjects show their code on the icon. */
    code?: string
}

export const AREA_COLORS: Record<Area, string> = {
    lingua: '#ffdb7c',
    matematica: '#a9c8f5',
    ciencias: '#c0eadb',
    sociais: '#e8c9a6',
    artes: '#ff9fbb',
    expressoes: '#ff9f88',
    tecnologia: '#c9b8ff',
    cidadania: '#b7e4a1',
    profissional: '#9fe3c9',
}

export const AREA_NAMES: Record<Area, string> = {
    lingua: 'Línguas', matematica: 'Matemática', ciencias: 'Ciências', sociais: 'Ciências sociais e humanas', artes: 'Artes',
    expressoes: 'Expressões', tecnologia: 'Tecnologias', cidadania: 'Cidadania', profissional: 'Componente técnica (profissionais)',
}

const S = (id: string, name: string, icon: IconKind, area: Area, code?: string): SubjectInfo => ({ id, name, icon, area, code })

export const SUBJECTS: Record<string, SubjectInfo> = Object.fromEntries([
    // Línguas
    S('portugues', 'Português', 'book', 'lingua'),
    S('ingles', 'Inglês', 'lang', 'lingua', 'EN'),
    S('frances', 'Francês', 'lang', 'lingua', 'FR'),
    S('espanhol', 'Espanhol', 'lang', 'lingua', 'ES'),
    S('alemao', 'Alemão', 'lang', 'lingua', 'DE'),
    S('italiano', 'Italiano', 'lang', 'lingua', 'IT'),
    S('latim_a', 'Latim A', 'lang', 'lingua', 'LA'),
    S('latim_b', 'Latim B', 'lang', 'lingua', 'LA'),
    S('literatura_portuguesa', 'Literatura Portuguesa', 'quill', 'lingua'),
    // Matemática
    S('matematica', 'Matemática', 'calculator', 'matematica'),
    S('matematica_a', 'Matemática A', 'calculator', 'matematica'),
    S('matematica_b', 'Matemática B', 'calculator', 'matematica'),
    S('macs', 'Matemática Aplicada às Ciências Sociais', 'chart', 'matematica'),
    // Ciências
    S('estudo_meio', 'Estudo do Meio', 'leaf', 'ciencias'),
    S('ciencias', 'Ciências Naturais', 'microscope', 'ciencias'),
    S('fisico_quimica', 'Físico-Química', 'flask', 'ciencias'),
    S('fq_a', 'Física e Química A', 'atom', 'ciencias'),
    S('bio_geo', 'Biologia e Geologia', 'leaf', 'ciencias'),
    S('biologia', 'Biologia', 'leaf', 'ciencias'),
    S('fisica', 'Física', 'atom', 'ciencias'),
    S('quimica', 'Química', 'flask', 'ciencias'),
    S('geologia', 'Geologia', 'rock', 'ciencias'),
    // Sociais e humanas
    S('hgp', 'História e Geografia de Portugal', 'columns', 'sociais'),
    S('historia', 'História', 'columns', 'sociais'),
    S('geografia', 'Geografia', 'globe', 'sociais'),
    S('historia_a', 'História A', 'columns', 'sociais'),
    S('historia_b', 'História B', 'columns', 'sociais'),
    S('geografia_a', 'Geografia A', 'globe', 'sociais'),
    S('geografia_c', 'Geografia C', 'globe', 'sociais'),
    S('filosofia', 'Filosofia', 'bulb', 'sociais'),
    S('filosofia_a', 'Filosofia A', 'bulb', 'sociais'),
    S('economia_a', 'Economia A', 'chart', 'sociais'),
    S('economia_c', 'Economia C', 'chart', 'sociais'),
    S('sociologia', 'Sociologia', 'people', 'sociais'),
    S('psicologia_b', 'Psicologia B', 'brain', 'sociais'),
    S('direito', 'Direito', 'scales', 'sociais'),
    S('ciencia_politica', 'Ciência Política', 'scales', 'sociais'),
    S('antropologia', 'Antropologia', 'people', 'sociais'),
    // Artes
    S('ed_artistica', 'Educação Artística', 'palette', 'artes'),
    S('ed_visual', 'Educação Visual', 'palette', 'artes'),
    S('ed_musical', 'Educação Musical', 'music', 'artes'),
    S('desenho_a', 'Desenho A', 'pencil', 'artes'),
    S('gd_a', 'Geometria Descritiva A', 'ruler', 'artes'),
    S('hca', 'História da Cultura e das Artes', 'columns', 'artes'),
    S('oficina_artes', 'Oficina de Artes', 'palette', 'artes'),
    S('oficina_multimedia_b', 'Oficina Multimédia B', 'film', 'artes'),
    S('materiais_tecnologias', 'Materiais e Tecnologias', 'gear', 'artes'),
    S('formacao_musical', 'Formação Musical', 'music', 'artes'),
    S('instrumento', 'Instrumento', 'music', 'artes'),
    S('historia_musica', 'História da Cultura e das Artes (Música)', 'music', 'artes'),
    S('tecnica_danca', 'Técnicas de Dança', 'ball', 'artes'),
    S('expressao_criativa', 'Expressão Criativa', 'palette', 'artes'),
    S('interpretacao', 'Interpretação', 'mask', 'artes'),
    S('voz', 'Voz e Movimento', 'mask', 'artes'),
    // Expressões, cidadania, tecnologias
    S('ed_fisica', 'Educação Física', 'ball', 'expressoes'),
    S('cidadania', 'Cidadania e Desenvolvimento', 'people', 'cidadania'),
    S('emrc', 'Educação Moral e Religiosa', 'heart', 'cidadania'),
    S('area_integracao', 'Área de Integração', 'people', 'cidadania'),
    S('ed_tecnologica', 'Educação Tecnológica', 'gear', 'tecnologia'),
    S('tic', 'Tecnologias da Informação e Comunicação', 'monitor', 'tecnologia'),
    S('aplicacoes_informaticas_b', 'Aplicações Informáticas B', 'monitor', 'tecnologia'),
    // Profissionais (componente técnica)
    S('psi', 'Programação e Sistemas de Informação', 'monitor', 'profissional'),
    S('redes', 'Redes de Comunicação', 'gear', 'profissional'),
    S('sistemas_operativos', 'Sistemas Operativos', 'monitor', 'profissional'),
    S('arquitetura_computadores', 'Arquitetura de Computadores', 'gear', 'profissional'),
    S('eletronica', 'Eletrónica Fundamental', 'gear', 'profissional'),
    S('sistemas_digitais', 'Sistemas Digitais', 'monitor', 'profissional'),
    S('design_comunicacao', 'Design, Comunicação e Audiovisuais', 'palette', 'profissional'),
    S('tecnicas_multimedia', 'Técnicas de Multimédia', 'film', 'profissional'),
    S('turismo_info', 'Turismo – Informação e Animação Turística', 'plane', 'profissional'),
    S('operacoes_tecnicas', 'Operações Técnicas em Empresas Turísticas', 'plane', 'profissional'),
    S('tecnologia_alimentar', 'Tecnologia Alimentar', 'chef', 'profissional'),
    S('servicos_cozinha', 'Serviços de Cozinha e Pastelaria', 'chef', 'profissional'),
    S('gestao_controlo', 'Gestão e Controlo', 'chart', 'profissional'),
    S('economia_prof', 'Economia', 'chart', 'profissional'),
    S('contabilidade', 'Contabilidade e Fiscalidade', 'chart', 'profissional'),
    S('organizar_gerir', 'Organizar e Gerir a Empresa', 'chart', 'profissional'),
    S('estudo_movimento', 'Estudo do Movimento', 'ball', 'profissional'),
    S('desporto', 'Práticas Desportivas e Recreativas', 'ball', 'profissional'),
    S('gestao_desporto', 'Gestão do Desporto', 'chart', 'profissional'),
    S('saude', 'Saúde', 'cross', 'profissional'),
    S('comunicacao_relacao', 'Comunicação e Relações Interpessoais', 'people', 'profissional'),
    S('higiene_seguranca', 'Higiene, Segurança e Cuidados Gerais', 'cross', 'profissional'),
    S('fisica_quimica_prof', 'Física e Química', 'flask', 'profissional'),
    S('psicologia_prof', 'Psicologia', 'brain', 'profissional'),
].map((s) => [s.id, s]))

export interface CourseInfo {
    id: string
    short: string
    name: string
    type: 'ch' | 'prof' | 'art'
}

export const COURSE_TYPES: Record<CourseInfo['type'], string> = {
    ch: 'Científico-Humanísticos',
    prof: 'Profissionais',
    art: 'Artísticos especializados',
}

export const COURSES: CourseInfo[] = [
    { id: 'ct', short: 'CT', name: 'Ciências e Tecnologias', type: 'ch' },
    { id: 'cse', short: 'CSE', name: 'Ciências Socioeconómicas', type: 'ch' },
    { id: 'lh', short: 'LH', name: 'Línguas e Humanidades', type: 'ch' },
    { id: 'av', short: 'AV', name: 'Artes Visuais', type: 'ch' },
    { id: 'psi', short: 'PSI', name: 'Gestão e Programação de Sistemas Informáticos', type: 'prof' },
    { id: 'gei', short: 'GEI', name: 'Gestão de Equipamentos Informáticos', type: 'prof' },
    { id: 'tm', short: 'TM', name: 'Multimédia', type: 'prof' },
    { id: 'tur', short: 'TUR', name: 'Turismo', type: 'prof' },
    { id: 'coz', short: 'COZ', name: 'Cozinha/Pastelaria', type: 'prof' },
    { id: 'ges', short: 'GES', name: 'Gestão', type: 'prof' },
    { id: 'desp', short: 'DESP', name: 'Apoio à Gestão Desportiva', type: 'prof' },
    { id: 'sau', short: 'SAU', name: 'Auxiliar de Saúde', type: 'prof' },
    { id: 'mus', short: 'MUS', name: 'Música', type: 'art' },
    { id: 'dan', short: 'DAN', name: 'Dança', type: 'art' },
    { id: 'teat', short: 'TEAT', name: 'Teatro', type: 'art' },
]

export const YEARS: { value: SchoolYear; n: number; cycle: string }[] = [
    { value: '1ano', n: 1, cycle: '1.º ciclo' }, { value: '2ano', n: 2, cycle: '1.º ciclo' },
    { value: '3ano', n: 3, cycle: '1.º ciclo' }, { value: '4ano', n: 4, cycle: '1.º ciclo' },
    { value: '5ano', n: 5, cycle: '2.º ciclo' }, { value: '6ano', n: 6, cycle: '2.º ciclo' },
    { value: '7ano', n: 7, cycle: '3.º ciclo' }, { value: '8ano', n: 8, cycle: '3.º ciclo' },
    { value: '9ano', n: 9, cycle: '3.º ciclo' },
    { value: '1medio', n: 10, cycle: 'Secundário' }, { value: '2medio', n: 11, cycle: 'Secundário' },
    { value: '3medio', n: 12, cycle: 'Secundário' },
]

export const yearNumber = (y?: string | null) => YEARS.find((x) => x.value === y)?.n ?? 0
export const isSecondary = (y?: string | null) => yearNumber(y) >= 10
export const yearLabel = (y?: string | null) => (yearNumber(y) ? `${yearNumber(y)}.º ano` : '')
export const courseInfo = (id?: string | null) => COURSES.find((c) => c.id === id)

export interface SubjectGroup { title: string; items: string[] }

const LE = ['ingles', 'frances', 'espanhol', 'alemao']

/** The subjects of a year (and course, in secundário), grouped as in the official matrix. */
export function subjectGroupsFor(year?: string | null, course?: string | null): SubjectGroup[] {
    const n = yearNumber(year)
    if (!n) return []
    if (n <= 2) return [{ title: '1.º ciclo', items: ['portugues', 'matematica', 'estudo_meio', 'ed_artistica', 'ed_fisica', 'cidadania', 'emrc'] }]
    if (n <= 4) return [{ title: '1.º ciclo', items: ['portugues', 'matematica', 'estudo_meio', 'ingles', 'ed_artistica', 'ed_fisica', 'cidadania', 'emrc'] }]
    if (n <= 6) return [
        { title: 'Línguas e estudos sociais', items: ['portugues', 'ingles', 'hgp', 'cidadania'] },
        { title: 'Matemática e ciências', items: ['matematica', 'ciencias'] },
        { title: 'Educação artística e tecnológica', items: ['ed_visual', 'ed_tecnologica', 'ed_musical', 'tic'] },
        { title: 'Outras', items: ['ed_fisica', 'emrc'] },
    ]
    if (n <= 9) return [
        { title: 'Línguas', items: ['portugues', 'ingles', 'frances', 'espanhol', 'alemao'] },
        { title: 'Ciências sociais e humanas', items: ['historia', 'geografia', 'cidadania'] },
        { title: 'Matemática e ciências', items: ['matematica', 'ciencias', 'fisico_quimica'] },
        { title: 'Educação artística e tecnológica', items: ['ed_visual', 'tic'] },
        { title: 'Outras', items: ['ed_fisica', 'emrc'] },
    ]

    const c = courseInfo(course)
    const twelfth = n === 12
    if (!c) return []

    if (c.type === 'ch') {
        const general = twelfth ? ['portugues', 'ed_fisica', 'cidadania', 'emrc'] : ['portugues', ...LE, 'filosofia', 'ed_fisica', 'cidadania', 'emrc']
        const specific: Record<string, { core: string[]; options: string[] }> = {
            ct: twelfth
                ? { core: ['matematica_a'], options: ['biologia', 'fisica', 'quimica', 'geologia', 'psicologia_b', 'aplicacoes_informaticas_b', 'antropologia', 'filosofia_a'] }
                : { core: ['matematica_a', 'fq_a', 'bio_geo', 'gd_a'], options: [] },
            cse: twelfth
                ? { core: ['matematica_a'], options: ['economia_c', 'sociologia', 'direito', 'geografia_c', 'psicologia_b', 'ciencia_politica', 'aplicacoes_informaticas_b'] }
                : { core: ['matematica_a', 'economia_a', 'geografia_a', 'historia_b'], options: [] },
            lh: twelfth
                ? { core: ['historia_a'], options: ['sociologia', 'psicologia_b', 'filosofia_a', 'ciencia_politica', 'direito', 'geografia_c', 'latim_b'] }
                : { core: ['historia_a', 'geografia_a', 'macs', 'literatura_portuguesa', 'latim_a'], options: [] },
            av: twelfth
                ? { core: ['desenho_a'], options: ['oficina_artes', 'oficina_multimedia_b', 'materiais_tecnologias', 'psicologia_b', 'aplicacoes_informaticas_b'] }
                : { core: ['desenho_a', 'gd_a', 'matematica_b', 'hca'], options: [] },
        }
        const sp = specific[c.id]
        return [
            { title: 'Formação geral', items: general },
            { title: 'Formação específica', items: sp.core },
            ...(sp.options.length ? [{ title: 'Opções do 12.º ano', items: sp.options }] : []),
        ]
    }

    if (c.type === 'prof') {
        const scientific: Record<string, string[]> = {
            psi: ['matematica', 'fisica_quimica_prof'], gei: ['matematica', 'fisica_quimica_prof'], tm: ['matematica', 'fisica_quimica_prof'],
            tur: ['geografia', 'economia_prof'], coz: ['matematica', 'economia_prof'], ges: ['matematica', 'economia_prof'],
            desp: ['matematica', 'psicologia_prof', 'estudo_movimento'], sau: ['matematica', 'biologia', 'psicologia_prof'],
        }
        const technical: Record<string, string[]> = {
            psi: ['psi', 'redes', 'sistemas_operativos', 'arquitetura_computadores'],
            gei: ['eletronica', 'sistemas_digitais', 'arquitetura_computadores', 'redes'],
            tm: ['design_comunicacao', 'tecnicas_multimedia', 'psi'],
            tur: ['turismo_info', 'operacoes_tecnicas'],
            coz: ['tecnologia_alimentar', 'servicos_cozinha', 'gestao_controlo'],
            ges: ['contabilidade', 'organizar_gerir', 'gestao_controlo'],
            desp: ['desporto', 'gestao_desporto'],
            sau: ['saude', 'comunicacao_relacao', 'higiene_seguranca'],
        }
        return [
            { title: 'Sociocultural', items: ['portugues', 'ingles', 'area_integracao', 'tic', 'ed_fisica', 'cidadania'] },
            { title: 'Científica', items: scientific[c.id] || ['matematica'] },
            { title: 'Técnica', items: technical[c.id] || [] },
        ]
    }

    const artistic: Record<string, string[]> = {
        mus: ['formacao_musical', 'instrumento', 'historia_musica'],
        dan: ['tecnica_danca', 'expressao_criativa', 'hca'],
        teat: ['interpretacao', 'voz', 'hca'],
    }
    return [
        { title: 'Formação geral', items: twelfth ? ['portugues', 'ed_fisica', 'cidadania'] : ['portugues', 'ingles', 'filosofia', 'ed_fisica', 'cidadania'] },
        { title: 'Formação científica e técnica artística', items: artistic[c.id] || [] },
    ]
}

export const subjectsFor = (year?: string | null, course?: string | null) =>
    [...new Set(subjectGroupsFor(year, course).flatMap((g) => g.items))]

export const subjectInfo = (id: string): SubjectInfo => SUBJECTS[id] || { id, name: id, icon: 'book', area: 'lingua' }
export const subjectName = (id: string) => subjectInfo(id).name
export const subjectColor = (id: string) => AREA_COLORS[subjectInfo(id).area]
export const isMathSubject = (id: string) => subjectInfo(id).area === 'matematica'
export const isLanguageSubject = (id: string) => subjectInfo(id).area === 'lingua' && id !== 'literatura_portuguesa'
