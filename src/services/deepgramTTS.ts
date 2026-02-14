// Deepgram TTS Service - replaces browser speechSynthesis with realistic AI voices
import { getAccessToken } from './supabaseData';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/speak';
const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

// Voice personality types mapped to Deepgram Aura-2 voices per language
// Each character has a voice "type" that maps to the best matching voice in each language
type VoiceType = 'playful' | 'warm' | 'elegant' | 'shy' | 'dominant' | 'mysterious';

const VOICE_MAP: Record<string, Record<VoiceType, string>> = {
  nl: {
    playful: 'aura-2-beatrix-nl',    // cheerful, enthusiastic
    warm: 'aura-2-rhea-nl',          // caring, warm
    elegant: 'aura-2-daphne-nl',     // calm, professional
    shy: 'aura-2-cornelia-nl',       // friendly, polite
    dominant: 'aura-2-hestia-nl',    // expressive, bold
    mysterious: 'aura-2-leda-nl',    // empathetic, sincere
  },
  en: {
    playful: 'aura-2-thalia-en',     // energetic
    warm: 'aura-2-helena-en',        // positive, friendly, raspy
    elegant: 'aura-2-pandora-en',    // smooth, melodic
    shy: 'aura-2-amalthea-en',      // engaging, cheerful
    dominant: 'aura-2-athena-en',    // confident
    mysterious: 'aura-2-luna-en',    // calm, deep
  },
  de: {
    playful: 'aura-2-viktoria-de',   // charismatic, warm
    warm: 'aura-2-aurelia-de',       // warm
    elegant: 'aura-2-elara-de',      // elegant
    shy: 'aura-2-lara-de',          // friendly
    dominant: 'aura-2-kara-de',      // bold
    mysterious: 'aura-2-viktoria-de', // (reuse, limited voices)
  },
  fr: {
    playful: 'aura-2-agathe-fr',    // charismatic, natural
    warm: 'aura-2-agathe-fr',       // (only 1 female voice)
    elegant: 'aura-2-agathe-fr',
    shy: 'aura-2-agathe-fr',
    dominant: 'aura-2-agathe-fr',
    mysterious: 'aura-2-agathe-fr',
  },
  es: {
    playful: 'aura-2-celeste-es',    // energetic, positive
    warm: 'aura-2-estrella-es',      // natural, mature
    elegant: 'aura-2-diana-es',      // professional
    shy: 'aura-2-olivia-es',        // gentle
    dominant: 'aura-2-carina-es',    // confident
    mysterious: 'aura-2-selena-es',  // smooth
  },
  it: {
    playful: 'aura-2-livia-it',     // approachable, cheerful
    warm: 'aura-2-melia-it',        // warm
    elegant: 'aura-2-maia-it',      // elegant
    shy: 'aura-2-cinzia-it',        // gentle
    dominant: 'aura-2-demetra-it',   // strong
    mysterious: 'aura-2-maia-it',    // (reuse)
  },
};

// Character -> voice type mapping
const CHARACTER_VOICE_TYPE: Record<string, VoiceType> = {
  // Playful / teasing characters
  'jalin': 'playful', 'lisselot': 'playful', 'dion': 'playful',
  'saphina': 'playful', 'sophie': 'playful', 'suzzie_shelbi': 'playful',
  'lisa': 'playful', 'staysy': 'playful',
  // Warm / sensual characters
  'vivianna': 'warm', 'shavon': 'warm', 'assaana': 'warm',
  'esmeralda': 'warm', 'irma': 'warm', 'bonita': 'warm',
  'krista': 'warm', 'suzanne': 'warm', 'mellina': 'warm',
  // Elegant / seductive characters
  'kimberly': 'elegant', 'andrea': 'elegant', 'bella': 'elegant',
  'paula': 'elegant', 'marta': 'elegant', 'nowella': 'elegant', 'page': 'elegant',
  // Shy / nervous characters
  'alexia': 'shy', 'anna': 'shy', 'katja': 'shy',
  'landa': 'shy', 'melissa': 'shy', 'wendy': 'shy',
  // Dominant / aggressive characters
  'astrid': 'dominant', 'marga': 'dominant', 'belinda': 'dominant',
  'anouk': 'dominant', 'claudia': 'dominant', 'anette': 'dominant',
  'kassandra': 'dominant', 'linda': 'dominant', 'stella': 'dominant',
  // Mysterious / whispering characters
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

function getVoiceForCharacter(characterName: string): string {
  const name = characterName.toLowerCase();
  const lang = VOICE_MAP[currentLanguage] || VOICE_MAP['nl'];
  
  // Find voice type for this character
  for (const [key, voiceType] of Object.entries(CHARACTER_VOICE_TYPE)) {
    if (name.includes(key)) return lang[voiceType];
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
  characterName: string = 'default'
): Promise<void> {
  // Stop any currently playing audio
  stopSpeaking();

  const cleanText = truncateText(cleanTextForSpeech(text));
  if (!cleanText) return;

  const voice = getVoiceForCharacter(characterName);
    const isProduction = !import.meta.env.DEV;

  try {
    let audioBase64: string;

      if (isProduction) {
        // Use API proxy in production
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
      audioBase64 = data.audio;
    } else {
      // Direct API call in development
      const apiKey = DEEPGRAM_API_KEY;
      if (!apiKey) {
        console.warn('No Deepgram API key, falling back to browser TTS');
        fallbackBrowserTTS(cleanText);
        return;
      }

      const response = await fetch(
        `${DEEPGRAM_API_URL}?model=${voice}&encoding=mp3`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: cleanText }),
        }
      );

      if (!response.ok) throw new Error('Deepgram API error');
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      audioBase64 = btoa(binary);
    }

    // Play the audio
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;
    currentAudio = new Audio(audioUrl);
    
    return new Promise<void>((resolve, reject) => {
      if (!currentAudio) return resolve();
      currentAudio.onended = () => {
        currentAudio = null;
        resolve();
      };
      currentAudio.onerror = (e) => {
        currentAudio = null;
        reject(e);
      };
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
