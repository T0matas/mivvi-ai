// Lesson title translations
export const lessonTitles: Record<string, Record<string, string>> = {
    // Matemática
    'Operações Básicas': {
        'en': 'Basic Operations',
        'es': 'Operaciones Básicas',
        'pt-PT': 'Operações Básicas',
        'fr': 'Opérations de Base',
        'de': 'Grundrechenarten',
        'it': 'Operazioni di Base'
    },
    'Frações': {
        'en': 'Fractions',
        'es': 'Fracciones',
        'pt-PT': 'Frações',
        'fr': 'Fractions',
        'de': 'Brüche',
        'it': 'Frazioni'
    },
    'Geometria Básica': {
        'en': 'Basic Geometry',
        'es': 'Geometría Básica',
        'pt-PT': 'Geometria Básica',
        'fr': 'Géométrie de Base',
        'de': 'Grundgeometrie',
        'it': 'Geometria di Base'
    },
    'Álgebra': {
        'en': 'Algebra',
        'es': 'Álgebra',
        'pt-PT': 'Álgebra',
        'fr': 'Algèbre',
        'de': 'Algebra',
        'it': 'Algebra'
    },
    'Probabilidade': {
        'en': 'Probability',
        'es': 'Probabilidad',
        'pt-PT': 'Probabilidade',
        'fr': 'Probabilité',
        'de': 'Wahrscheinlichkeit',
        'it': 'Probabilità'
    },
    'Números Decimais': {
        'en': 'Decimal Numbers',
        'es': 'Números Decimales',
        'pt-PT': 'Números Decimais',
        'fr': 'Nombres Décimaux',
        'de': 'Dezimalzahlen',
        'it': 'Numeri Decimali'
    },
    'Porcentagem': {
        'en': 'Percentage',
        'es': 'Porcentaje',
        'pt-PT': 'Percentagem',
        'fr': 'Pourcentage',
        'de': 'Prozent',
        'it': 'Percentuale'
    },
    'Geometria Espacial': {
        'en': 'Spatial Geometry',
        'es': 'Geometría Espacial',
        'pt-PT': 'Geometria Espacial',
        'fr': 'Géométrie Spatiale',
        'de': 'Raumgeometrie',
        'it': 'Geometria Spaziale'
    },
    'Funções': {
        'en': 'Functions',
        'es': 'Funciones',
        'pt-PT': 'Funções',
        'fr': 'Fonctions',
        'de': 'Funktionen',
        'it': 'Funzioni'
    },
    'Trigonometria': {
        'en': 'Trigonometry',
        'es': 'Trigonometría',
        'pt-PT': 'Trigonometria',
        'fr': 'Trigonométrie',
        'de': 'Trigonometrie',
        'it': 'Trigonometria'
    },

    // Geografia
    'Relevo Brasileiro': {
        'en': 'Brazilian Relief',
        'es': 'Relieve Brasileño',
        'pt-PT': 'Relevo Brasileiro',
        'fr': 'Relief Brésilien',
        'de': 'Brasilianisches Relief',
        'it': 'Rilievo Brasiliano'
    },
    'Mapas e Coordenadas': {
        'en': 'Maps and Coordinates',
        'es': 'Mapas y Coordenadas',
        'pt-PT': 'Mapas e Coordenadas',
        'fr': 'Cartes et Coordonnées',
        'de': 'Karten und Koordinaten',
        'it': 'Mappe e Coordinate'
    },
    'Clima e Vegetação': {
        'en': 'Climate and Vegetation',
        'es': 'Clima y Vegetación',
        'pt-PT': 'Clima e Vegetação',
        'fr': 'Climat et Végétation',
        'de': 'Klima und Vegetation',
        'it': 'Clima e Vegetazione'
    },
    'Globalização': {
        'en': 'Globalization',
        'es': 'Globalización',
        'pt-PT': 'Globalização',
        'fr': 'Mondialisation',
        'de': 'Globalisierung',
        'it': 'Globalizzazione'
    },
    'Hidrografia': {
        'en': 'Hydrography',
        'es': 'Hidrografía',
        'pt-PT': 'Hidrografia',
        'fr': 'Hydrographie',
        'de': 'Hydrographie',
        'it': 'Idrografia'
    },
    'População': {
        'en': 'Population',
        'es': 'Población',
        'pt-PT': 'População',
        'fr': 'Population',
        'de': 'Bevölkerung',
        'it': 'Popolazione'
    },
    'Urbanização': {
        'en': 'Urbanization',
        'es': 'Urbanización',
        'pt-PT': 'Urbanização',
        'fr': 'Urbanisation',
        'de': 'Urbanisierung',
        'it': 'Urbanizzazione'
    },
    'Agricultura': {
        'en': 'Agriculture',
        'es': 'Agricultura',
        'pt-PT': 'Agricultura',
        'fr': 'Agriculture',
        'de': 'Landwirtschaft',
        'it': 'Agricoltura'
    },
    'Indústria': {
        'en': 'Industry',
        'es': 'Industria',
        'pt-PT': 'Indústria',
        'fr': 'Industrie',
        'de': 'Industrie',
        'it': 'Industria'
    },
    'Geopolítica': {
        'en': 'Geopolitics',
        'es': 'Geopolítica',
        'pt-PT': 'Geopolítica',
        'fr': 'Géopolitique',
        'de': 'Geopolitik',
        'it': 'Geopolitica'
    }
};

// Helper function to translate lesson title
export function translateLessonTitle(title: string, language: string = 'pt-BR'): string {
    // If Portuguese (BR or PT), return original
    if (language === 'pt-BR' || language === 'pt-PT') {
        return title;
    }

    // Get translation
    const translations = lessonTitles[title];
    if (translations && translations[language]) {
        return translations[language];
    }

    // Fallback to original title
    return title;
}
