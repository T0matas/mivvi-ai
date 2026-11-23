import { Exercise, AIResponse, Subject } from '../types';
import { askKodu, streamKodu, KoduMessage } from './codevantumAI';
import { subjectName, yearNumber, courseInfo, isMathSubject, isLanguageSubject } from '../data/ptCurriculum';
import { getCachedPlan } from './lessonPlan';

// The AI is Kodu, the Codevantum tutor (Groq gpt-oss), reached through this
// app's server at /api/ai/chat. Without it, the offline exercises are used.

// Helpers to map internal types to descriptive strings for the AI
// Descriptions for the AI come from the Portuguese curriculum catalogue.
const getSubjectDescription = (subject: Subject): string => subjectName(subject);

const getSchoolYearDescription = (year: string): string => {
  const n = yearNumber(year);
  if (!n) return year;
  const cycle = n <= 4 ? '1.º ciclo do Ensino Básico' : n <= 6 ? '2.º ciclo do Ensino Básico' : n <= 9 ? '3.º ciclo do Ensino Básico' : 'Ensino Secundário';
  return `${n}.º ano (${cycle}, Portugal, about ${n + 5} years old)`;
};

// Simple internal translation for fallback generation
const fallbackLang = (lang: string, key: 'q_prefix' | 'hint' | 'feedback_c' | 'feedback_i' | 'expl_c' | 'expl_i' | 'encourage' | 'chat_err' | 'listen_cmd' | 'write_cmd') => {
  const dict: any = {
    'pt-BR': {
      q_prefix: 'Quanto é',
      hint: 'Calcule o resultado',
      feedback_c: 'Muito bem! (Modo Offline)',
      feedback_i: 'Quase lá! (Modo Offline)',
      expl_c: 'A resposta está correta.',
      expl_i: 'A resposta correta é',
      encourage: 'Continue praticando!',
      chat_err: 'O Mivvi está offline de momento. Tenta outra vez daqui a pouco.'
    },
    'en': {
      q_prefix: 'What is',
      hint: 'Calculate the result',
      feedback_c: 'Great job! (Offline Mode)',
      feedback_i: 'Almost there! (Offline Mode)',
      expl_c: 'The answer is correct.',
      expl_i: 'The correct answer is',
      encourage: 'Keep practicing!',
      chat_err: 'Mivvi is offline right now. Please try again in a moment.'
    },
    'es': {
      q_prefix: '¿Cuánto es',
      hint: 'Calcula el resultado',
      feedback_c: '¡Muy bien! (Modo Offline)',
      feedback_i: '¡Casi! (Modo Offline)',
      expl_c: 'La respuesta es correcta.',
      expl_i: 'La respuesta correcta es',
      encourage: '¡Sigue practicando!',
      chat_err: 'Mivvi está sin conexión ahora. Inténtalo de nuevo en un momento.'
    },
    'fr': {
      q_prefix: 'Combien font',
      hint: 'Calcule le résultat',
      feedback_c: 'Bravo ! (Mode Hors-ligne)',
      feedback_i: 'Presque ! (Mode Hors-ligne)',
      expl_c: 'La réponse est correcte.',
      expl_i: 'La réponse correcte est',
      encourage: 'Continue de pratiquer !',
      chat_err: 'Je suis en mode hors-ligne.'
    },
    'de': {
      chat_err: 'Je suis en mode hors-ligne.',
      listen_cmd: 'Écoute et écris le mot :',
      write_cmd: 'Écris "{word}" en {target} :'
    }
  };
  const l = (dict[lang] || dict['pt-BR'] || dict['en']);
  return l[key];
}

// Multilingual Vocabulary for customized fallback generation
const vocabulary: Record<string, Record<string, string>> = {
  cat: { 'pt-BR': 'Gato', 'en': 'Cat', 'es': 'Gato', 'fr': 'Chat', 'de': 'Katze', 'it': 'Gatto' },
  dog: { 'pt-BR': 'Cachorro', 'en': 'Dog', 'es': 'Perro', 'fr': 'Chien', 'de': 'Hund', 'it': 'Cane' },
  apple: { 'pt-BR': 'Maçã', 'en': 'Apple', 'es': 'Manzana', 'fr': 'Pomme', 'de': 'Apfel', 'it': 'Mela' },
  house: { 'pt-BR': 'Casa', 'en': 'House', 'es': 'Casa', 'fr': 'Maison', 'de': 'Haus', 'it': 'Casa' },
  school: { 'pt-BR': 'Escola', 'en': 'School', 'es': 'Escuela', 'fr': 'École', 'de': 'Schule', 'it': 'Scuola' },
  book: { 'pt-BR': 'Livro', 'en': 'Book', 'es': 'Libro', 'fr': 'Livre', 'de': 'Buch', 'it': 'Libro' },
  water: { 'pt-BR': 'Água', 'en': 'Water', 'es': 'Agua', 'fr': 'Eau', 'de': 'Wasser', 'it': 'Acqua' },
  friend: { 'pt-BR': 'Amigo', 'en': 'Friend', 'es': 'Amigo', 'fr': 'Ami', 'de': 'Freund', 'it': 'Amico' },
  happy: { 'pt-BR': 'Feliz', 'en': 'Happy', 'es': 'Feliz', 'fr': 'Heureux', 'de': 'Glücklich', 'it': 'Felice' },
  red: { 'pt-BR': 'Vermelho', 'en': 'Red', 'es': 'Rojo', 'fr': 'Rouge', 'de': 'Rot', 'it': 'Rosso' },
  blue: { 'pt-BR': 'Azul', 'en': 'Blue', 'es': 'Azul', 'fr': 'Bleu', 'de': 'Blau', 'it': 'Blu' },
  family: { 'pt-BR': 'Família', 'en': 'Family', 'es': 'Familia', 'fr': 'Famille', 'de': 'Familie', 'it': 'Famiglia' },
  sun: { 'pt-BR': 'Sol', 'en': 'Sun', 'es': 'Sol', 'fr': 'Soleil', 'de': 'Sonne', 'it': 'Sole' },
  moon: { 'pt-BR': 'Lua', 'en': 'Moon', 'es': 'Luna', 'fr': 'Lune', 'de': 'Mond', 'it': 'Luna' },
  tree: { 'pt-BR': 'Árvore', 'en': 'Tree', 'es': 'Árbol', 'fr': 'Arbre', 'de': 'Baum', 'it': 'Albero' },
  car: { 'pt-BR': 'Carro', 'en': 'Car', 'es': 'Coche', 'fr': 'Voiture', 'de': 'Auto', 'it': 'Auto' },
  computer: { 'pt-BR': 'Computador', 'en': 'Computer', 'es': 'Ordenador', 'fr': 'Ordinateur', 'de': 'Computer', 'it': 'Computer' },
  love: { 'pt-BR': 'Amor', 'en': 'Love', 'es': 'Amor', 'fr': 'Amour', 'de': 'Liebe', 'it': 'Amore' },
  time: { 'pt-BR': 'Tempo', 'en': 'Time', 'es': 'Tiempo', 'fr': 'Temps', 'de': 'Zeit', 'it': 'Tempo' },
  music: { 'pt-BR': 'Música', 'en': 'Music', 'es': 'Música', 'fr': 'Musique', 'de': 'Musik', 'it': 'Musica' },
  food: { 'pt-BR': 'Comida', 'en': 'Food', 'es': 'Comida', 'fr': 'Nourriture', 'de': 'Essen', 'it': 'Cibo' }
};

const subjectToLangCode: Record<string, string> = {
  ingles: 'en',
  frances: 'fr',
  espanhol: 'es',
  alemao: 'de',
  italiano: 'it',
  portugues: 'pt-BR',
  matematica: 'math', // special
  ciencias: 'sci',
  historia: 'hist',
  geografia: 'geo',
  fisica: 'phys',
  quimica: 'chem',
  biologia: 'bio'
};

// Fallback logic
// Comprehensive Offline Question Database
const offlineQuestionDatabase: Record<string, Record<string, any[]>> = {
  // --- HISTORY ---
  'historia': {
    'pt-BR': [
      { q: 'Quem foi o primeiro imperador do Brasil?', a: 'D. Pedro I', o: ['D. Pedro I', 'D. Pedro II', 'Deodoro da Fonseca', 'Tiradentes'], h: 'Gritou Indepedência ou Morte.' },
      { q: 'Em que ano a 2ª Guerra Mundial terminou?', a: '1945', o: ['1945', '1939', '1918', '1960'], h: 'Meados do século XX.' },
      { q: 'Quem pintou a Mona Lisa?', a: 'Leonardo da Vinci', o: ['Da Vinci', 'Michelangelo', 'Van Gogh', 'Picasso'], h: 'Artista renascentista.' },
      { q: 'Qual civilização construiu as pirâmides?', a: 'Egípcios', o: ['Egípcios', 'Romanos', 'Maias', 'Gregos'], h: 'No norte da África.' },
      { q: 'A Revolução Francesa ocorreu em qual século?', a: 'XVIII', o: ['XVIII', 'XIX', 'XVII', 'XX'], h: 'Iniciou em 1789.' }
    ],
    'en': [
      { q: 'Who was the first US President?', a: 'Washington', o: ['Washington', 'Lincoln', 'Jefferson', 'Adams'], h: 'face on the dollar bill.' },
      { q: 'When did WWII end?', a: '1945', o: ['1945', '1939', '1918', '1960'], h: 'Mid 20th century.' },
      { q: 'Who painted the Mona Lisa?', a: 'Da Vinci', o: ['Da Vinci', 'Michelangelo', 'Van Gogh', 'Picasso'], h: 'Renaissance artist.' },
      { q: 'Which civilization built the Pyramids?', a: 'Egyptians', o: ['Egyptians', 'Romans', 'Mayans', 'Greeks'], h: 'Nile river.' },
      { q: 'French Revolution century?', a: '18th', o: ['18th', '19th', '17th', '20th'], h: 'Started in 1789.' }
    ],
    'fr': [
      { q: 'Qui a peint la Joconde ?', a: 'Léonard de Vinci', o: ['De Vinci', 'Monet', 'Van Gogh', 'Picasso'], h: 'Artiste de la Renaissance.' },
      { q: 'En quelle année la guerre 39-45 a-t-elle fini ?', a: '1945', o: ['1945', '1918', '1939', '1950'], h: 'Milieu du 20e siècle.' },
      { q: 'Quelle civilisation a bâti les pyramides ?', a: 'Égyptiens', o: ['Égyptiens', 'Romains', 'Mayas', 'Grecs'], h: 'En Afrique du Nord.' },
      { q: 'Qui était Louis XIV ?', a: 'Le Roi Soleil', o: ['Le Roi Soleil', 'Le Roi Lune', 'Empereur', 'Président'], h: 'Monarque absolu.' },
      { q: 'La Révolution française a commencé en...', a: '1789', o: ['1789', '1799', '1804', '1815'], h: 'Prise de la Bastille.' }
    ],
    'es': [
      { q: '¿Quién pintó la Mona Lisa?', a: 'Da Vinci', o: ['Da Vinci', 'Dalí', 'Goya', 'Picasso'], h: 'Renacimiento.' },
      { q: '¿Cuándo terminó la 2ª Guerra Mundial?', a: '1945', o: ['1945', '1939', '1914', '1960'], h: 'Siglo XX.' },
      { q: '¿Qué civilización construyó las pirámides?', a: 'Egipcios', o: ['Egipcios', 'Romanos', 'Mayas', 'Aztecas'], h: 'En África.' },
      { q: '¿Quién descubrió América?', a: 'Colón', o: ['Colón', 'Magallanes', 'Cortés', 'Pizarro'], h: 'En 1492.' },
      { q: 'Capital del Imperio Romano:', a: 'Roma', o: ['Roma', 'Atenas', 'Cartago', 'Milán'], h: 'En Italia.' }
    ],
    'de': [
      { q: 'Wann endete der Zweite Weltkrieg?', a: '1945', o: ['1945', '1939', '1918', '1989'], h: '20. Jahrhundert.' },
      { q: 'Wer malte die Mona Lisa?', a: 'Da Vinci', o: ['Da Vinci', 'Dürer', 'Van Gogh', 'Picasso'], h: 'Renaissance.' },
      { q: 'Welche Zivilisation baute die Pyramiden?', a: 'Ägypter', o: ['Ägypter', 'Römer', 'Griechen', 'Maya'], h: 'In Afrika.' },
      { q: 'Wer reformierte die Kirche?', a: 'Luther', o: ['Luther', 'Papst', 'Calvin', 'Erasmus'], h: '95 Thesen.' },
      { q: 'Mauerfall Jahr?', a: '1989', o: ['1989', '1990', '1945', '1961'], h: 'Berlin.' }
    ],
    'it': [
      { q: 'Chi ha dipinto la Gioconda?', a: 'Da Vinci', o: ['Da Vinci', 'Michelangelo', 'Raffaello', 'Giotto'], h: 'Rinascimento.' },
      { q: 'Quando finì la Seconda Guerra Mondiale?', a: '1945', o: ['1945', '1918', '1939', '1950'], h: 'Secolo XX.' },
      { q: 'Chi fondò Roma secondo la leggenda?', a: 'Romolo', o: ['Romolo', 'Cesare', 'Augusto', 'Nerone'], h: 'Con Remo.' },
      { q: 'Dove sono le piramidi?', a: 'Egitto', o: ['Egitto', 'Messico', 'Perù', 'Cina'], h: 'Africa.' },
      { q: 'Chi scoprì l\'America?', a: 'Colombo', o: ['Colombo', 'Vespucci', 'Polo', 'Magellano'], h: 'Genovese.' }
    ]
  },

  // --- GEOGRAPHY ---
  'geografia': {
    'pt-BR': [
      { q: 'Qual o maior país do mundo?', a: 'Rússia', o: ['Rússia', 'China', 'EUA', 'Brasil'], h: 'Em área territorial.' },
      { q: 'Qual é o rio mais longo?', a: 'Nilo/Amazonas', o: ['Nilo/Amazonas', 'Mississipi', 'Yangtze', 'Danúbio'], h: 'Disputado entre África e Brasil.' },
      { q: 'Capital da França:', a: 'Paris', o: ['Paris', 'Londres', 'Madri', 'Roma'], h: 'Cidade Luz.' },
      { q: 'Em qual continente fica o Brasil?', a: 'América', o: ['América', 'África', 'Europa', 'Ásia'], h: 'Do Sul.' },
      { q: 'O Monte Everest fica na...', a: 'Ásia', o: ['Ásia', 'Europa', 'América', 'África'], h: 'Himalaia.' }
    ],
    'en': [
      { q: 'Largest country by area?', a: 'Russia', o: ['Russia', 'Canada', 'USA', 'China'], h: 'Spans Europe and Asia.' },
      { q: 'Capital of Japan?', a: 'Tokyo', o: ['Tokyo', 'Seoul', 'Beijing', 'Bangkok'], h: 'Island nation.' },
      { q: 'Which continent is Sahara in?', a: 'Africa', o: ['Africa', 'Asia', 'Australia', 'America'], h: 'Large desert.' },
      { q: 'Longest river?', a: 'Nile/Amazon', o: ['Nile/Amazon', 'Mississippi', 'Thames', 'Danube'], h: 'Debated.' },
      { q: 'Paris is in...', a: 'France', o: ['France', 'Italy', 'Spain', 'Germany'], h: 'Europe.' }
    ],
    'fr': [
      { q: 'Le plus grand pays ?', a: 'Russie', o: ['Russie', 'Chine', 'Canada', 'USA'], h: 'Surface.' },
      { q: 'Capitale de l\'Espagne ?', a: 'Madrid', o: ['Madrid', 'Barcelone', 'Lisbonne', 'Rome'], h: 'Au sud de la France.' },
      { q: 'Où est l\'Amazonie ?', a: 'Amérique du Sud', o: ['Amérique du Sud', 'Afrique', 'Asie', 'Europe'], h: 'Brésil.' },
      { q: 'Le Toit du monde ?', a: 'Everest', o: ['Everest', 'Mont Blanc', 'Kilimandjaro', 'Fuji'], h: 'Himalaya.' },
      { q: 'Combien d\'océans ?', a: '5', o: ['5', '3', '7', '4'], h: 'Pacifique, Atlantique...' }
    ],
    'de': [
      { q: 'Größtes Land der Erde?', a: 'Russland', o: ['Russland', 'China', 'USA', 'Kanada'], h: 'Fläche.' },
      { q: 'Hauptstadt von Italien?', a: 'Rom', o: ['Rom', 'Mailand', 'Paris', 'Berlin'], h: 'Ewige Stadt.' },
      { q: 'Wo liegt die Sahara?', a: 'Afrika', o: ['Afrika', 'Asien', 'Amerika', 'Australien'], h: 'Wüste.' },
      { q: 'Der längste Fluss?', a: 'Nil/Amazonas', o: ['Nil/Amazonas', 'Rhein', 'Donau', 'Wolga'], h: 'Sehr lang.' },
      { q: 'Höchster Berg?', a: 'Mount Everest', o: ['Mount Everest', 'Zugspitze', 'Mont Blanc', 'K2'], h: 'Himalaya.' }
    ],
    'it': [
      { q: 'Paese più grande?', a: 'Russia', o: ['Russia', 'Cina', 'USA', 'Brasile'], h: 'Area.' },
      { q: 'Capitale della Germania?', a: 'Berlino', o: ['Berlino', 'Monaco', 'Parigi', 'Londra'], h: 'Muro.' },
      { q: 'Dove si trova l\'Amazzonia?', a: 'Sud America', o: ['Sud America', 'Africa', 'Asia', 'Europa'], h: 'Polmone della terra.' },
      { q: 'Il monte più alto?', a: 'Everest', o: ['Everest', 'Bianco', 'Rosa', 'K2'], h: 'Himalaya.' },
      { q: 'Quanti continenti ci sono?', a: '5-7', o: ['5-7', '3', '10', '2'], h: 'Dipende dal modello.' }
    ],
    'es': [
      { q: 'País más grande?', a: 'Rusia', o: ['Rusia', 'China', 'EEUU', 'Brasil'], h: 'Área.' },
      { q: 'Capital de Francia?', a: 'París', o: ['París', 'Roma', 'Madrid', 'Londres'], h: 'Torre Eiffel.' },
      { q: '¿Dónde está el Everest?', a: 'Asia', o: ['Asia', 'Europa', 'África', 'América'], h: 'Himalaya.' },
      { q: 'Río más largo?', a: 'Nilo/Amazonas', o: ['Nilo/Amazonas', 'Misisipi', 'Danubio', 'Volga'], h: 'En discusión.' },
      { q: 'Desierto más grande?', a: 'Antártida/Sahara', o: ['Antártida/Sahara', 'Gobi', 'Atacama', 'Sonora'], h: 'Puede ser frío.' }
    ]
  },

  // --- SCIENCE (General for 1-9) ---
  'ciencias': {
    'pt-BR': [
      { q: 'Qual planeta tem anéis?', a: 'Saturno', o: ['Saturno', 'Marte', 'Vênus', 'Mercúrio'], h: 'Gigante gasoso.' },
      { q: 'A água ferve a...', a: '100°C', o: ['100°C', '90°C', '50°C', '0°C'], h: 'Ao nível do mar.' },
      { q: 'O que as plantas respiram?', a: 'CO2', o: ['CO2', 'Oxigênio', 'Nitrogênio', 'Hélio'], h: 'Dióxido de Carbono.' },
      { q: 'Maior animal do mundo:', a: 'Baleia Azul', o: ['Baleia Azul', 'Elefante', 'Tubarão', 'Girafa'], h: 'Marinho.' },
      { q: 'O Sol é uma...', a: 'Estrela', o: ['Estrela', 'Planeta', 'Lua', 'Cometa'], h: 'Luz própria.' }
    ],
    'en': [
      { q: 'Planet with rings?', a: 'Saturn', o: ['Saturn', 'Mars', 'Venus', 'Mercury'], h: 'Gas giant.' },
      { q: 'Water boils at...', a: '100°C', o: ['100°C', '90°C', '50°C', '0°C'], h: 'Sea level.' },
      { q: 'Plants absorb...', a: 'CO2', o: ['CO2', 'Oxygen', 'Nitrogen', 'Helium'], h: 'Photosynthesis.' },
      { q: 'Largest animal?', a: 'Blue Whale', o: ['Blue Whale', 'Elephant', 'Shark', 'Giraffe'], h: 'Marine.' },
      { q: 'The Sun is a...', a: 'Star', o: ['Star', 'Planet', 'Moon', 'Comet'], h: 'Plasma.' }
    ],
    'fr': [
      { q: 'Planète aux anneaux ?', a: 'Saturne', o: ['Saturne', 'Mars', 'Vénus', 'Mercure'], h: 'Géante.' },
      { q: 'L\'eau bout à...', a: '100°C', o: ['100°C', '0°C', '200°C', '50°C'], h: 'Niveau de la mer.' },
      { q: 'Que respirent les plantes ?', a: 'CO2', o: ['CO2', 'Oxygène', 'Azote', 'Hélium'], h: 'Photosynthèse.' },
      { q: 'Le plus grand animal ?', a: 'Baleine Bleue', o: ['Baleine Bleue', 'Éléphant', 'Requin', 'Girafe'], h: 'Marin.' },
      { q: 'Le Soleil est une...', a: 'Étoile', o: ['Étoile', 'Planète', 'Lune', 'Météorite'], h: 'Feu.' }
    ],
    'es': [
      { q: '¿Planeta con anillos?', a: 'Saturno', o: ['Saturno', 'Júpiter', 'Marte', 'Tierra'], h: 'Gigante.' },
      { q: 'El agua hierve a...', a: '100°C', o: ['100°C', '0°C', '50°C', '200°C'], h: 'Nivel del mar.' },
      { q: '¿El sol es una...?', a: 'Estrella', o: ['Estrella', 'Planeta', 'Luna', 'Cometa'], h: 'Luz propia.' },
      { q: 'Animal más grande:', a: 'Ballena Azul', o: ['Ballena Azul', 'Elefante', 'Tiburón', 'Jirafa'], h: 'Marino.' },
      { q: 'H2O es...', a: 'Agua', o: ['Agua', 'Aire', 'Fuego', 'Tierra'], h: 'Líquido vital.' }
    ],
    'de': [
      { q: 'Planet mit Ringen?', a: 'Saturn', o: ['Saturn', 'Mars', 'Venus', 'Erde'], h: 'Gasriese.' },
      { q: 'Wasser kocht bei...', a: '100°C', o: ['100°C', '0°C', '50°C', '10°C'], h: 'Normaldruck.' },
      { q: 'Die Sonne ist ein...', a: 'Stern', o: ['Stern', 'Planet', 'Mond', 'Komet'], h: 'Heiß.' },
      { q: 'Größtes Tier?', a: 'Blauwal', o: ['Blauwal', 'Elefant', 'Hai', 'Giraffe'], h: 'Im Meer.' },
      { q: 'Was atmen Pflanzen?', a: 'CO2', o: ['CO2', 'Sauerstoff', 'Stickstoff', 'Helium'], h: 'Photosynthese.' }
    ],
    'it': [
      { q: 'Pianeta con anelli?', a: 'Saturno', o: ['Saturno', 'Marte', 'Venere', 'Giove'], h: 'Gigante.' },
      { q: 'L\'acqua bolle a...', a: '100°C', o: ['100°C', '0°C', '50°C', '200°C'], h: 'Livello del mare.' },
      { q: 'Il Sole è una...', a: 'Stella', o: ['Stella', 'Pianeta', 'Luna', 'Cometa'], h: 'Luce propria.' },
      { q: 'Animale più grande:', a: 'Balenottera Azzurra', o: ['Balenottera Azzurra', 'Elefante', 'Squalo', 'Giraffa'], h: 'Marino.' },
      { q: 'H2O è...', a: 'Acqua', o: ['Acqua', 'Aria', 'Fuoco', 'Terra'], h: 'Liquido.' }
    ]
  },

  // --- PHYSICS (High School) ---
  'fisica': {
    'pt-BR': [
      { q: 'Qual a unidade de força?', a: 'Newton', o: ['Newton', 'Joule', 'Watt', 'Pascal'], h: 'Isaac...' },
      { q: 'Velocidade da luz (aprox):', a: '300.000 km/s', o: ['300.000 km/s', '1.000 km/s', '340 m/s', 'Infinity'], h: 'No vácuo.' },
      { q: 'Fórmula da força (2ª Lei):', a: 'F = m.a', o: ['F = m.a', 'E = mc²', 'V = d/t', 'P = m.g'], h: 'Massa vezes aceleração.' },
      { q: 'O que mede o termômetro?', a: 'Temperatura', o: ['Temperatura', 'Calor', 'Pressão', 'Umidade'], h: 'Graus.' },
      { q: 'Carga do elétron:', a: 'Negativa', o: ['Negativa', 'Positiva', 'Neutra', 'Variável'], h: 'Oposto do próton.' }
    ],
    'en': [
      { q: 'Unit of Force?', a: 'Newton', o: ['Newton', 'Joule', 'Watt', 'Pascal'], h: 'Apple falls.' },
      { q: 'Speed of Light?', a: '300,000 km/s', o: ['300,000 km/s', 'Sound speed', 'Infinite', '100 km/h'], h: 'Fastest thing.' },
      { q: 'E = mc² is by...', a: 'Einstein', o: ['Einstein', 'Newton', 'Bohr', 'Tesla'], h: 'Relativity.' },
      { q: 'Gravity pulls us...', a: 'Down', o: ['Down', 'Up', 'Sideways', 'Nowhere'], h: 'Center of Earth.' },
      { q: 'Electron charge:', a: 'Negative', o: ['Negative', 'Positive', 'Neutral', 'Double'], h: '-' }
    ]
  },

  // --- CHEMISTRY ---
  'quimica': {
    'pt-BR': [
      { q: 'Símbolo do Oxigênio:', a: 'O', o: ['O', 'Ox', 'On', 'Y'], h: 'Tabela Periódica.' },
      { q: 'H2O é:', a: 'Água', o: ['Água', 'Sal', 'Ouro', 'Gás'], h: 'Vital.' },
      { q: 'pH 7 é considerado:', a: 'Neutro', o: ['Neutro', 'Ácido', 'Básico', 'Salino'], h: 'Água pura.' },
      { q: 'O número atômico indica:', a: 'Prótons', o: ['Prótons', 'Nêutrons', 'Elétrons', 'Massa'], h: 'Identidade do átomo.' },
      { q: 'Ouro na tabela:', a: 'Au', o: ['Au', 'Ag', 'Fe', 'Cu'], h: 'Aurum.' }
    ],
    'en': [
      { q: 'Symbol for Oxygen:', a: 'O', o: ['O', 'Ox', 'Og', 'Y'], h: 'Periodic Table.' },
      { q: 'H2O is...', a: 'Water', o: ['Water', 'Acid', 'Gas', 'Gold'], h: 'Drinkable.' },
      { q: 'pH 7 is...', a: 'Neutral', o: ['Neutral', 'Acidic', 'Basic', 'Hot'], h: 'Pure water.' },
      { q: 'Gold symbol:', a: 'Au', o: ['Au', 'Ag', 'Go', 'Gd'], h: 'Aurum.' },
      { q: 'Atomic number equals...', a: 'Protons', o: ['Protons', 'Neutrons', 'Electrons', 'Quarks'], h: 'Identity.' }
    ]
  },

  // --- BIOLOGY ---
  'biologia': {
    'pt-BR': [
      { q: 'Qual a unidade da vida?', a: 'Célula', o: ['Célula', 'Átomo', 'Tecido', 'Orgão'], h: 'Básica.' },
      { q: 'O DNA fica no...', a: 'Núcleo', o: ['Núcleo', 'Ribossomo', 'Lisossomo', 'Parede'], h: 'Centro de comando.' },
      { q: 'Fotossíntese cria...', a: 'Glicose', o: ['Glicose', 'Proteína', 'Gordura', 'Sal'], h: 'Açúcar.' },
      { q: 'Maior órgão humano:', a: 'Pele', o: ['Pele', 'Fígado', 'Coração', 'Pulmão'], h: 'Revestimento.' },
      { q: 'Mitocôndria produz...', a: 'Energia', o: ['Energia', 'Proteína', 'DNA', 'Lixo'], h: 'ATP.' }
    ],
    'en': [
      { q: 'Unit of life?', a: 'Cell', o: ['Cell', 'Atom', 'Tissue', 'Organ'], h: 'Basic block.' },
      { q: 'DNA is in the...', a: 'Nucleus', o: ['Nucleus', 'Mitochondria', 'Wall', 'Vacuole'], h: 'Center.' },
      { q: 'Photosynthesis makes...', a: 'Sugar/Glucose', o: ['Sugar/Glucose', 'Protein', 'Fat', 'Salt'], h: 'Food.' },
      { q: 'Largest organ?', a: 'Skin', o: ['Skin', 'Heart', 'Liver', 'Brain'], h: 'Outer layer.' },
      { q: 'Powerhouse of the cell:', a: 'Mitochondria', o: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi'], h: 'ATP.' }
    ]
  }
};

// Fallback logic
const generateFallbackExercises = (
  _lessonId: number,
  _difficulty: string,
  subject: string,
  _schoolYear: string,
  language: string
): Exercise[] => {
  const TARGET_COUNT = 10;
  const templates: Exercise[] = [];
  const newId = () => `ex_${templates.length + 1}`;

  // Basic normalization
  const userLangCode = ['pt-BR', 'en', 'fr', 'es', 'de', 'it'].find(l => language.startsWith(l)) || 'pt-BR';
  const normalizedSubject = subject.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const targetLangCode = subjectToLangCode[normalizedSubject] || 'en';

  console.log(`Generating fallback/offline for: ${normalizedSubject} (${userLangCode})`);

  // --- MATHEMATICS (Procedural) ---
  if (normalizedSubject === 'matematica') {
    const uniqueQuestions = new Set<string>();
    let attempts = 0;
    while (templates.length < TARGET_COUNT && attempts < 50) {
      attempts++;
      const op = Math.random() > 0.5 ? '+' : '-';
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * 10) + 1;
      const val = op === '+' ? a + b : a - b;
      const qText = `${a} ${op} ${b}`;

      if (uniqueQuestions.has(qText)) continue;
      uniqueQuestions.add(qText);

      const prefix = fallbackLang(userLangCode, 'q_prefix');
      templates.push({
        id: newId(),
        type: 'multiple-choice',
        question: `${prefix} ${qText}?`,
        correctAnswer: String(val),
        options: [String(val), String(val + 2), String(val - 2), String(val + 5)].sort(() => Math.random() - 0.5),
        hint: fallbackLang(userLangCode, 'hint')
      });
    }
    return templates;
  }

  // --- PORTUGUESE (Special) ---
  if (normalizedSubject === 'portugues') {
    const ptPool = [
      { q: 'Qual a classe da palavra "Rápido"?', a: 'Adjetivo/Advérbio', o: ['Adjetivo/Advérbio', 'Verbo', 'Substantivo', 'Pronome'], h: 'Qualidade ou modo.' },
      { q: 'Plural de "Pão":', a: 'Pães', o: ['Pães', 'Pãos', 'Paes', 'Pãose'], h: 'Irregular.' },
      { q: 'Antônimo de "Alto":', a: 'Baixo', o: ['Baixo', 'Longo', 'Pequeno', 'Grande'], h: 'Oposto.' },
      { q: 'O que é um verbo?', a: 'Ação/Estado', o: ['Ação/Estado', 'Nome', 'Qualidade', 'Lugar'], h: 'Fazer, ser.' },
      { q: 'Sílaba tônica de "Árvore":', a: 'Ár', o: ['Ár', 'vo', 're', 've'], h: 'Proparoxítona.' },
      { q: 'Sinônimo de "Belo":', a: 'Bonito', o: ['Bonito', 'Feio', 'Grande', 'Mal'], h: 'Igual.' }
    ];
    // Fill
    while (templates.length < TARGET_COUNT) {
      const item = ptPool[templates.length % ptPool.length];
      templates.push({
        id: newId(), type: 'multiple-choice',
        question: item.q, correctAnswer: item.a, options: item.o.sort(() => Math.random() - 0.5), hint: item.h
      });
    }
    return templates;
  }

  // --- LANGUAGES (Vocab Translation) ---
  if (['ingles', 'frances', 'espanhol', 'alemao', 'italiano'].includes(normalizedSubject)) {
    const keys = Object.keys(vocabulary);
    // Shuffle keys
    keys.sort(() => Math.random() - 0.5);

    keys.forEach(k => {
      if (templates.length >= TARGET_COUNT) return;

      const wordUser = vocabulary[k][userLangCode];
      const wordTarget = vocabulary[k][targetLangCode];

      // Skip if words are missing or same (learning own language)
      if (!wordUser || !wordTarget || wordUser === wordTarget) return;

      templates.push({
        id: newId(),
        type: 'multiple-choice',
        question: `${wordUser} = ?`,
        correctAnswer: wordTarget,
        options: [
          wordTarget,
          vocabulary[keys[(keys.indexOf(k) + 1) % keys.length]][targetLangCode],
          vocabulary[keys[(keys.indexOf(k) + 2) % keys.length]][targetLangCode],
          vocabulary[keys[(keys.indexOf(k) + 3) % keys.length]][targetLangCode]
        ].sort(() => Math.random() - 0.5),
        hint: 'Translate the word.'
      });
    });
    // If not enough (e.g. learning own language), fall through to generic safety?
    if (templates.length > 0) return templates;
  }

  // --- GENERAL KNOWLEDGE (History, Geo, Science, Physics, Chem, Bio) ---
  // Try to find specific subject pool
  let pool = offlineQuestionDatabase[normalizedSubject]?.[userLangCode];

  // If no specific pool for language, try English or PT as fallback root
  if (!pool) pool = offlineQuestionDatabase[normalizedSubject]?.['en'];
  if (!pool) pool = offlineQuestionDatabase[normalizedSubject]?.['pt-BR'];

  // If still no pool (e.g. unknown subject), try "ciencias" as generic fallback
  if (!pool) pool = offlineQuestionDatabase['ciencias']?.[userLangCode] || offlineQuestionDatabase['ciencias']?.['pt-BR'];

  if (pool && pool.length > 0) {
    // Repeat pool to fill target count
    let i = 0;
    while (templates.length < TARGET_COUNT) {
      const item = pool[i % pool.length];
      templates.push({
        id: newId(),
        type: 'multiple-choice',
        question: item.q,
        correctAnswer: item.a,
        options: item.o.sort(() => Math.random() - 0.5),
        hint: item.h
      });
      i++;
    }
    return templates;
  }

  // --- ULTIMATE SAFETY NET ---
  // If absolutely nothing worked (should be impossible with the logic above)
  for (let i = 0; i < TARGET_COUNT; i++) {
    templates.push({
      id: newId(),
      type: 'multiple-choice',
      question: `Question ${i + 1} for ${subject} (${userLangCode})`,
      correctAnswer: 'Option A',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      hint: 'Generic Placeholder'
    });
  }

  return templates;
}


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
  const seen = new Set<string>();
  const out: string[] = [];
  for (const o of ex.options.map((x: any) => String(x).trim()).filter(Boolean)) {
    const k = o.toLowerCase().replace(/s+/g, ' ');
    if (!seen.has(k)) { seen.add(k); out.push(o); }
  }
  const correct = String(ex.correctAnswer || '').trim();
  if (correct && out.length && !seen.has(correct.toLowerCase().replace(/s+/g, ' '))) out[out.length - 1] = correct;
  return out;
};

/** A visual must help, not answer: hide the result in formulas, drop data visuals that show it. */
const safeVisual = (visual: Exercise['visual'], answer: string): Exercise['visual'] => {
  const ans = answer.trim();
  if (!visual || !ans) return visual;
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const esc = ans.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // The answer as a whole token (so "47" matches in "= 47" but not in "147").
  const token = () => new RegExp(`(^|[^\\p{L}\\p{N}])${esc}(?=$|[^\\p{L}\\p{N}])`, 'giu');
  switch (visual.kind) {
    case 'formula': {
      // Only the result side of the last "=" can give the answer away; numbers on the left are part of the question.
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

const normalizeExercise = (ex: any, index: number): Exercise => ({
  ...ex,
  id: String(index + 1),
  question: String(ex.question || ''),
  correctAnswer: String(ex.correctAnswer || ''),
  options: uniqueOptions(ex),
  // A speaking exercise always uses the speaking UI.
  type: ex.exerciseType === 'speaking' ? 'speaking' : (ex.type || 'multiple-choice'),
  exerciseType: ex.exerciseType || 'text',
  audioText: ex.audioText || undefined,
  visual: safeVisual(cleanVisual(ex.visual), String(ex.correctAnswer || '')),
});

export async function generateExercises(
  lessonId: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  subject: Subject = 'matematica',
  schoolYear: string = '1ano',
  language: string = 'pt-PT',
  course?: string
): Promise<Exercise[]> {
  const lessonNumber = lessonId === 99999 ? undefined : lessonId % 100;
  const topic = lessonNumber ? getCachedPlan(subject, schoolYear, course)?.[lessonNumber - 1] : undefined;
  try {
    const reply = await askKodu({
      mode: 'exercises',
      context: {
        subject: getSubjectDescription(subject),
        schoolYear: getSchoolYearDescription(schoolYear),
        difficulty,
        language,
        course: courseInfo(course)?.name,
        lessonNumber,
        topic: topic?.title,
        topicDescription: topic?.description,
        totalLessons: 20,
        isMath: isMathSubject(subject),
        isLanguage: isLanguageSubject(subject),
      },
    });

    let parsed: any = JSON.parse(reply.replace(/```json|```/g, '').trim());
    if (!Array.isArray(parsed)) parsed = parsed.exercises || Object.values(parsed).find(Array.isArray) || [];

    // Skip questions this student saw recently (last 50 per subject and year).
    const STORAGE_KEY = `seen_questions_${subject}_${schoolYear}`;
    const seen: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const seenSet = new Set(seen);
    const fresh = (parsed as any[]).filter((ex) => {
      const sig = String(ex?.question || '').trim().toLowerCase();
      if (!sig || seenSet.has(sig)) return false;
      seenSet.add(sig);
      return true;
    });
    if (fresh.length < 3) throw new Error('Kodu returned too few new exercises');

    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seenSet].slice(-50)));
    return fresh.sort(() => Math.random() - 0.5).map(normalizeExercise);
  } catch (error) {
    console.warn('Kodu could not write this lesson, using offline exercises.', error);
    return generateFallbackExercises(lessonId, difficulty, subject, schoolYear, language);
  }
}

export async function getAIFeedback(
  exercise: Exercise,
  isCorrect: boolean,
  language: string = 'pt-BR',
  userAnswer?: string
): Promise<AIResponse> {
  const offline: AIResponse = isCorrect
    ? { feedback: fallbackLang(language, 'feedback_c'), explanation: `${fallbackLang(language, 'expl_c')} ("${exercise.correctAnswer}")`, encouragement: fallbackLang(language, 'encourage') }
    : { feedback: fallbackLang(language, 'feedback_i'), explanation: `${fallbackLang(language, 'expl_i')} "${exercise.correctAnswer}". ${exercise.hint || ''}`.trim(), encouragement: fallbackLang(language, 'encourage') };

  try {
    const reply = await askKodu({
      mode: 'feedback',
      context: { question: exercise.question, correctAnswer: exercise.correctAnswer, userAnswer, isCorrect, language },
    });
    const data = JSON.parse(reply);
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
}

export const tutorContext = (ctx: TutorContext) => ({
  language: ctx.language,
  name: ctx.name,
  schoolYear: ctx.schoolYear ? getSchoolYearDescription(ctx.schoolYear) : undefined,
  subjects: (ctx.subjects || []).map(getSubjectDescription),
  subject: ctx.subject ? getSubjectDescription(ctx.subject) : undefined,
});

/** Kodu's tutor chat, streamed. `onToken` receives the text so far. */
export function chatWithKodu(messages: KoduMessage[], ctx: TutorContext, onToken: (text: string) => void, signal?: AbortSignal) {
  return streamKodu({ messages, context: tutorContext(ctx), signal }, onToken);
}

/** Kept for older callers: one non-streamed tutor answer. */
export async function chatWithAI(
  message: string,
  history: { role: string, content: string }[],
  language: string = 'pt-BR'
): Promise<string> {
  const messages: KoduMessage[] = [
    ...history.map((h) => ({ role: (h.role === 'ai' || h.role === 'assistant' ? 'assistant' : 'user') as KoduMessage['role'], content: h.content })),
    { role: 'user', content: message },
  ];
  try {
    return await askKodu({ mode: 'tutor', messages, context: { language } });
  } catch (error) {
    console.error('Kodu chat error:', error);
    return fallbackLang(language, 'chat_err');
  }
}
