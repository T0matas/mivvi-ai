// The official curriculum behind each subject's lessons.
//
// • Ensino Básico and Secundário (científico-humanísticos): the Aprendizagens
//   Essenciais PDFs of the DGE, read on the server (no download for the
//   student). When dge.mec.pt is down, the Internet Archive copy is used.
// • Cursos profissionais: the official programmes (ANQEP/DGE), already split
//   into modules in prof.mjs (scripts/build-prof-curriculum.py).
//
// getCurriculum() returns the part of the document with the year's topics, in
// order, small enough to send to the AI that writes the lesson plan.

import PROF from './prof.mjs';

const AE = 'https://www.dge.mec.pt/sites/default/files/Curriculo/Aprendizagens_Essenciais/';
const cyc = (n) => (n <= 4 ? 1 : n <= 6 ? 2 : 3);

/** Aprendizagens Essenciais PDF for a subject and year (1–12), or null. */
export function aeDocument(subject, n) {
  const c = cyc(n);
  const f = (() => {
    switch (subject) {
      case 'portugues':
        if (n === 1) return '1_ciclo/ae_1.o_ano_1o_ciclo_eb_portugues.pdf';
        if (n <= 4) return `1_ciclo/portugues_1c_${n}a_ff.pdf`;
        if (n <= 6) return `2_ciclo/${n}_portugues.pdf`;
        if (n <= 9) return `3_ciclo/portugues_3c_${n}a_ff.pdf`;
        return `${n}_portugues.pdf`;
      case 'matematica': return n <= 9 ? `${c}_ciclo/ae_mat_${n}.o_ano.pdf` : null;
      case 'estudo_meio': return n <= 4 ? `1_ciclo/${n}_estudo_do_meio.pdf` : null;
      case 'ed_artistica': return n <= 4 ? '1_ciclo/1c_artes_visuais.pdf' : null;
      case 'cidadania': return 'cidadania-desenvolvimento.pdf';
      case 'ed_fisica':
        if (n <= 4) return `1_ciclo/${n}_educacao_fisica.pdf`;
        if (n <= 6) return `2_ciclo/${n}_educacao_fisica.pdf`;
        if (n <= 9) return `3_ciclo/educacao_fisica_3c_${n}a_ff.pdf`;
        return `${n}_educacao_fisica.pdf`;
      case 'ingles':
        if (n <= 2) return null;
        if (n <= 4) return `1_ciclo/ingles_1c_${n}a_ff.pdf`;
        if (n <= 6) return `2_ciclo/${n}_ingles.pdf`;
        if (n <= 9) return `3_ciclo/ingles_3c_${n}a_ff.pdf`;
        return n === 12 ? '12_ingles_f_esp_cont.pdf' : `${n}_ingles_f_geral_cont.pdf`;
      case 'frances': case 'espanhol': case 'alemao':
        if (n >= 7 && n <= 9) return `3_ciclo/${subject}_3c_${n}a_ff.pdf`;
        if (n >= 10) return n === 12 ? `12_${subject}_f_esp_cont.pdf` : `${n}_${subject}_f_geral_cont.pdf`;
        return null;
      case 'tic':
        if (n <= 4) return '1_ciclo/oc_1_tic_1.pdf';
        if (n === 5) return '2_ciclo/5_tic.pdf';
        if (n === 6) return '2_ciclo/6_tic_2019.pdf';
        return n <= 9 ? `3_ciclo/tic_3c_${n}a_ff.pdf` : null;
      case 'hgp': return n === 5 || n === 6 ? `2_ciclo/${n}_historia_e_geografia_de_portugal.pdf` : null;
      case 'ciencias':
        if (n === 5 || n === 6) return `2_ciclo/${n}_ciencias_naturais.pdf`;
        return n >= 7 && n <= 9 ? `3_ciclo/ciencias_naturais_3c_${n}a_ff.pdf` : null;
      case 'ed_visual': return n === 5 || n === 6 ? '2_ciclo/educacao_visual_2c_ff.pdf' : n <= 9 && n >= 7 ? '3_ciclo/educacao_visual_3c_ff.pdf' : null;
      case 'ed_tecnologica': return n === 5 || n === 6 ? '2_ciclo/2c_educacao_tecnologica.pdf' : n <= 9 && n >= 7 ? '3_ciclo/3c_educacao_tecnologica.pdf' : null;
      case 'ed_musical': return n === 5 || n === 6 ? '2_ciclo/2c_educacao_musical.pdf' : n <= 9 && n >= 7 ? '3_ciclo/3c_educacao_musical.pdf' : null;
      case 'historia': return n >= 7 && n <= 9 ? `3_ciclo/historia_3c_${n}a_ff.pdf` : null;
      case 'geografia': return n >= 7 && n <= 9 ? `3_ciclo/${n}_geografia.pdf` : null;
      case 'fisico_quimica': return n === 9 ? '3_ciclo/fisico-quimica_3c_9a.pdf' : n === 7 || n === 8 ? `3_ciclo/fisico-quimica_3c_${n}a_ff.pdf` : null;
      case 'emrc': return n <= 9 ? `${c}_ciclo/emrc_${c}c_${n}a.pdf` : 'emrc_sec.pdf';
      // Secundário
      case 'filosofia': return n === 10 || n === 11 ? `${n}_filosofia.pdf` : null;
      case 'filosofia_a': return '12_filosofia_a.pdf';
      case 'matematica_a': return n >= 10 ? `mat_a_${n}_-_vf.pdf` : null;
      case 'matematica_b': return n === 10 ? 'mat_b_10_-_vf.pdf' : n === 11 ? 'mat_b_11-_vf.pdf' : null;
      case 'macs': return n === 10 || n === 11 ? `macs_${n}_-_vf.pdf` : null;
      case 'bio_geo': return n === 10 || n === 11 ? `${n}_biologia_e_geologia.pdf` : null;
      case 'fq_a': return n === 10 || n === 11 ? `${n}_fq_a.pdf` : null;
      case 'gd_a': return n === 10 || n === 11 ? `${n}_gda.pdf` : null;
      case 'hca': return n === 10 || n === 11 ? `${n}_hca.pdf` : null;
      case 'desenho_a': case 'historia_a': return n >= 10 ? `${n}_${subject}.pdf` : null;
      case 'economia_a': case 'geografia_a': case 'historia_b': case 'latim_a': case 'literatura_portuguesa':
        return n === 10 || n === 11 ? `${n}_${subject}.pdf` : null;
      case 'antropologia': case 'biologia': case 'ciencia_politica': case 'direito': case 'economia_c': case 'fisica':
      case 'geografia_c': case 'geologia': case 'latim_b': case 'psicologia_b': case 'quimica': case 'sociologia': case 'aplicacoes_informaticas_b':
        return `12_${subject}.pdf`;
      case 'materiais_tecnologias': return '12_materiais_e_tecnologias.pdf';
      case 'oficina_artes': return '12_oficina_de_artes.pdf';
      case 'oficina_multimedia_b': return '12_oficina_multimedia_b.pdf';
      default: return null;
    }
  })();
  return f ? AE + f : null;
}

/** Professional courses: which programme a subject follows. */
const PROF_SUBJECT = {
  portugues: 'socio_portugues', ingles: 'socio_ingles', area_integracao: 'socio_area_integracao', tic: 'socio_tic', ed_fisica: 'socio_ed_fisica',
  matematica: 'cien_matematica', fisica_quimica_prof: 'cien_fisica_quimica', geografia: 'cien_geografia', economia_prof: 'cien_economia',
  psicologia_prof: 'cien_psicologia', estudo_movimento: 'cien_estudo_movimento', biologia: 'cien_biologia',
  psi: 'psi_psi', redes: 'psi_redes', sistemas_operativos: 'psi_so', arquitetura_computadores: 'psi_arq',
  eletronica: 'gei_eletronica', sistemas_digitais: 'gei_sdac',
  design_comunicacao: 'tm_plano', tecnicas_multimedia: 'tm_plano',
  turismo_info: 'tur_info', operacoes_tecnicas: 'tur_operacoes',
  tecnologia_alimentar: 'coz_cozinha', servicos_cozinha: 'coz_cozinha',
  contabilidade: 'ges_contabilidade', organizar_gerir: 'ges_gestao',
  desporto: 'desp_plano', gestao_desporto: 'desp_plano',
  saude: 'sau_plano', comunicacao_relacao: 'sau_plano', higiene_seguranca: 'sau_plano',
};
const PROF_COURSES = new Set(['psi', 'gei', 'tm', 'tur', 'coz', 'ges', 'desp', 'sau']);

function profProgramme(subject, course) {
  if (course === 'gei' && subject === 'redes') return 'gei_dados';
  if (course === 'gei' && subject === 'arquitetura_computadores') return 'gei_sdac';
  if (subject === 'gestao_controlo') return course === 'ges' ? 'ges_calculo' : 'coz_cozinha';
  return PROF_SUBJECT[subject] || null;
}

// ── Text clean-up ───────────────────────────────────────────────────────────

// Teacher strategies ("ações estratégicas de ensino"), not content: dropped.
const TEACHER = /^(Solicitar|Propor|Promover|Orquestrar|Acolher|Incentivar|Proporcionar|Valorizar|Apoiar|Estimular|Recorrer|Privilegiar|Fomentar|Dinamizar|Implementar|Planificar|Envolver|Favorecer|Garantir|Sugerir|Pedir aos|Desafiar|Encorajar|Assegurar|Criar condições|Organizar atividades|Organizar o)\b/;

/** From PDF page texts to the year's topics and objectives, in order (≤ max chars). */
export function compactAE(pages, max = 18000) {
  let lines = pages.join('\n').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  // Start where the year's content table starts (that heading repeats on every page, so find it first).
  const STARTS = [/OPERACIONALIZA/i, /CONHECIMENTOS, CAPACIDADES E ATITUDES/i, /TEMAS, Tópicos/i, /^DOMÍNIOS?\b/, /ÁREAS TEMÁTICAS/i]
  let first = -1
  for (const re of STARTS) { first = lines.findIndex((l) => re.test(l)); if (first >= 0) break }
  lines = lines.slice(first > 0 ? first : Math.floor(lines.length * 0.12));
  const counts = new Map();
  lines.forEach((l) => counts.set(l, (counts.get(l) || 0) + 1));
  lines = lines.filter((l) => counts.get(l) < 4 && !/^PÁG\.?\s*\d+$/i.test(l) && !/\|\s*(\d+\.º|ARTICULA)/.test(l) && !/^[A-J](,\s*[A-J])*$/.test(l));
  // Join lines broken by the table layout into sentences.
  const paras = [];
  for (const l of lines) {
    const prev = paras[paras.length - 1];
    if (prev && !/[.:;!?]$/.test(prev) && /^[a-zà-ú(]/.test(l)) paras[paras.length - 1] = prev + ' ' + l;
    else paras.push(l);
  }
  const body = paras.filter((p) => p.length > 2
    && !TEACHER.test(p)
    && !/^\[?Exemplo/i.test(p)
    // Perfil dos Alunos descriptors and strategy sub-bullets, not content
    && !/\(([A-J],\s*)+[A-J]\)/.test(p)
    && !/^[-•o]\s/.test(p));
  const text = body.join('\n');
  if (text.length <= max) return text;
  // Too long: shorten every long paragraph (never cut the end: the last themes matter as much as the first).
  let out = text;
  for (let limit = 360; limit >= 60; limit -= 30) {
    out = body.map((p) => (p.length > limit ? p.slice(0, limit) + '…' : p)).join('\n');
    if (out.length <= max) return out;
  }
  // Still too long: keep the short lines (themes, topics) and drop every other long one.
  return body.filter((p, i) => p.length <= 60 || i % 2 === 0).map((p) => (p.length > 60 ? p.slice(0, 60) + '…' : p)).join('\n').slice(0, max);
}

// ── Fetching ────────────────────────────────────────────────────────────────

const cache = new Map();

async function fetchWithTimeout(url, ms, fetchImpl) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetchImpl(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Mivvi curriculum reader)' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const type = r.headers.get('content-type') || '';
    if (!/pdf|octet-stream/i.test(type)) throw new Error('not a pdf: ' + type);
    return new Uint8Array(await r.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

async function readPdf(url, fetchImpl) {
  let bytes;
  try {
    bytes = await fetchWithTimeout(url, 6000, fetchImpl);
  } catch {
    // dge.mec.pt is sometimes down: the Internet Archive keeps the same files.
    bytes = await fetchWithTimeout(`https://web.archive.org/web/2025id_/${url}`, 12000, fetchImpl);
  }
  const { extractText, getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: false });
  return Array.isArray(text) ? text : [text];
}

/**
 * The curriculum text for a subject/year/course, or null when there is no
 * official document for it (the AI then plans from its own knowledge).
 * Returns { kind: 'ae' | 'prof', title, url?, text }.
 */
export async function getCurriculum({ subject, year, course }, fetchImpl = globalThis.fetch) {
  const n = Number(year) || 0;
  const key = `${subject}|${n}|${course || ''}`;
  if (cache.has(key)) return cache.get(key);
  const job = (async () => {
    if (n >= 10 && PROF_COURSES.has(course)) {
      const id = profProgramme(subject, course);
      const prog = id && PROF[id];
      if (!prog) return null;
      // Modules run over the three years: this year gets its third, in order.
      if (prog.modules?.length) {
        const mods = prog.modules;
        const part = Math.min(2, Math.max(0, n - 10));
        const size = Math.ceil(mods.length / 3);
        const mine = mods.slice(part * size, part * size + size);
        const list = (mine.length ? mine : mods).map((m) => `Módulo ${m.n} – ${m.title}: ${m.content}`).join('\n\n');
        return { kind: 'prof', title: `Programa de ${prog.title} (cursos profissionais)`, text: list.slice(0, 14000), modules: mine.length ? mine.length : mods.length };
      }
      return { kind: 'prof', title: `Programa de ${prog.title} (cursos profissionais)`, text: (prog.text || '').slice(0, 14000) };
    }
    const url = aeDocument(subject, n);
    if (!url) return null;
    const pages = await readPdf(url, fetchImpl);
    return { kind: 'ae', title: 'Aprendizagens Essenciais (DGE)', url, text: compactAE(pages) };
  })().catch((e) => {
    console.warn('[curriculum]', key, e?.message || e);
    cache.delete(key);
    return null;
  });
  cache.set(key, job);
  return job;
}
