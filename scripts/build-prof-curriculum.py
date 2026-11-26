"""
Builds server/curriculum/prof.mjs from the official professional-course
programmes (zip from ANQEP/DGE): for each programme used by the app, the list
of modules in order (title + objectives + contents), so lessons follow the
programme. Needs `pdftotext` (poppler) on PATH.

    python scripts/build-prof-curriculum.py "C:\\path\\Programas_Cursos_Profissionais.zip"
"""
import json, re, subprocess, sys, tempfile, zipfile, os

ZIP = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\danie\Downloads\Programas_Cursos_Profissionais.zip'
OUT = os.path.join(os.path.dirname(__file__), '..', 'server', 'curriculum', 'prof.mjs')

# key -> path inside the zip (after "Programas_Cursos_Profissionais/")
FILES = {
    'socio_portugues': 'Formação Sociocultural/Português.pdf',
    'socio_ingles': 'Formação Sociocultural/Inglês - Continuação.pdf',
    'socio_area_integracao': 'Formação Sociocultural/Área de Integração.pdf',
    'socio_tic': 'Formação Sociocultural/Tecnologias Informação Comunicação.pdf',
    'socio_ed_fisica': 'Formação Sociocultural/Educação Física.pdf',
    'cien_matematica': 'Formação Científica/Matemática.pdf',
    'cien_fisica_quimica': 'Formação Científica/Física Química.pdf',
    'cien_geografia': 'Formação Científica/Geografia.pdf',
    'cien_economia': 'Formação Científica/Economia.pdf',
    'cien_psicologia': 'Formação Científica/Psicologia.pdf',
    'cien_estudo_movimento': 'Formação Científica/Estudo Movimento.pdf',
    'cien_biologia': 'Formação Científica/Biologia.pdf',
    'psi_psi': 'Formação Técnica/Técnico de Gestão de Programação de Sistemas Informáticos/Programação e Sistemas de Informação.pdf',
    'psi_redes': 'Formação Técnica/Técnico de Gestão de Programação de Sistemas Informáticos/Redes de Comunicação.pdf',
    'psi_so': 'Formação Técnica/Técnico de Gestão de Programação de Sistemas Informáticos/Sistemas Operativos.pdf',
    'psi_arq': 'Formação Técnica/Técnico de Gestão de Programação de Sistemas Informáticos/Arquitetura de Computadores.pdf',
    'gei_eletronica': 'Formação Técnica/Técnico de Gestão de Equipamentos Informáticos/Eletrónica Fundamental.pdf',
    'gei_sdac': 'Formação Técnica/Técnico de Gestão de Equipamentos Informáticos/Sistemas Digitais e Arquitetura de Computadores.pdf',
    'gei_dados': 'Formação Técnica/Técnico de Gestão de Equipamentos Informáticos/Comunicação de Dados.pdf',
    'tm_plano': 'Formação Técnica/Técnico de Multimédia/Plano de estudos e elenco modular.pdf',
    'tur_info': 'Formação Técnica/Técnico de Turismo/Turismo - Informação e Animação Turística.pdf',
    'tur_operacoes': 'Formação Técnica/Técnico de Turismo/Operações Técnicas em Empresas Turísticas.pdf',
    'coz_cozinha': 'Formação Técnica/Técnico de Restauração - 2 Variantes/Serviços de Cozinha - Pastelaria (variante com o mesmo nome).pdf',
    'ges_contabilidade': 'Formação Técnica/Técnico de Gestão/Contabilidade e Fiscalidade (atualizado) Consulte Orientações.pdf',
    'ges_gestao': 'Formação Técnica/Técnico de Gestão/Gestão (atualizado) Consulte Orientações.pdf',
    'ges_calculo': 'Formação Técnica/Técnico de Gestão/Cálculo Financeiro e Estatística Aplicada.pdf',
    'desp_plano': 'Formação Técnica/Técnico de Apoio à Gestão Desportiva/Plano de Estudos e Elenco Modular.pdf',
    'sau_plano': 'Formação Técnica/Técnico Auxiliar de Saúde/Plano de Estudos e Elenco Modular.pdf',
}

HEAD = re.compile(r'^\s*M[ÓO]DULO\s+(\d+|[A-Z]\d+|OP\s*\d+|OPI)\b\s*[:.\-–]?\s*(.*)$')
CUT = re.compile(r'^\s*(Bibliografia|BIBLIOGRAFIA|Recursos|Situações de aprendizagem|Orientações metodológicas)\b')


def clean_lines(text):
    lines = [re.sub(r'\s+', ' ', l).strip() for l in text.splitlines()]
    counts = {}
    for l in lines:
        if l:
            counts[l] = counts.get(l, 0) + 1
    # page headers/footers repeat on every page
    return [l for l in lines if l and counts[l] < 4 and not re.fullmatch(r'(Pág\.?\s*)?\d+', l)]


def modules_of(lines):
    mods, cur = [], None
    for l in lines:
        m = HEAD.match(l)
        if m and l.isupper() or (m and l.upper().startswith('MÓDULO') and l[:6].isupper()):
            if cur:
                mods.append(cur)
            cur = {'n': m.group(1).replace(' ', ''), 'title': m.group(2).strip(), 'body': [], 'cut': False}
            continue
        if cur is None:
            continue
        if not cur['title'] and len(l) < 90:
            cur['title'] = l
            continue
        if CUT.match(l):
            cur['cut'] = True
        if not cur['cut']:
            cur['body'].append(l)
    if cur:
        mods.append(cur)
    out, seen = [], set()
    for m in mods:
        key = m['n']
        if key in seen:
            continue
        seen.add(key)
        body = ' '.join(m['body'])
        body = re.sub(r'\s+', ' ', body)
        # keep the objectives and contents, which come after the presentation
        i = max(body.find('Objectivos'), body.find('Objetivos'))
        j = max(body.find('Âmbito dos conteúdos'), body.find('Âmbito dos Conteúdos'))
        core = body[j:] if j >= 0 else body[i:] if i >= 0 else body
        if j >= 0 and i >= 0 and i < j:
            core = body[i:j][:500] + ' ' + body[j:]
        title = re.sub(r'^[,\s]+', '', m['title'])[:90]
        out.append({'n': key, 'title': title, 'content': core[:1400]})
    return out


def main():
    z = zipfile.ZipFile(ZIP)
    names = {}
    for info in z.infolist():
        n = info.filename
        try:
            n = n.encode('cp437').decode('cp850')
        except Exception:
            pass
        names[n.replace('Programas_Cursos_Profissionais/', '')] = info
    result = {}
    with tempfile.TemporaryDirectory() as tmp:
        for key, path in FILES.items():
            info = names.get(path)
            if not info:
                print('MISSING', key, path)
                continue
            pdf = os.path.join(tmp, key + '.pdf')
            open(pdf, 'wb').write(z.read(info))
            txt = subprocess.run(['pdftotext', '-enc', 'UTF-8', pdf, '-'], capture_output=True).stdout.decode('utf-8', 'ignore')
            lines = clean_lines(txt)
            mods = modules_of(lines)
            entry = {'title': path.split('/')[-1][:-4], 'modules': mods}
            if len(mods) < 3:
                entry['modules'] = []
                entry['text'] = re.sub(r'\s+', ' ', ' '.join(lines))[:24000]
            result[key] = entry
            print(key, len(mods), 'modules' if len(mods) >= 3 else '-> text ' + str(len(entry.get('text', ''))))
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// Generated by scripts/build-prof-curriculum.py from the official professional-course programmes.\n')
        f.write('// Do not edit by hand.\n')
        f.write('export default ' + json.dumps(result, ensure_ascii=False, indent=0) + '\n')


if __name__ == '__main__':
    main()
