
import { Message } from '../types';

export interface SpanglishMetrics {
  totalWords: number;
  spanishWordCount: number;
  englishWordCount: number;
  switchCount: number;
  spanishRatio: number; // 0-100
  englishRatio: number; // 0-100
  dominantLanguage: 'EN' | 'ES' | 'BALANCED';
  segments: { text: string; lang: 'EN' | 'ES' | 'NEUTRAL' }[];
}

export interface SessionLinguisticProfile {
  sessionId: string;
  memberId: string;
  timestamp: number;
  metrics: SpanglishMetrics;
  snippet: string;
}

// Common Spanish Stopwords & Markers
const COMMON_ES = new Set([
  'el', 'la', 'de', 'que', 'y', 'en', 'un', 'una', 'ser', 'se', 'no', 'haber', 'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo', 'pero', 'mas', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese', 'la', 'si', 'mi', 'ya', 'ver', 'porque', 'dar', 'cuando', 'muy', 'sin', 'vez', 'mucho', 'saber', 'sobre', 'al', 'nos', 'tu', 'te', 'ti', 'nada', 'poco', 'ella', 'ellos', 'ellas', 'nosotros', 'vosotros', 'usted', 'ustedes', 'hola', 'gracias', 'adios', 'bueno', 'bien', 'mal', 'claro', 'papi', 'mami', 'hermano', 'hermana', 'abuela', 'abuelo', 'primo', 'prima', 'tio', 'tia', 'comida', 'agua', 'casa', 'amor', 'corazon', 'alma', 'vida', 'dios', 'fe', 'esperanza', 'fuego', 'luz', 'noche', 'dia', 'hoy', 'mañana', 'ayer', 'siempre', 'nunca', 'ahora', 'despues', 'antes', 'aqui', 'alli', 'alla', 'cerca', 'lejos', 'arriba', 'abajo', 'dentro', 'fuera', 'izquierda', 'derecha', 'necesito', 'ayuda', 'quiero', 'tengo', 'vamos', 'mira', 'oye', 'dimelo', 'dale', 'eso', 'esto', 'aquello', 'estoy', 'estas', 'esta', 'estamos', 'estan', 'soy', 'eres', 'es', 'somos', 'son', 'voy', 'vas', 'va', 'van', 'fui', 'fuiste', 'fue', 'fuimos', 'fueron', 'hice', 'hiciste', 'hizo', 'hicimos', 'hicieron', 'dije', 'dijiste', 'dijo', 'dijimos', 'dijeron', 'puedo', 'puedes', 'puede', 'podemos', 'pueden', 'siento', 'sientes', 'siente', 'sentimos', 'sienten', 'amo', 'amas', 'ama', 'amamos', 'aman', 'bendicion', 'bendiciones', 'carino', 'cariño', 'asi', 'si', 'mi', 'mis', 'tus', 'sus', 'nuestro', 'vuestro'
]);

const detectLanguage = (word: string): 'ES' | 'EN' | 'NEUTRAL' => {
  const clean = word.toLowerCase().replace(/[^\w\sáéíóúñü]/g, '');
  if (!clean || !isNaN(Number(clean))) return 'NEUTRAL'; 

  // 1. Explicit Spanish Characters
  if (/[áéíóúñü¿¡]/.test(clean)) return 'ES';

  // 2. Dictionary Check
  if (COMMON_ES.has(clean)) return 'ES';

  // 3. Verb Ending Heuristics (Simple)
  if (clean.length > 4) {
      if (clean.endsWith('ando') || clean.endsWith('iendo') || clean.endsWith('amos') || clean.endsWith('aron') || clean.endsWith('emos') || clean.endsWith('aste') || clean.endsWith('iste')) {
          return 'ES';
      }
  }

  // 4. Default to English (Assumption for this context)
  return 'EN';
};

export const analyzeText = (text: string): SpanglishMetrics => {
  const words = text.split(/\s+/);
  let spanishCount = 0;
  let englishCount = 0;
  let switches = 0;
  
  let lastLang: 'ES' | 'EN' | 'NEUTRAL' = 'NEUTRAL';
  const segments: { text: string; lang: 'ES' | 'EN' | 'NEUTRAL' }[] = [];

  words.forEach(word => {
    const lang = detectLanguage(word);
    
    // Counting
    if (lang === 'ES') spanishCount++;
    if (lang === 'EN') englishCount++;

    // Switch Detection (Ignore Neutrals for switching logic to avoid false positives on numbers/punctuation)
    if (lang !== 'NEUTRAL') {
        if (lastLang !== 'NEUTRAL' && lastLang !== lang) {
            switches++;
        }
        lastLang = lang;
    }

    segments.push({ text: word, lang });
  });

  const total = spanishCount + englishCount;
  const spanishRatio = total > 0 ? Math.round((spanishCount / total) * 100) : 0;
  const englishRatio = total > 0 ? 100 - spanishRatio : 0;

  let dominantLanguage: 'EN' | 'ES' | 'BALANCED' = 'EN';
  if (spanishRatio > 60) dominantLanguage = 'ES';
  else if (spanishRatio > 40) dominantLanguage = 'BALANCED';

  return {
    totalWords: total,
    spanishWordCount: spanishCount,
    englishWordCount: englishCount,
    switchCount: switches,
    spanishRatio,
    englishRatio,
    dominantLanguage,
    segments
  };
};

export const analyzeSession = (messages: Message[]): SpanglishMetrics => {
    // Combine all user messages for analysis (Model messages are less relevant for *User* patterns, but we could include them)
    // For now, let's analyze the USER's output to track David's habits.
    const fullText = messages
        .filter(m => m.sender === 'user')
        .map(m => m.text)
        .join(' ');
    
    return analyzeText(fullText);
};
