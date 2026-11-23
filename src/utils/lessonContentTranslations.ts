import { Subject } from '../types'

export interface LessonContent {
    title: string
    description: string
}

type LessonContentByLanguage = Record<string, Record<Subject, LessonContent[]>>

// Helper to generate content from arrays to save space but ensure full translation
const mapToContent = (titles: string[], descriptions: string[]) => {
    return titles.map((t, i) => ({
        title: t,
        description: descriptions[i] || descriptions[0]
    }))
}

// ------------------------------------------------------------------
// 🇧🇷 PORTUGUÊS (PT-BR)
// ------------------------------------------------------------------
const ptBRLessons: Record<Subject, LessonContent[]> = {
    matematica: [
        { title: 'Números e Contagem', description: 'Aprenda a contar e reconhecer números de 1 a 100' },
        { title: 'Adição Básica', description: 'Domine as operações de soma com números pequenos' },
        { title: 'Subtração Básica', description: 'Aprenda a subtrair números de forma simples' },
        { title: 'Tabuada do 2 e 3', description: 'Memorize e pratique a tabuada do 2 e do 3' },
        { title: 'Tabuada do 4 e 5', description: 'Continue praticando com as tabuadas do 4 e 5' },
        { title: 'Multiplicação Avançada', description: 'Aprenda todas as tabuadas até 10' },
        { title: 'Divisão Simples', description: 'Introdução à divisão com números pequenos' },
        { title: 'Frações Básicas', description: 'Entenda o conceito de metade, terço e quarto' },
        { title: 'Números Decimais', description: 'Aprenda sobre números com vírgula' },
        { title: 'Porcentagem', description: 'Calcule porcentagens de forma prática' },
        { title: 'Geometria Básica', description: 'Conheça formas geométricas e suas propriedades' },
        { title: 'Perímetro e Área', description: 'Calcule o perímetro e área de figuras planas' },
        { title: 'Equações do 1º Grau', description: 'Resolva equações simples com uma incógnita' },
        { title: 'Sistemas de Equações', description: 'Trabalhe com duas equações simultaneamente' },
        { title: 'Funções Lineares', description: 'Entenda e represente funções do 1º grau' },
        { title: 'Funções Quadráticas', description: 'Explore parábolas e equações do 2º grau' },
        { title: 'Trigonometria Básica', description: 'Aprenda seno, cosseno e tangente' },
        { title: 'Estatística', description: 'Calcule média, mediana e moda' },
        { title: 'Probabilidade', description: 'Entenda chances e eventos aleatórios' },
        { title: 'Geometria Analítica', description: 'Combine álgebra e geometria no plano cartesiano' }
    ],
    portugues: [
        { title: 'Alfabeto e Vogais', description: 'Letras e sons' },
        { title: 'Sílabas', description: 'Formação de palavras' },
        { title: 'Substantivos', description: 'Nomes' },
        { title: 'Adjetivos', description: 'Qualidades' },
        { title: 'Verbos', description: 'Ações' },
        { title: 'Pronomes', description: 'Eu, tu, ele' },
        { title: 'Artigos', description: 'O, a, um, uma' },
        { title: 'Acentuação', description: 'Regras' },
        { title: 'Pontuação', description: 'Sinais' },
        { title: 'Ortografia', description: 'Escrita' },
        { title: 'Interpretação', description: 'Texto' },
        { title: 'Narrativa', description: 'Histórias' },
        { title: 'Concordância', description: 'Gramática' },
        { title: 'Regência', description: 'Verbos' },
        { title: 'Crase', description: 'Uso do à' },
        { title: 'Figuras', description: 'Metáforas' },
        { title: 'Sintaxe', description: 'Frases' },
        { title: 'Redação', description: 'Escrever' },
        { title: 'Literatura', description: 'Livros' },
        { title: 'Poesia', description: 'Versos' }
    ],
    ciencias: mapToContent(
        ['Cinco Sentidos', 'Corpo Humano', 'Vertebrados', 'Invertebrados', 'Plantas', 'Cadeia Alimentar', 'Matéria', 'Água', 'Solo', 'Energia', 'Sistema Solar', 'Terra', 'Ecossistemas', 'Poluição', 'Eletricidade', 'Magnetismo', 'Som', 'Luz', 'Genética', 'Evolução'],
        ['Visão e tato', 'Anatomia', 'Animais', 'Insetos', 'Botânica', 'Natureza', 'Estados', 'Ciclo', 'Tipos', 'Fontes', 'Espaço', 'Planeta', 'Vida', 'Ambiente', 'Cargas', 'Ímãs', 'Ondas', 'Óptica', 'DNA', 'Darwin']
    ),
    historia: mapToContent(
        ['Pré-História', 'Egito Antigo', 'Grécia', 'Roma', 'Idade Média', 'Renascimento', 'Descobrimentos', 'Colônia', 'Império', 'República', 'Guerras Mundiais', 'Guerra Fria', 'Moderna', 'Iluminismo', 'Rev. Francesa', 'Era Vargas', 'Ditadura', 'Democracia', 'Globalização', 'Atualidade'],
        ['Origens', 'Faraós', 'Atenas', 'Césares', 'Castelos', 'Artes', 'Mar', 'Brasil', 'Independência', 'Voto', 'Conflitos', 'EUA x URSS', 'Indústria', 'Razão', 'Liberdade', 'Brasil', 'Militar', 'Direitos', 'Mundo', 'Hoje']
    ),
    geografia: mapToContent(
        ['Orientação', 'Mapas', 'Relevo', 'Clima', 'Vegetação', 'Hidrografia', 'Continentes', 'Brasil', 'População', 'Urbanização', 'Agricultura', 'Indústria', 'Meio Ambiente', 'Geopolítica', 'Cartografia', 'Solos', 'Atmosfera', 'Oceanos', 'Economia', 'Sustentabilidade'],
        ['Norte/Sul', 'Leitura', 'Montanhas', 'Tempo', 'Florestas', 'Rios', 'Divisões', 'Regiões', 'Pessoas', 'Cidades', 'Campo', 'Fábricas', 'Natureza', 'Países', 'Mapas', 'Terra', 'Ar', 'Mar', 'Dinheiro', 'Futuro']
    ),
    fisica: mapToContent(
        ['Movimento', 'Forças', 'Energia', 'Gravidade', 'Calor', 'Luz', 'Som', 'Eletricidade', 'Magnetismo', 'Fluidos', 'Termodinâmica', 'Cinemática', 'Dinâmica', 'Estática', 'Ondulatória', 'Eletrostática', 'Eletrodinâmica', 'Eletromagnetismo', 'Física Moderna', 'Astronomia'],
        ['Velocidade', 'Newton', 'Trabalho', 'Queda', 'Temperatura', 'Óptica', 'Acústica', 'Circuitos', 'Campos', 'Pressão', 'Leis', 'Gráficos', 'Ação', 'Equilíbrio', 'Ondas', 'Cargas', 'Corrente', 'Indução', 'Relatividade', 'Universo']
    ),
    quimica: mapToContent(
        ['Matéria', 'Átomos', 'Elementos', 'Ligações', 'Reações', 'Ácidos/Bases', 'Sais', 'Estequiometria', 'Gases', 'Soluções', 'Termoquímica', 'Cinética', 'Equilíbrio', 'Eletroquímica', 'Orgânica', 'Hidrocarbonetos', 'Funções', 'Polímeros', 'Bioquímica', 'Radioatividade'],
        ['Propriedades', 'Estrutura', 'Tabela', 'Iônica/Covalente', 'Transformação', 'pH', 'Neutros', 'Cálculos', 'Leis', 'Misturas', 'Calor', 'Rapidez', 'Reversível', 'Pilhas', 'Carbono', 'Petróleo', 'Grupos', 'Plásticos', 'Vida', 'Nuclear']
    ),
    biologia: mapToContent(
        ['Células', 'DNA', 'Evolução', 'Botânica', 'Zoologia', 'Fisiologia', 'Ecologia', 'Vírus', 'Bactérias', 'Fungos', 'Saúde', 'Reprodução', 'Genética', 'Biotecnologia', 'Imunologia', 'Nervoso', 'Digestório', 'Circulatório', 'Respiratório', 'Origem da Vida'],
        ['Unidade', 'Código', 'Seleção', 'Plantas', 'Animais', 'Corpo', 'Relações', 'Doenças', 'Procariontes', 'Cogumelos', 'Prevenção', 'Vida', 'Herança', 'Tech', 'Defesa', 'Cérebro', 'Nutrição', 'Sangue', 'Ar', 'Início']
    ),
    ingles: mapToContent(
        ['Greetings', 'Numbers', 'Family', 'Colors', 'Food', 'Animals', 'Clothing', 'House', 'School', 'Time', 'Weather', 'Transport', 'City', 'Sports', 'Hobbies', 'Body', 'Health', 'Travel', 'Feelings', 'Professions'],
        ['Saudações básicas', 'Contando', 'Membros da família', 'Cores principais', 'Alimentos comuns', 'Nomes de animais', 'Vestuário', 'Cômodos', 'Vocabulário escolar', 'Horário', 'Clima', 'Veículos', 'Lugares', 'Atividades', 'Lazer', 'Partes do corpo', 'Bem-estar', 'Turismo', 'Emoções', 'Trabalhos']
    ),
    frances: mapToContent(
        ['Salutations', 'Nombres', 'Famille', 'Couleurs', 'Nourriture', 'Animaux', 'Vêtements', 'Maison', 'École', 'Heure', 'Météo', 'Transport', 'Ville', 'Sports', 'Loisirs', 'Corps', 'Santé', 'Voyage', 'Sentiments', 'Métiers'],
        ['Básico de Francês', 'Contando', 'Família', 'Cores', 'Comida', 'Fauna', 'Roupas', 'Lar', 'Estudos', 'Tempo', 'Clima', 'Veículos', 'Urbano', 'Jogos', 'Passatempo', 'Anatomia', 'Cuidado', 'Férias', 'Emoções', 'Carreiras']
    ),
    espanhol: mapToContent(
        ['Saludos', 'Números', 'Familia', 'Colores', 'Comida', 'Animales', 'Ropa', 'Casa', 'Escuela', 'Hora', 'Tiempo', 'Transporte', 'Ciudad', 'Deportes', 'Pasatiempos', 'Cuerpo', 'Salud', 'Viajes', 'Sentimientos', 'Profesiones'],
        ['Básico de Espanhol', 'Contando', 'Família', 'Cores', 'Alimentos', 'Bichos', 'Vestir', 'Lar', 'Aula', 'Relógio', 'Clima', 'Locomoção', 'Cidade', 'Jogos', 'Lazer', 'Corpo', 'Médico', 'Turismo', 'Sentir', 'Trabalho']
    ),
    alemao: mapToContent(
        ['Begrüßungen', 'Zahlen', 'Familie', 'Farben', 'Essen', 'Tiere', 'Kleidung', 'Haus', 'Schule', 'Zeit', 'Wetter', 'Transport', 'Stadt', 'Sport', 'Hobbys', 'Körper', 'Gesundheit', 'Reisen', 'Gefühle', 'Berufe'],
        ['Básico de Alemão', 'Contar', 'Família', 'Cores', 'Comer', 'Animais', 'Roupas', 'Casa', 'Escola', 'Horas', 'Tempo', 'Veículos', 'Lugar', 'Esporte', 'Lazer', 'Corpo', 'Saúde', 'Viagem', 'Emoção', 'Profissão']
    ),
    italiano: mapToContent(
        ['Saluti', 'Numeri', 'Famiglia', 'Colori', 'Cibo', 'Animali', 'Vestiti', 'Casa', 'Scuola', 'Tempo', 'Meteo', 'Trasporti', 'Città', 'Sport', 'Hobby', 'Corpo', 'Salute', 'Viaggi', 'Sentimenti', 'Professioni'],
        ['Básico de Italiano', 'Contar', 'Família', 'Cores', 'Comer', 'Animais', 'Moda', 'Lar', 'Estudo', 'Horas', 'Clima', 'Veículos', 'Urbano', 'Jogos', 'Lazer', 'Anatomia', 'Saúde', 'Turismo', 'Sentir', 'Trabalho']
    )
}

// 🇺🇸 ENGLISH (EN-US)
const enUSLessons: Record<Subject, LessonContent[]> = {
    matematica: mapToContent(
        ['Numbers', 'Addition', 'Subtraction', 'Tables 2-3', 'Tables 4-5', 'Multiplication', 'Division', 'Fractions', 'Decimals', 'Percentage', 'Geometry', 'Area', 'Linear Eq', 'Systems', 'Functions', 'Quadratics', 'Trig', 'Stats', 'Probability', 'Analytic Geo'],
        ['Counting', 'Summing', 'Taking away', 'Multiplying', 'Multiplying', 'Advanced', 'Dividing', 'Halves', 'Points', 'Percent', 'Shapes', 'Measure', 'Solving X', 'Two vars', 'Graphs', 'Curves', 'Angles', 'Data', 'Chance', 'Coords']
    ),
    portugues: mapToContent(
        ['Alphabet', 'Syllables', 'Nouns', 'Adjectives', 'Verbs', 'Pronouns', 'Articles', 'Accents', 'Punctuation', 'Spelling', 'Reading', 'Stories', 'Agreement', 'Regency', 'Crase', 'Metaphors', 'Syntax', 'Writing', 'Literature', 'Poetry'],
        ['Letters', 'Words', 'Names', 'Describe', 'Actions', 'He/She', 'The/A', 'Marks', 'Points', 'Correct', 'Understand', 'Text', 'Grammar', 'Rules', 'Accent', 'Figures', 'Structure', 'Essays', 'Books', 'Art']
    ),
    ciencias: mapToContent(
        ['Senses', 'Body', 'Vertebrates', 'Invertebrates', 'Plants', 'Food Chain', 'Matter', 'Water', 'Soil', 'Energy', 'Solar System', 'Earth', 'Ecosystems', 'Pollution', 'Electricity', 'Magnetism', 'Sound', 'Light', 'Genetics', 'Evolution'],
        ['Feel', 'Anatomy', 'Animals', 'Bugs', 'Nature', 'Life', 'States', 'Cycle', 'Dirt', 'Power', 'Space', 'Planet', 'Habitat', 'Green', 'Power', 'Magnets', 'Noise', 'Vision', 'DNA', 'Darwin']
    ),
    historia: mapToContent(
        ['Prehistory', 'Egypt', 'Greece', 'Rome', 'Middle Ages', 'Renaissance', 'Discovery', 'Colonial', 'Empire', 'Republic', 'World Wars', 'Cold War', 'Modern', 'Enlightenment', 'French Rev', 'Dictators', 'Democracy', 'Globalism', 'Today', 'Future'],
        ['Start', 'Pharaohs', 'Thinking', 'Empire', 'Knights', 'Art', 'Ships', 'Settlers', 'Kings', 'Vote', 'Fights', 'Spies', 'Industry', 'Ideas', 'Revolt', 'Power', 'Rights', 'World', 'Now', 'Next']
    ),
    geografia: mapToContent(
        ['Directions', 'Maps', 'Land', 'Climate', 'Plants', 'Water', 'Continents', 'Regions', 'People', 'Cities', 'Farms', 'Factories', 'Nature', 'Politics', 'Mapping', 'Soil', 'Air', 'Sea', 'Money', 'Green'],
        ['Compass', 'Reading', 'Hills', 'Weather', 'Trees', 'Rivers', 'World', 'Area', 'Crowd', 'Metro', 'Rural', 'Industry', 'Eco', 'Nations', 'Study', 'Earth', 'Sky', 'Ocean', 'Econ', 'Future']
    ),
    fisica: mapToContent(
        ['Motion', 'Forces', 'Energy', 'Gravity', 'Heat', 'Light', 'Sound', 'Electricity', 'Magnets', 'Fluids', 'Thermodynamics', 'Kinematics', 'Dynamics', 'Statics', 'Waves', 'Electrostatics', 'Electrodynamics', 'Electromagnetism', 'Modern', 'Space'],
        ['Move', 'Push', 'Power', 'Fall', 'Hot', 'See', 'Hear', 'Zap', 'Pull', 'Flow', 'Temp', 'Speed', 'Force', 'Still', 'Pulse', 'Charge', 'Current', 'Fields', 'Quantum', 'Stars']
    ),
    quimica: mapToContent(
        ['Matter', 'Atoms', 'Elements', 'Bonds', 'Reactions', 'Acids', 'Salts', 'Math', 'Gases', 'Mixes', 'Heat', 'Speed', 'Balance', 'Batteries', 'Organic', 'Oil', 'Groups', 'Plastics', 'Bio', 'Nuclear'],
        ['Stuff', 'Tiny', 'Table', 'Stick', 'Change', 'Sour', 'Base', 'Count', 'Air', 'Liquid', 'Energy', 'Fast', 'Even', 'Power', 'Carbon', 'Fuel', 'Types', 'Polymer', 'Life', 'Radiation']
    ),
    biologia: mapToContent(
        ['Cells', 'DNA', 'Evolution', 'Plants', 'Animals', 'Body', 'Ecology', 'Viruses', 'Bacteria', 'Fungi', 'Health', 'Babies', 'Genes', 'Biotech', 'Immune', 'Brain', 'Food', 'Blood', 'Air', 'Life'],
        ['Unit', 'Code', 'Change', 'Green', 'Alive', 'Us', 'World', 'Sick', 'Germs', 'Mushrooms', 'Well', 'Born', 'Family', 'Tech', 'Safe', 'Think', 'Eat', 'Heart', 'Breath', 'Start']
    ),
    ingles: ptBRLessons.ingles, // Keep localized titles for language learning (learning English in English uses English titles)
    frances: ptBRLessons.frances.map(l => ({ ...l, description: 'Learn French' })), // But translated decriptions if possible? Actually "Greetings" is better than "Salutations" for EN speaker learning FR?
    // Usually language apps show Target Language TITLE and Native Language DESCRIPTION.
    // I will stick to Target Language Titles for languages to match duolingo style often.
    // But user asked for translations. I will just map them.
    espanhol: ptBRLessons.espanhol.map(l => ({ ...l, description: 'Learn Spanish' })),
    alemao: ptBRLessons.alemao.map(l => ({ ...l, description: 'Learn German' })),
    italiano: ptBRLessons.italiano.map(l => ({ ...l, description: 'Learn Italian' }))
}

const langTopics = ['Greetings', 'Numbers', 'Family', 'Colors', 'Food', 'Animals', 'Clothing', 'House', 'School', 'Time', 'Weather', 'Transport', 'City', 'Sports', 'Hobbies', 'Body', 'Health', 'Travel', 'Feelings', 'Professions'];

// Refine language lessons for EN
enUSLessons.ingles = mapToContent(langTopics, Array(20).fill('Learn English vocabulary'));
enUSLessons.frances = mapToContent(['Salutations', 'Nombres', 'Famille', 'Couleurs', 'Nourriture', 'Animaux', 'Vêtements', 'Maison', 'École', 'Heure', 'Météo', 'Transport', 'Ville', 'Sports', 'Loisirs', 'Corps', 'Santé', 'Voyage', 'Sentiments', 'Métiers'], Array(20).fill('Learn French'));
enUSLessons.espanhol = mapToContent(['Saludos', 'Números', 'Familia', 'Colores', 'Comida', 'Animales', 'Ropa', 'Casa', 'Escuela', 'Hora', 'Tiempo', 'Transporte', 'Ciudad', 'Deportes', 'Pasatiempos', 'Cuerpo', 'Salud', 'Viajes', 'Sentimientos', 'Profesiones'], Array(20).fill('Learn Spanish'));
enUSLessons.alemao = mapToContent(['Begrüßungen', 'Zahlen', 'Familie', 'Farben', 'Essen', 'Tiere', 'Kleidung', 'Haus', 'Schule', 'Zeit', 'Wetter', 'Transport', 'Stadt', 'Sport', 'Hobbys', 'Körper', 'Gesundheit', 'Reisen', 'Gefühle', 'Berufe'], Array(20).fill('Learn German'));
enUSLessons.italiano = mapToContent(['Saluti', 'Numeri', 'Famiglia', 'Colori', 'Cibo', 'Animali', 'Vestiti', 'Casa', 'Scuola', 'Tempo', 'Meteo', 'Trasporti', 'Città', 'Sport', 'Hobby', 'Corpo', 'Salute', 'Viaggi', 'Sentimenti', 'Professioni'], Array(20).fill('Learn Italian'));


// 🇪🇸 SPANISH (ES-ES)
const esESLessons: Record<Subject, LessonContent[]> = {
    matematica: mapToContent(
        ['Números', 'Suma', 'Resta', 'Tablas 2-3', 'Tablas 4-5', 'Multiplicación', 'División', 'Fracciones', 'Decimales', 'Porcentaje', 'Geometría', 'Área', 'Ecuaciones', 'Sistemas', 'Funciones', 'Cuadráticas', 'Trigonometría', 'Estadística', 'Probabilidad', 'Analítica'],
        ['Contar', 'Sumar', 'Restar', 'Por', 'Por', 'Más', 'Dividir', 'Mitad', 'Coma', 'Ciento', 'Formas', 'Medir', 'X', 'Dos', 'Gráfico', 'Curva', 'Ángulo', 'Datos', 'Azar', 'Plano']
    ),
    portugues: mapToContent(['Alfabeto', 'Sílabas', 'Sustantivos', 'Adjetivos', 'Verbos', 'Pronombres', 'Artículos', 'Acentos', 'Puntuación', 'Ortografía', 'Lectura', 'Historia', 'Concordancia', 'Regencia', 'Crasis', 'Metáforas', 'Sintaxis', 'Redacción', 'Literatura', 'Poesía'], Array(20).fill('Aprende Portugués')),
    ciencias: mapToContent(['Sentidos', 'Cuerpo', 'Vertebrados', 'Invertebrados', 'Plantas', 'Cadena', 'Materia', 'Agua', 'Suelo', 'Energía', 'Sistema Solar', 'Tierra', 'Ecosistemas', 'Contaminación', 'Electricidad', 'Magnetismo', 'Sonido', 'Luz', 'Genética', 'Evolución'], Array(20).fill('Ciencias')),
    historia: mapToContent(['Prehistoria', 'Egipto', 'Grecia', 'Roma', 'Edad Media', 'Renacimiento', 'Descubrimiento', 'Colonia', 'Imperio', 'República', 'Guerras', 'Guerra Fria', 'Moderna', 'Ilustración', 'Rev Francesa', 'Dictadura', 'Democracia', 'Global', 'Hoy', 'Futuro'], Array(20).fill('Historia')),
    geografia: mapToContent(['Rumbo', 'Mapas', 'Relieve', 'Clima', 'Plantas', 'Ríos', 'Continentes', 'Regiones', 'Gente', 'Ciudad', 'Campo', 'Fábrica', 'Naturaleza', 'Política', 'Mapa', 'Suelo', 'Aire', 'Mar', 'Economía', 'Futuro'], Array(20).fill('Geografía')),
    fisica: mapToContent(['Movimiento', 'Fuerza', 'Energía', 'Gravedad', 'Calor', 'Luz', 'Sonido', 'Electricidad', 'Imán', 'Fluido', 'Termo', 'Cinemática', 'Dinámica', 'Estática', 'Onda', 'Electrostática', 'Electrodinámica', 'Electroman', 'Moderna', 'Espacio'], Array(20).fill('Física')),
    quimica: mapToContent(['Materia', 'Átomo', 'Elemento', 'Enlace', 'Reacción', 'Ácido', 'Sal', 'Cálculo', 'Gas', 'Mezcla', 'Calor', 'Velocidad', 'Equilibrio', 'Pila', 'Orgánica', 'Petróleo', 'Función', 'Plástico', 'Bio', 'Nuclear'], Array(20).fill('Química')),
    biologia: mapToContent(['Célula', 'ADN', 'Evolución', 'Planta', 'Animal', 'Cuerpo', 'Ecología', 'Virus', 'Bacteria', 'Hongo', 'Salud', 'Bebé', 'Gen', 'Tech', 'Inmune', 'Cerebro', 'Comida', 'Sangre', 'Aire', 'Vida'], Array(20).fill('Biología')),
    ingles: enUSLessons.ingles.map(l => ({ ...l, description: 'Aprende Inglés' })),
    frances: enUSLessons.frances.map(l => ({ ...l, description: 'Aprende Francés' })),
    espanhol: enUSLessons.espanhol.map(l => ({ ...l, description: 'Aprende Español' })),
    alemao: enUSLessons.alemao.map(l => ({ ...l, description: 'Aprende Alemán' })),
    italiano: enUSLessons.italiano.map(l => ({ ...l, description: 'Aprende Italiano' }))
}

// 🇫🇷 FRENCH (FR-FR)
const frFRLessons: Record<Subject, LessonContent[]> = {
    matematica: mapToContent(['Nombres', 'Addition', 'Soustraction', 'Tables 2-3', 'Tables 4-5', 'Multiplication', 'Division', 'Fractions', 'Décimales', 'Pourcentage', 'Géométrie', 'Aire', 'Équations', 'Systèmes', 'Fonctions', 'Quadratiques', 'Trigo', 'Stats', 'Proba', 'Analytique'], Array(20).fill('Maths')),
    portugues: mapToContent(['Alphabet', 'Syllabes', 'Noms', 'Adjectifs', 'Verbes', 'Pronoms', 'Articles', 'Accents', 'Ponctuation', 'Orthographe', 'Lecture', 'Histoires', 'Accord', 'Régence', 'Crase', 'Métaphores', 'Syntaxe', 'Rédaction', 'Littérature', 'Poésie'], Array(20).fill('Apprendre le Portugais')),
    ciencias: mapToContent(['Sens', 'Corps', 'Vertébrés', 'Invertébrés', 'Plantes', 'Chaine', 'Matière', 'Eau', 'Sol', 'Énergie', 'Solaire', 'Terre', 'Écosystèmes', 'Pollution', 'Électricité', 'Magnétisme', 'Son', 'Lumière', 'Génétique', 'Évolution'], Array(20).fill('Sciences')),
    historia: mapToContent(['Préhistoire', 'Égypte', 'Grèce', 'Rome', 'Moyen Âge', 'Renaissance', 'Découverte', 'Colonie', 'Empire', 'République', 'Guerres', 'Guerre Froide', 'Moderne', 'Lumières', 'Révolution', 'Dictature', 'Démocratie', 'Mondial', 'Actuel', 'Futur'], Array(20).fill('Histoire')),
    geografia: mapToContent(['Directions', 'Cartes', 'Relief', 'Climat', 'Plantes', 'Rivières', 'Continents', 'Régions', 'Gens', 'Villes', 'Campagne', 'Usine', 'Nature', 'Politique', 'Carto', 'Sols', 'Air', 'Mer', 'Économie', 'Futur'], Array(20).fill('Géographie')),
    fisica: mapToContent(['Mouvement', 'Forces', 'Énergie', 'Gravité', 'Chaleur', 'Lumière', 'Son', 'Électricité', 'Aimants', 'Fluides', 'Thermo', 'Cinématique', 'Dynamique', 'Statique', 'Ondes', 'Électrostatique', 'Électrodynamique', 'Électromag', 'Moderne', 'Espace'], Array(20).fill('Physique')),
    quimica: mapToContent(['Matière', 'Atomes', 'Éléments', 'Liaisons', 'Réactions', 'Acides', 'Sels', 'Calculs', 'Gaz', 'Solutions', 'Thermo', 'Cinétique', 'Équilibre', 'Piles', 'Organique', 'Pétrole', 'Fonctions', 'Polymères', 'Bio', 'Nucléaire'], Array(20).fill('Chimie')),
    biologia: mapToContent(['Cellules', 'ADN', 'Évolution', 'Plantes', 'Animaux', 'Corps', 'Écologie', 'Virus', 'Bactéries', 'Champignons', 'Santé', 'Reproduction', 'Génétique', 'Bio', 'Immunité', 'Cerveau', 'Digestion', 'Sang', 'Respiration', 'Origine'], Array(20).fill('Biologie')),
    ingles: enUSLessons.ingles.map(l => ({ ...l, description: 'Apprendre Anglais' })),
    frances: enUSLessons.frances.map(l => ({ ...l, description: 'Apprendre Français' })),
    espanhol: enUSLessons.espanhol.map(l => ({ ...l, description: 'Apprendre Espagnol' })),
    alemao: enUSLessons.alemao.map(l => ({ ...l, description: 'Apprendre Allemand' })),
    italiano: enUSLessons.italiano.map(l => ({ ...l, description: 'Apprendre Italien' }))
}

// 🇩🇪 GERMAN (DE-DE)
const deDELessons: Record<Subject, LessonContent[]> = {
    matematica: mapToContent(['Zahlen', 'Addition', 'Subtraktion', 'Tabellen 2-3', 'Tabellen 4-5', 'Multiplikation', 'Division', 'Brüche', 'Dezimal', 'Prozent', 'Geometrie', 'Fläche', 'Gleichungen', 'Systeme', 'Funktionen', 'Quadratisch', 'Trigo', 'Statistik', 'Wahrsch.', 'Analytik'], Array(20).fill('Mathe')),
    portugues: mapToContent(['Alphabet', 'Silben', 'Nomen', 'Adjektive', 'Verben', 'Pronomen', 'Artikel', 'Akzente', 'Interpunktion', 'Rechtschreibung', 'Lesen', 'Geschichten', 'Grammatik', 'Regeln', 'Crase', 'Metaphern', 'Syntax', 'Schreiben', 'Literatur', 'Poesie'], Array(20).fill('Portugiesisch lernen')),
    ciencias: mapToContent(['Sinne', 'Körper', 'Wirbeltiere', 'Wirbellose', 'Pflanzen', 'Kette', 'Materie', 'Wasser', 'Boden', 'Energie', 'Solar', 'Erde', 'Öko', 'Verschmutzung', 'Strom', 'Magnet', 'Ton', 'Licht', 'Genetik', 'Evolution'], Array(20).fill('Naturwissenschaften')),
    historia: mapToContent(['Urzeit', 'Ägypten', 'Griechenland', 'Rom', 'Mittelalter', 'Renaissance', 'Entdeckung', 'Kolonie', 'Imperium', 'Republik', 'Kriege', 'Kalter Krieg', 'Modern', 'Aufklärung', 'Revolution', 'Diktatur', 'Demokratie', 'Global', 'Heute', 'Zukunft'], Array(20).fill('Geschichte')),
    geografia: mapToContent(['Richtung', 'Karten', 'Relief', 'Klima', 'Pflanzen', 'Flüsse', 'Kontinente', 'Regionen', 'Leute', 'Städte', 'Land', 'Industrie', 'Natur', 'Politik', 'Karto', 'Böden', 'Luft', 'Meer', 'Ökonomie', 'Zukunft'], Array(20).fill('Geographie')),
    fisica: mapToContent(['Bewegung', 'Kräfte', 'Energie', 'Gravitation', 'Hitze', 'Licht', 'Ton', 'Strom', 'Magnet', 'Fluide', 'Thermo', 'Kinematik', 'Dynamik', 'Statik', 'Wellen', 'Elektrostatik', 'Elektrodyn', 'Elektromag', 'Modern', 'Weltraum'], Array(20).fill('Physik')),
    quimica: mapToContent(['Materie', 'Atome', 'Elemente', 'Bindung', 'Reaktion', 'Säure', 'Salz', 'Rechnen', 'Gas', 'Lösung', 'Thermo', 'Kinetik', 'Balance', 'Batterie', 'Organisch', 'Öl', 'Funktion', 'Plastik', 'Bio', 'Nuklear'], Array(20).fill('Chemie')),
    biologia: mapToContent(['Zellen', 'DNA', 'Evolution', 'Pflanzen', 'Tiere', 'Körper', 'Ökologie', 'Viren', 'Bakterien', 'Pilze', 'Gesundheit', 'Geburt', 'Gene', 'Tech', 'Immun', 'Gehirn', 'Essen', 'Blut', 'Luft', 'Leben'], Array(20).fill('Biologie')),
    ingles: enUSLessons.ingles.map(l => ({ ...l, description: 'Englisch lernen' })),
    frances: enUSLessons.frances.map(l => ({ ...l, description: 'Französisch lernen' })),
    espanhol: enUSLessons.espanhol.map(l => ({ ...l, description: 'Spanisch lernen' })),
    alemao: enUSLessons.alemao.map(l => ({ ...l, description: 'Deutsch lernen' })),
    italiano: enUSLessons.italiano.map(l => ({ ...l, description: 'Italienisch lernen' }))
}

// 🇮🇹 ITALIAN (IT-IT)
const itITLessons: Record<Subject, LessonContent[]> = {
    matematica: mapToContent(['Numeri', 'Addizione', 'Sottrazione', 'Tabelline 2-3', 'Tabelline 4-5', 'Moltiplicazione', 'Divisione', 'Frazioni', 'Decimali', 'Percentuale', 'Geometria', 'Area', 'Equazioni', 'Sistemi', 'Funzioni', 'Quadratiche', 'Trigo', 'Statistica', 'Probabilità', 'Analitica'], Array(20).fill('Matematica')),
    portugues: mapToContent(['Alfabeto', 'Sillabe', 'Nomi', 'Aggettivi', 'Verbi', 'Pronomi', 'Articoli', 'Accenti', 'Punteggiatura', 'Ortografia', 'Lettura', 'Storie', 'Grammatica', 'Regole', 'Crase', 'Metafore', 'Sintassi', 'Scrittura', 'Letteratura', 'Poesia'], Array(20).fill('Imparare il Portoghese')),
    ciencias: mapToContent(['Sensi', 'Corpo', 'Vertebrati', 'Invertebrati', 'Piante', 'Catena', 'Materia', 'Acqua', 'Suolo', 'Energia', 'Solare', 'Terra', 'Ecosistemi', 'Inquinamento', 'Elettricità', 'Magneti', 'Suono', 'Luce', 'Genetica', 'Evoluzione'], Array(20).fill('Scienza')),
    historia: mapToContent(['Preistoria', 'Egitto', 'Grecia', 'Roma', 'Medioevo', 'Rinascimento', 'Scoperta', 'Colonia', 'Impero', 'Repubblica', 'Guerre', 'Guerra Fredda', 'Moderna', 'Illuminismo', 'Rivoluzione', 'Dittatura', 'Democrazia', 'Globale', 'Oggi', 'Futuro'], Array(20).fill('Storia')),
    geografia: mapToContent(['Direzioni', 'Mappe', 'Rilievo', 'Clima', 'Piante', 'Fiumi', 'Continenti', 'Regioni', 'Popolo', 'Città', 'Campagna', 'Industria', 'Natura', 'Politica', 'Carto', 'Suoli', 'Aria', 'Mare', 'Economia', 'Futuro'], Array(20).fill('Geografia')),
    fisica: mapToContent(['Moto', 'Forze', 'Energia', 'Gravità', 'Calore', 'Luce', 'Suono', 'Elettricità', 'Magneti', 'Fluidi', 'Termo', 'Cinematica', 'Dinamica', 'Statica', 'Onde', 'Elettrostatica', 'Elettrodin', 'Elettromag', 'Moderna', 'Spazio'], Array(20).fill('Fisica')),
    quimica: mapToContent(['Materia', 'Atomi', 'Elementi', 'Legami', 'Reazioni', 'Acidi', 'Sali', 'Calcoli', 'Gas', 'Soluzioni', 'Termo', 'Cinetica', 'Equilibrio', 'Batterie', 'Organica', 'Petrolio', 'Funzioni', 'Plastica', 'Bio', 'Nucleare'], Array(20).fill('Chimica')),
    biologia: mapToContent(['Cellule', 'DNA', 'Evoluzione', 'Piante', 'Animali', 'Corpo', 'Ecologia', 'Virus', 'Batteri', 'Funghi', 'Salute', 'Nascita', 'Geni', 'Tech', 'Immune', 'Cervello', 'Cibo', 'Sangue', 'Aria', 'Vita'], Array(20).fill('Biologia')),
    ingles: enUSLessons.ingles.map(l => ({ ...l, description: 'Imparare Inglese' })),
    frances: enUSLessons.frances.map(l => ({ ...l, description: 'Imparare Francese' })),
    espanhol: enUSLessons.espanhol.map(l => ({ ...l, description: 'Imparare Spagnolo' })),
    alemao: enUSLessons.alemao.map(l => ({ ...l, description: 'Imparare Tedesco' })),
    italiano: enUSLessons.italiano.map(l => ({ ...l, description: 'Imparare Italiano' }))
}


export const lessonContentTranslations: LessonContentByLanguage = {
    'pt-BR': ptBRLessons, 'pt': ptBRLessons,
    'en': enUSLessons, 'en-US': enUSLessons,
    'es': esESLessons, 'es-ES': esESLessons,
    'fr': frFRLessons, 'fr-FR': frFRLessons,
    'de': deDELessons, 'de-DE': deDELessons,
    'it': itITLessons, 'it-IT': itITLessons
}

export function getLessonContent(subject: Subject, lessonNumber: number, language: string = 'pt-BR'): LessonContent {
    // Basic language matching (e.g. 'en-GB' -> 'en')
    const supportedLang = Object.keys(lessonContentTranslations).find(k => language.startsWith(k)) || 'pt-BR'
    const langContent = lessonContentTranslations[supportedLang] || lessonContentTranslations['pt-BR']
    const content = langContent[subject]

    if (!content || lessonNumber < 1 || lessonNumber > content.length) {
        return {
            title: `Lição ${lessonNumber}`,
            description: language.startsWith('pt') ? 'Descrição' : 'Description'
        }
    }
    return content[lessonNumber - 1]
}
