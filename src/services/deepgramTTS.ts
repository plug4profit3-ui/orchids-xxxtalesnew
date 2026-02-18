// Deepgram TTS Service - replaces browser speechSynthesis with realistic AI voices
import { getAccessToken } from './supabaseData';

// NOTE: DEEPGRAM_API_KEY is server-side only. All TTS calls go through /api/tts proxy.

// Voice personality types mapped to Deepgram Aura-2 voices per language
type VoiceType = 'playful' | 'warm' | 'elegant' | 'shy' | 'dominant' | 'mysterious' | 'mature' | 'seductive' | 'breathless' | 'teasing_playful' | 'sultry_purring';

const VOICE_MAP: Record<string, Record<VoiceType, string>> = {
  nl: {
    playful:        'aura-2-beatrix-nl',  // cheerful, enthusiastic
    teasing_playful:'aura-2-beatrix-nl',  // same as playful
    warm:           'aura-2-rhea-nl',     // caring, warm
    elegant:        'aura-2-daphne-nl',   // calm, professional
    seductive:      'aura-2-daphne-nl',   // elegant/seductive
    shy:            'aura-2-cornelia-nl', // friendly, polite
    breathless:     'aura-2-cornelia-nl', // soft, gentle
    dominant:       'aura-2-hestia-nl',   // expressive, bold
    mature:         'aura-2-hestia-nl',   // experienced, dominant
    mysterious:     'aura-2-leda-nl',     // empathetic, sincere
    sultry_purring: 'aura-2-leda-nl',     // deep, sultry
  },
  en: {
    playful:        'aura-2-thalia-en',
    teasing_playful:'aura-2-thalia-en',
    warm:           'aura-2-helena-en',
    elegant:        'aura-2-pandora-en',
    seductive:      'aura-2-pandora-en',
    shy:            'aura-2-amalthea-en',
    breathless:     'aura-2-amalthea-en',
    dominant:       'aura-2-athena-en',
    mature:         'aura-2-athena-en',
    mysterious:     'aura-2-luna-en',
    sultry_purring: 'aura-2-luna-en',
  },
  de: {
    playful:        'aura-2-viktoria-de',
    teasing_playful:'aura-2-viktoria-de',
    warm:           'aura-2-aurelia-de',
    elegant:        'aura-2-elara-de',
    seductive:      'aura-2-elara-de',
    shy:            'aura-2-lara-de',
    breathless:     'aura-2-lara-de',
    dominant:       'aura-2-kara-de',
    mature:         'aura-2-kara-de',
    mysterious:     'aura-2-viktoria-de',
    sultry_purring: 'aura-2-viktoria-de',
  },
  fr: {
    playful: 'aura-2-agathe-fr', teasing_playful: 'aura-2-agathe-fr',
    warm: 'aura-2-agathe-fr', elegant: 'aura-2-agathe-fr', seductive: 'aura-2-agathe-fr',
    shy: 'aura-2-agathe-fr', breathless: 'aura-2-agathe-fr',
    dominant: 'aura-2-agathe-fr', mature: 'aura-2-agathe-fr',
    mysterious: 'aura-2-agathe-fr', sultry_purring: 'aura-2-agathe-fr',
  },
  es: {
    playful:        'aura-2-celeste-es',
    teasing_playful:'aura-2-celeste-es',
    warm:           'aura-2-estrella-es',
    elegant:        'aura-2-diana-es',
    seductive:      'aura-2-diana-es',
    shy:            'aura-2-olivia-es',
    breathless:     'aura-2-olivia-es',
    dominant:       'aura-2-carina-es',
    mature:         'aura-2-carina-es',
    mysterious:     'aura-2-selena-es',
    sultry_purring: 'aura-2-selena-es',
  },
  it: {
    playful:        'aura-2-livia-it',
    teasing_playful:'aura-2-livia-it',
    warm:           'aura-2-melia-it',
    elegant:        'aura-2-maia-it',
    seductive:      'aura-2-maia-it',
    shy:            'aura-2-cinzia-it',
    breathless:     'aura-2-cinzia-it',
    dominant:       'aura-2-demetra-it',
    mature:         'aura-2-demetra-it',
    mysterious:     'aura-2-maia-it',
    sultry_purring: 'aura-2-maia-it',
  },
};

// Fallback: character id -> voice type (for characters without explicit voiceStyle)
const CHARACTER_VOICE_TYPE: Record<string, VoiceType> = {
  'jalin': 'playful', 'lisselot': 'teasing_playful', 'dion': 'playful',
  'saphina': 'playful', 'sophie': 'playful', 'suzzie_shelbi': 'teasing_playful',
  'lisa': 'playful', 'staysy': 'playful',
  'vivianna': 'warm', 'shavon': 'sultry_purring', 'assaana': 'warm',
  'esmeralda': 'warm', 'irma': 'warm', 'bonita': 'warm',
  'krista': 'warm', 'suzanne': 'warm', 'mellina': 'warm',
  'kimberly': 'elegant', 'andrea': 'seductive', 'bella': 'elegant',
  'paula': 'elegant', 'marta': 'elegant', 'nowella': 'elegant', 'page': 'elegant',
  'alexia': 'shy', 'anna': 'shy', 'katja': 'shy',
  'landa': 'breathless', 'melissa': 'shy', 'wendy': 'shy',
  'astrid': 'dominant', 'marga': 'mature', 'belinda': 'dominant',
  'anouk': 'dominant', 'claudia': 'dominant', 'anette': 'dominant',
  'kassandra': 'dominant', 'linda': 'dominant', 'stella': 'dominant',
  'darra': 'mysterious', 'eva': 'mysterious', 'jamie': 'mysterious',
  'anastasia': 'mysterious', 'luna': 'mysterious', 'naomi': 'mysterious',
  'qwen': 'mysterious', 'wanda': 'mysterious',
};

// Current language - set by the app
let currentLanguage = 'nl';

const MAX_CHARS = 1900; // Deepgram limit is 2000, leave buffer

let currentAudio: HTMLAudioElement | null = null;

export function setTTSLanguage(lang: string): void {
  currentLanguage = lang.split('-')[0]; // 'nl-NL' -> 'nl'
}

function getVoiceForCharacter(characterId: string, voiceStyle?: string): string {
  const lang = VOICE_MAP[currentLanguage] || VOICE_MAP['nl'];

  // 1. Use explicit voiceStyle if provided (e.g. from character definition or custom character)
  if (voiceStyle && voiceStyle in lang) {
    return lang[voiceStyle as VoiceType];
  }

  // 2. Look up by character id
  const id = characterId.toLowerCase();
  if (id in CHARACTER_VOICE_TYPE) {
    return lang[CHARACTER_VOICE_TYPE[id]];
  }

  // 3. Partial match on id (e.g. 'brooke_kassandra' contains 'kassandra')
  for (const [key, voiceType] of Object.entries(CHARACTER_VOICE_TYPE)) {
    if (id.includes(key)) return lang[voiceType];
  }

  // 4. For custom characters: map common voiceStyle keywords
  if (voiceStyle) {
    const vs = voiceStyle.toLowerCase();
    if (vs.includes('dom') || vs.includes('bold') || vs.includes('assertive')) return lang['dominant'];
    if (vs.includes('shy') || vs.includes('innocent') || vs.includes('nervous')) return lang['shy'];
    if (vs.includes('warm') || vs.includes('caring') || vs.includes('tender')) return lang['warm'];
    if (vs.includes('elegant') || vs.includes('classy') || vs.includes('refined')) return lang['elegant'];
    if (vs.includes('myster') || vs.includes('dark') || vs.includes('whisper')) return lang['mysterious'];
    if (vs.includes('mature') || vs.includes('milf') || vs.includes('experienced')) return lang['mature'];
    if (vs.includes('seduct') || vs.includes('seduc')) return lang['seductive'];
    if (vs.includes('breath') || vs.includes('panting')) return lang['breathless'];
    if (vs.includes('sultry') || vs.includes('purr')) return lang['sultry_purring'];
  }

  return lang['playful']; // default
}

function truncateText(text: string): string {
  if (text.length <= MAX_CHARS) return text;
  // Cut at last sentence boundary
  const truncated = text.substring(0, MAX_CHARS);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclaim = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  const cutAt = Math.max(lastPeriod, lastExclaim, lastQuestion);
  return cutAt > MAX_CHARS / 2 ? truncated.substring(0, cutAt + 1) : truncated;
}

// Strip markdown/special chars for cleaner speech
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\*+/g, '')          // Remove asterisks (bold/italic markdown)
    .replace(/[_~`#]/g, '')       // Remove other markdown chars
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove markdown links
    .replace(/\n{2,}/g, '. ')    // Double newlines to pause
    .replace(/\n/g, ' ')         // Single newlines to space
    .replace(/\s{2,}/g, ' ')     // Multiple spaces to one
    .trim();
}

export async function speakWithDeepgram(
  text: string,
  characterId: string = 'default',
  voiceStyle?: string
): Promise<void> {
  stopSpeaking();

  const cleanText = truncateText(cleanTextForSpeech(text));
  if (!cleanText) return;

  const voice = getVoiceForCharacter(characterId, voiceStyle);

  try {
    // Always use the server-side proxy (keeps API key off the client)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = await getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: cleanText, voice }),
    });

    if (!response.ok) throw new Error('TTS API error');
    const data = await response.json();
    const audioUrl = `data:audio/mpeg;base64,${data.audio}`;
    currentAudio = new Audio(audioUrl);

    return new Promise<void>((resolve, reject) => {
      if (!currentAudio) return resolve();
      currentAudio.onended = () => { currentAudio = null; resolve(); };
      currentAudio.onerror = (e) => { currentAudio = null; reject(e); };
      currentAudio.play().catch(reject);
    });
  } catch (error) {
    console.error('Deepgram TTS failed, falling back to browser TTS:', error);
    fallbackBrowserTTS(cleanText);
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  // Also stop any browser TTS fallback
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}

function fallbackBrowserTTS(text: string): void {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'nl-NL';
  utterance.rate = 0.9;
  utterance.pitch = 1.1;
  const voices = window.speechSynthesis.getVoices();
  const dutchVoice = voices.find(v => v.lang.startsWith('nl'));
  if (dutchVoice) utterance.voice = dutchVoice;
  window.speechSynthesis.speak(utterance);
}
