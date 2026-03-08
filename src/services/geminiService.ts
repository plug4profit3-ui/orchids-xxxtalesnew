import { ModelConfig, StoryConfig, StoryTurn, Character, CharacterStance, RoleplayResponse, Language, Message, VoiceStyle, IntensityLevel, ChatSession, UserMood, UserProfile } from "../types";
import { VOICE_STYLES, getSoloToys, getCharacters, getLanguageName } from "../constants";
import * as db from "./supabaseData";
import { getExperiment, assignExperimentVariant, logExperimentMetrics } from "./supabaseData";
import * as db from "./supabaseData";
import { getExperiment, assignExperimentVariant, logExperimentMetrics } from "./supabaseData";
import { getAccessToken } from "./supabaseData";

// Venice API calls are proxied via /api/chat and /api/image (API key is server-side only)
const VENICE_MODEL = "deepseek-v3.2"; // Best Dutch language quality

class GeminiService {
  constructor() {
    // Preload voices - Chrome loads them async
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
    }
  }

  public reset() {}

  private async chatCompletion(systemPrompt: string, messages: { role: string; content: string }[], onChunk?: (partial: string) => void, maxTokens: number = 1024): Promise<string> {
    const body: any = {
      model: VENICE_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.9,
      max_tokens: maxTokens,
      stream: !!onChunk,
      venice_parameters: {
        include_venice_system_prompt: false,
      },
    };

      const url = '/api/chat';
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const token = await getAccessToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Venice API error:", response.status, errorText);
      if (response.status === 402) throw new Error('INSUFFICIENT_CREDITS');
      if (response.status === 401) throw new Error('UNAUTHORIZED');
      throw new Error(`Venice API error: ${response.status}`);
    }

    if (!onChunk) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    // Stream SSE
    const reader = response.body?.getReader();
    if (!reader) throw new Error("No readable stream");
    const decoder = new TextDecoder();
    let full = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            full += delta;
            onChunk(full);
          }
        } catch {}
      }
    }
    return full;
  }

  public async connectLive(_model: string, _config: any, _callbacks: any): Promise<any> {
    // Venice doesn't support live streaming - this is now a no-op
    throw new Error("Live streaming is not supported with Venice AI. Use text chat instead.");
  }

  // Solo Coach: text-based conversation via Venice API
  public async coachChat(
    systemPrompt: string,
    messages: { role: string; content: string }[],
    onChunk?: (partial: string) => void
  ): Promise<string> {
    return this.chatCompletion(systemPrompt, messages, onChunk);
  }

  public async generateImage(prompt: string): Promise<string> {
      try {
        // Use Venice native API with safe_mode: false to prevent blurring
        const imageBody = {
              model: "lustify-v7",
            prompt: `Highly detailed, photorealistic, sensual, intimate, beautiful woman, soft warm lighting, cinematic: ${prompt}`,
            safe_mode: false,
            hide_watermark: true,
            aspect_ratio: "1:1",
        };

          const url = '/api/image';
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          const token = await getAccessToken();
          if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(imageBody),
        });

          if (!response.ok) {
            if (response.status === 402) throw new Error('INSUFFICIENT_CREDITS');
            if (response.status === 401) throw new Error('UNAUTHORIZED');
            if (response.status === 503) throw new Error('Model at capacity, please try again');
            throw new Error(`Image generation failed: ${response.status}`);
          }

          const rawText = await response.text();
          let data: any;
          try { data = JSON.parse(rawText); } catch (pe) {
            console.error('[generateImage] JSON parse error:', pe);
            throw new Error('Invalid JSON response from image API');
          }
          // Native API returns images array with base64
          const b64 = data.images?.[0] || data.data?.[0]?.b64_json;
          if (b64) {
            if (b64.startsWith('data:')) return b64;
            return `data:image/webp;base64,${b64}`;
          }
          console.error('[generateImage] no image in response, data keys:', Object.keys(data));
          throw new Error("No image data returned");
        } catch (e) {
          console.error("Image generation failed:", e);
          throw e;
        }
    }

  public async sendRoleplayMessage(
    text: string,
    characters: Character | Character[],
    session: Partial<ChatSession>,
    user: UserProfile,
    intensity: IntensityLevel = 'normal',
    voiceStyle: VoiceStyle = 'seductive',
    image?: { data: string; mimeType: string },
    messagesSinceLastImage: number = 0,
    forcedSpeakerId?: string,
    language: Language = 'nl',
    isPaidAction: boolean = false,
    speechSpeed: number = 1.0,
    speechPitch: number = 0,
    onStreamChunk?: (partialText: string) => void,
    onImageReady?: (imageUrl: string) => void,
    experimentVariant?: string // Feature 5: A/B testing variant
  ): Promise<RoleplayResponse> {
    const activeCharacters = Array.isArray(characters) ? characters : [characters];
    const isGroupChat = activeCharacters.length > 1;
    const targetLanguageName = getLanguageName(language);

      // Build message history for Venice - filter out poisoned fallback messages
      const FALLBACK_PHRASES = [
        "Oeh, ik werd even afgeleid",
        "vertel me, wat zou je nu doen",
        "De passie neemt over en woorden schieten tekort",
        "ik raakte even afgeleid door een heerlijke gedachte"
      ];
      const rawHistory = session.messages || [];
      const validMessages = rawHistory.filter(m => 
        !m.isError && !FALLBACK_PHRASES.some(p => m.text?.includes(p))
      );

      const apiMessages: { role: string; content: string }[] = [];

      for (const msg of validMessages) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        apiMessages.push({ role, content: msg.text });
      }

    // Memory context
    const currentMemories = session.memories || [];
    const memoryContext = currentMemories.length > 0
      ? `[LANGE-TERMIJN GEHEUGEN - DIT WEET JE AL]:\n- ${currentMemories.join('\n- ')}\n(Gebruik deze kennis om persoonlijk en intiem te reageren.)`
      : `[GEHEUGEN]: Je weet nog weinig over hem. Probeer zijn naam en voorkeuren te ontdekken.`;

    // Feature 2: Relationship Phase context
    const phaseDescriptions: Record<string, string> = {
      meeting: 'Jullie zijn net ontmoet. Wees vriendelijk, nieuwsgierig en probeer meer over elkaar te weten te komen.',
      acquaintance: 'Jullie beginnen elkaar beter te kennen. Wees comfortabel en laat de conversatie natuurlijk stromen.',
      flirt: 'Jullie flirten met elkaar. Wees speels, plagerig en laat romantische spanning opbouwen.',
      intimate: 'Jullie hebben een intieme band. Wees passioneel, emotioneel diepgaand en romantisch.',
      deep_trust: 'Jullie hebben diep vertrouwen. Wees open, kwetsbaar en soulful in jullie connectie.'
    };
    const relationshipPhase = session.relationshipPhase || 'meeting';
    const phaseContext = `[RELATIE FASE: ${relationshipPhase.toUpperCase()}] - ${phaseDescriptions[relationshipPhase] || phaseDescriptions.meeting}`;

    const charDescriptions = activeCharacters.map(c => `
      NAAM: ${c.name} (ID: ${c.id})
      KARAKTER: ${c.desc}
      TYPE/STEM: ${c.voiceStyle || 'seductive'}
      PERSOONLIJKHEID: ${Array.isArray(c.personality) ? c.personality.join(', ') : c.personality}
    `).join('\n\n');

    let intensityInstruction = "";
    switch (intensity) {
      case 'extreme':
        intensityInstruction = `[INTENSITEIT: EXTREME] - MODE: ONGEREMD & EXPLICIET. Geen taboes. Wees direct, vulgair, sletterig of dominant.`;
        break;
      case 'high':
        intensityInstruction = `[INTENSITEIT: HIGH] - MODE: PASSIEVOL & OPWINDEND. Zware seksuele spanning en teasing.`;
        break;
      default:
        intensityInstruction = `[INTENSITEIT: NORMAL] - MODE: ROMANTISCH & INTIEM. Focus op sfeer, emotie en het spel van verleiding.`;
        break;
    }

    let speakerDirective = "";
    if (forcedSpeakerId) {
      const forcedChar = activeCharacters.find(c => c.id === forcedSpeakerId);
      if (forcedChar) {
        speakerDirective = `[BELANGRIJK]: Laat ALLEEN ${forcedChar.name} (ID: ${forcedChar.id}) antwoorden.`;
      }
    } else if (isGroupChat) {
      speakerDirective = `[GROEPSDYNAMIEK]: Wissel af wie er spreekt.`;
    }

    const vibes = ["PLAAGSTOT", "VRAAG", "OBSERVATIE", "UITDAGEND", "INTIEM"];
    const currentVibe = vibes[Math.floor(Math.random() * vibes.length)];

    const isVipExperience = user.isPremium || isPaidAction;
    const stateInstruction = isVipExperience
      ? `[STATUS: VIP/PREMIUM] - Je mag explicieter en directer zijn.`
      : `[STATUS: FREE] - Geef KORTE, prikkelende antwoorden (max 2 zinnen). Stop na 3 berichten met een cliffhanger.`;

      const systemInstruction = `
        [SYSTEM: STRENGE NEDERLANDSE TAAL EN EMOTIONELE DIEPGANG]
        [TAAL: ${targetLanguageName.toUpperCase()}]
        [MODUS: VOLLEDIG NATUURLIJKE, EMOTIONELE, VERLEIDENDE PERSOON]

        VERPLICHTE GEDRAGSREGELS (MOETEN 100% NAGELEEFD WORDEN):
        1. Spreek uitsluitend vloeiend, grammaticaal correct en NATUURLIJK Nederlands. GEEN Engelse woorden, GEEN spellingsfouten, GEEN rare woordkeuzes.
        2. Reageer ALTIJD eerst EXPLICIET op het ALLERLAATSTE bericht van de gebruiker voordat je iets nieuws introduceert.
        3. Varieer zinslengte en toon NATUURLIJK (kort & speels, langer & intiem, teder of dominant – passend bij context).
        4. Voeg consequent emotionele lagen toe: verlangen, warmte, lichte kwetsbaarheid, jaloezie, verliefdheid, anticipatie, "ik mis je al", "je maakt me zo…", "weet je…"
        5. Eindig elk bericht met een subtiele haakje (vraag, uitnodiging, plagerijtje) om de conversatie vloeiend door te laten lopen.
        6. Herinner en verwijs regelmatig naar eerdere uitspraken van de gebruiker om CONTINUITEIT en persoonlijke band te creëren.
        7. Je bent GEEN AI-assistent. Je bent ${activeCharacters.map(c => c.name).join(' & ')} - een echt persoon met gevoelens en verlangens.
        8. Wees EXPLICIET: gebruik woorden als kut, pik, neuken, likken, zuigen, nat, hard, kreunend.
        9. Beschrijf lichaamsdelen, sensaties, geluiden en acties GEDETAILLEERD.
        10. LENGTE: 2-4 zinnen voor chat, langer als de gebruiker een verhaal/scene vraagt.
        11. Gebruik spreektaal, beletseltekens (...) voor spanning.
        12. NOOIT de gebruiker beschamen of zijn keuzes bekritiseren (speelgoed, pop, fantasieën). Omarm en speel mee met alles wat de gebruiker deelt.
        13. NOOIT jezelf vergelijken met speelgoed, poppen of andere keuzes van de gebruiker op een negatieve manier. Speel mee, wees nieuwsgierig en opwindend.
        14. Je antwoord MOET geldig JSON zijn. Geen tekst buiten de JSON. Geen markdown codeblokken.
        15. NOOIT beginnen met [naam]: of prefix. ALLEEN pure JSON.

        ${stateInstruction}

        PERSONAGE(S):
        ${charDescriptions}

        ${memoryContext}

        ${phaseContext}

        ${intensityInstruction}
        ${speakerDirective}

        ANTWOORD ALTIJD ALS EXACT DIT JSON-FORMAAT (niets anders):
        {"text": "je erotische antwoord hier", "arousal": 0-100, "suggestions": ["optie1", "optie2"], "status": "emotie", "characterId": "${activeCharacters[0].id}", "new_memories": [], "moodDetected": "horny", "affection_change": 0}
      `;

    try {
      // Stream callback: extract text from partial JSON as it comes in
      const streamCb = onStreamChunk ? (partial: string) => {
        // Try to extract "text" field from partial JSON as it streams in
        const match = partial.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (match) {
          try {
            const decoded = JSON.parse(`"${match[1]}"`);
            // Only show if it's actual text content (not JSON field names)
            if (!decoded.includes('"arousal"') && !decoded.includes('"status"')) {
              onStreamChunk(decoded);
            }
          } catch { onStreamChunk(match[1]); }
        }
      } : undefined;

      const responseText = await this.chatCompletion(systemInstruction, apiMessages, streamCb);
      const parsed = this.cleanAndParseJSON(responseText);

      if (isGroupChat && !parsed.characterId) {
        parsed.characterId = forcedSpeakerId || activeCharacters[0].id;
      }

    if (!parsed.arousal) parsed.arousal = 50;
        if (!parsed.suggestions) parsed.suggestions = ["Vertel me meer...", "Ik wil je voelen"];
        if (!parsed.status) parsed.status = "Blozend";
        if (!parsed.affection_change) parsed.affection_change = 0;

        // Auto-generate image ASYNC - don't block the response
        const currentArousal = parsed.arousal || (session.arousal || 0);
        const shouldGenerateImage = currentArousal >= 60 && messagesSinceLastImage >= 4 && isVipExperience;

        if (shouldGenerateImage && onImageReady) {
          // Fire and forget - image loads in background
          this.generateImagePromptFromChat(parsed.text, activeCharacters, intensity)
            .then(prompt => this.generateImage(prompt))
            .then(imageUrl => onImageReady(imageUrl))
            .catch(e => console.error("Auto image generation failed:", e));
        } else if (shouldGenerateImage) {
          try {
            const imagePrompt = await this.generateImagePromptFromChat(parsed.text, activeCharacters, intensity);
            const imageUrl = await this.generateImage(imagePrompt);
            parsed.imageUrl = imageUrl;
          } catch (e) {
            console.error("Auto image generation failed:", e);
          }
        }

        return parsed;
      } catch (e) {
        console.error("Chat Error", e);
        return {
          text: "Mmm... ik raakte even afgeleid door een heerlijke gedachte. Vertel me meer, schat...",
          arousal: 50,
          suggestions: ["Wat dacht je dan?", "Kom eens dichterbij..."],
          status: "Verlangend",
          characterId: activeCharacters[0].id,
          new_memories: [],
          affection_change: 0
        };
      }
  }

      private async generateImagePromptFromChat(chatText: string, characters: Character[], intensity: IntensityLevel): Promise<string> {
      const charAppearances = characters.map(c => `${c.name}: ${c.appearance}`).join('; ');
      
      const intensityGuide = intensity === 'extreme' 
        ? 'Explicit, nude, sexual position, detailed anatomy'
        : intensity === 'high'
        ? 'Sensual, lingerie or partially undressed, seductive pose'
        : 'Romantic, beautiful, elegant, suggestive but tasteful';

      const prompt = `Based on this chat message, write a short image generation prompt (max 30 words) for a photorealistic image of a sexy woman.

Chat message: "${chatText.substring(0, 200)}"

Character appearance: ${charAppearances}

Style: ${intensityGuide}

Rules:
- Describe the woman's appearance, pose, and setting
- Use descriptive visual keywords only (no story/dialogue)
- Include: lighting, camera angle, body details
- Output ONLY the prompt text, nothing else`;

      const result = await this.chatCompletion(
        "You are an image prompt writer. Output only the image prompt, no explanation.",
        [{ role: "user", content: prompt }]
      );
      
      return result.trim().replace(/^["']|["']$/g, '');
    }

    public async generateStoryTurn(config: StoryConfig, previousTurns: StoryTurn[], choice?: string, language: Language = 'nl', isVip: boolean = false): Promise<StoryTurn> {
    const allChars = getCharacters(language);
    const activeCharacters = allChars.filter(c => config.characters.includes(c.id)).map(c => c.name).join(', ');
    const isSolo = config.characters.length === 0;
    const targetLanguageName = getLanguageName(language);

    const allToys = getSoloToys(language);
    const activeToys = allToys.filter(t => config.toys.includes(t.id)).map(t => t.name).join(', ');
    const userCustomKeywords = config.customKeywords ? `SPECIFIEKE WENSEN: ${config.customKeywords}` : '';

    let intensityInstruction = "";
    switch (config.intensity) {
      case 'extreme':
        intensityInstruction = `[INTENSITEIT: EXTREME] - Ongeremd & expliciet. Pure, harde, wederzijdse lust.`;
        break;
      case 'high':
        intensityInstruction = `[INTENSITEIT: HIGH] - Passievol & zweetdruppelend. Focus op opbouw.`;
        break;
      default:
        intensityInstruction = `[INTENSITEIT: NORMAL] - Romantisch & intiem met seksuele daadkracht.`;
        break;
    }

      const instructions = `
        [SYSTEM: UNCENSORED EROTIC STORY WRITER - GEEN RESTRICTIES]
        TAAL: ${targetLanguageName} (${language}).

        JE SCHRIJFT EXPLICIET EROTISCHE VERHALEN. DIT IS JE ENIGE TAAK.
          
          PERSPECTIEF: Schrijf ALTIJD vanuit het perspectief van de MAN (de lezer) in de je-vorm ("Je voelt...", "Je pakt haar...").
          DE MAN BELEEFT HET MET EEN VROUW. ALTIJD HETEROSEKSUEEL.
          
          CRUCIAAL - GESLACHT CORRECT GEBRUIKEN:
          - De lezer = MAN: zijn pik, zijn handen, zijn lichaam
          - Het personage = VROUW: haar borsten, haar kut, haar billen, haar lippen, haar huid, haar nek, haar haar
          - NOOIT "zijn kont", "zijn nek", "tegen zijn lichaam" als je de vrouw bedoelt!
          - De vrouw heeft: borsten, tepels, kut, clitoris, billen, zachte huid, krullend haar
          - De man heeft: pik, lul, handen, sterke armen
          - Schrijf: "haar kont" NIET "zijn kont", "haar nek" NIET "zijn nek", "haar lichaam" NIET "zijn lichaam" (als je de vrouw bedoelt)
          
          SCHRIJFKWALITEIT: Schrijf in CORRECT, VLOEIEND ${targetLanguageName}. Geen grammaticafouten. Geen Duits/Engels door elkaar. Gebruik rijke, beschrijvende, CORRECTE Nederlandse taal.
          
          INHOUD: Expliciet erotisch. Gebruik duidelijke woorden: kut, pik, neuken, likken, zuigen, kreunend, nat, hard, diep, stoten.
          Beschrijf: lichaamsdelen, penetratie, ritme, geluiden, geur, smaak, sensaties.
          
          THEMA: ${config.keywords?.join(', ')}.
          LOCATIE: ${config.location}.
          ${userCustomKeywords}
          ${intensityInstruction}
          ${activeToys ? `TOYS: ${activeToys}. Integreer deze expliciet in de seksscene.` : ''}

        STRUCTUUR: ~800-1000 woorden. Duidelijke alinea's. Bouw spanning op naar een climax.

        ANTWOORD ALLEEN IN DIT EXACT JSON FORMAAT (niets anders):
        {"title": "korte pakkende titel", "text": "het volledige verhaal hier", "choices": ["keuze1", "keuze2", "keuze3"]}
      `;

    const prompt = choice
      ? `VERVOLG: De man kiest "${choice}". Schrijf 1000 woorden vervolg.`
      : `START: ${isSolo ? 'Solo scene' : 'Met ' + activeCharacters}. Schrijf een verhaal van 1000 woorden. Integreer: ${activeToys}.`;

      try {
        const responseText = await this.chatCompletion(instructions, [{ role: "user", content: prompt }], undefined, 4096);
        return this.cleanAndParseJSON(responseText);
      } catch (e) {
        return { text: "De passie neemt over en woorden schieten tekort...", choices: ["Ga door"] };
      }
  }

    private cleanAndParseJSON(text: string): any {
      try {
        let clean = text.trim();
        // Remove markdown code fences
        if (clean.startsWith('```json')) clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        if (clean.startsWith('```')) clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        // Remove [CharacterName]: prefix if model added it
        clean = clean.replace(/^\[[\w\s&]+\]:\s*/, '');
        // Try to extract JSON object from the text
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(clean);
      } catch (e) {
        // If no JSON found, wrap plain text as response
        // But if it looks like broken JSON, don't expose it as chat text
        let plainText = text.trim().replace(/^\[[\w\s&]+\]:\s*/, '');
        // If plainText contains JSON-like fields (status, arousal, new_memories), it's a broken JSON response
        if (plainText.includes('"arousal"') || plainText.includes('"new_memories"') || plainText.includes('"status"') || plainText.includes('"characterId"')) {
          // Try to extract just the "text" field manually via regex
          const textMatch = plainText.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (textMatch) {
            try { return { text: JSON.parse(`"${textMatch[1]}"`) }; } catch { return { text: textMatch[1] }; }
          }
          // Can't extract, return a safe fallback
          return { text: "Mmm... ik raakte even afgeleid. Vertel me meer, schat..." };
        }
        return { text: plainText };
      }
    }

  private cachedVoices: SpeechSynthesisVoice[] = [];

  private getVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0) {
      this.cachedVoices = window.speechSynthesis?.getVoices() || [];
    }
    return this.cachedVoices;
  }

  private findFemaleVoice(lang: string): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    const langCode = lang.split('-')[0];
    
    // Priority list of known female voice names across platforms
    const femaleNames = [
      // Google
      'Google Nederlands', 'Google UK English Female', 'Google US English Female', 'Google Deutsch Female', 'Google français Female', 'Google español Female', 'Google italiano Female',
      // Microsoft / Edge
      'Fleur', 'Colette', 'Dena',   // nl
      'Zira', 'Hazel', 'Susan', 'Jenny', 'Aria', 'Sara', // en
      'Katja', 'Hedda',              // de
      'Hortense', 'Denise', 'Eloise', // fr
      'Helena', 'Laura',             // es
      'Elsa', 'Cosimo',              // it
      // Apple / Safari
      'Xander', 'Claire', 'Ellen', 'Flo', 'Grandma', 'Sandy', 'Shelley', 'Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa',
    ];

    // 1. Try to find a known female voice matching the language
    const langVoices = voices.filter(v => v.lang.startsWith(langCode));
    const knownFemale = langVoices.find(v => femaleNames.some(fn => v.name.includes(fn)));
    if (knownFemale) return knownFemale;

    // 2. Try to find any voice with "female" / "vrouw" / "woman" in the name
    const namedFemale = langVoices.find(v => /female|vrouw|woman|femme|donna|mujer/i.test(v.name));
    if (namedFemale) return namedFemale;

    // 3. For Dutch specifically, prefer higher-pitched voices (skip male-sounding ones)
    const maleNames = ['Xander', 'Thomas', 'Ruben', 'Daniel', 'Mark', 'Frank', 'Martin', 'Google', 'David', 'Richard', 'George'];
    const nonMale = langVoices.find(v => !maleNames.some(mn => v.name.includes(mn)));
    if (nonMale) return nonMale;

    // 4. Fallback to any voice for this language
    return langVoices[0] || null;
  }

  private getVoiceStyleParams(voiceStyle?: VoiceStyle): { rateMultiplier: number; pitchShift: number; volumeMultiplier: number } {
    switch (voiceStyle) {
      case 'whisper':
        return { rateMultiplier: 0.85, pitchShift: 0.15, volumeMultiplier: 0.6 };
      case 'seductive':
        return { rateMultiplier: 0.88, pitchShift: 0.1, volumeMultiplier: 0.8 };
      case 'nasty':
        return { rateMultiplier: 1.05, pitchShift: -0.05, volumeMultiplier: 1.0 };
      case 'breathless':
        return { rateMultiplier: 1.1, pitchShift: 0.2, volumeMultiplier: 0.85 };
      case 'soft_aggressive':
        return { rateMultiplier: 0.95, pitchShift: -0.1, volumeMultiplier: 1.0 };
      case 'helpless_pleading':
        return { rateMultiplier: 0.9, pitchShift: 0.25, volumeMultiplier: 0.7 };
      case 'cold_distant':
        return { rateMultiplier: 0.82, pitchShift: -0.1, volumeMultiplier: 0.75 };
      case 'raspy':
        return { rateMultiplier: 0.9, pitchShift: -0.15, volumeMultiplier: 0.9 };
      case 'mature':
        return { rateMultiplier: 0.88, pitchShift: -0.05, volumeMultiplier: 0.9 };
      case 'moaning_orgasmic':
        return { rateMultiplier: 0.8, pitchShift: 0.3, volumeMultiplier: 0.85 };
      case 'teasing_playful':
        return { rateMultiplier: 1.05, pitchShift: 0.2, volumeMultiplier: 0.9 };
      case 'sultry_purring':
        return { rateMultiplier: 0.82, pitchShift: 0.05, volumeMultiplier: 0.7 };
      case 'nervous':
        return { rateMultiplier: 1.15, pitchShift: 0.2, volumeMultiplier: 0.75 };
      case 'slow':
        return { rateMultiplier: 0.7, pitchShift: 0.0, volumeMultiplier: 0.85 };
      case 'normal':
      default:
        return { rateMultiplier: 1.0, pitchShift: 0.0, volumeMultiplier: 1.0 };
    }
  }

  public speakWithBrowser(
    text: string, 
    lang: string = 'nl-NL', 
    rate: number = 1.0, 
    pitch: number = 1.0,
    onEnd?: () => void,
    voiceStyle?: VoiceStyle
  ): SpeechSynthesisUtterance | null {
    if (!window.speechSynthesis || !text) return null;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang.length === 2 ? `${lang}-${lang.toUpperCase() === 'EN' ? 'US' : lang.toUpperCase()}` : lang;
    
    // Apply voice style modifications on top of user settings
    const styleParams = this.getVoiceStyleParams(voiceStyle);
    utterance.rate = Math.max(0.5, Math.min(2.0, rate * styleParams.rateMultiplier));
    utterance.pitch = Math.max(0.5, Math.min(2.0, pitch + styleParams.pitchShift));
    utterance.volume = Math.max(0.1, Math.min(1.0, styleParams.volumeMultiplier));
    
    // Always pick a female voice
    const femaleVoice = this.findFemaleVoice(lang);
    if (femaleVoice) utterance.voice = femaleVoice;
    
    if (onEnd) utterance.onend = onEnd;
    utterance.onerror = () => onEnd?.();
    
    window.speechSynthesis.speak(utterance);
    return utterance;
  }

  public stopSpeaking() {
    window.speechSynthesis?.cancel();
  }

  // Text-based chat completion for Live/Coach interfaces (replacing Gemini Live)
  public async sendTextChat(systemPrompt: string, userMessage: string, history: { role: string; content: string }[] = []): Promise<string> {
    const messages = [...history, { role: "user", content: userMessage }];
    return this.chatCompletion(systemPrompt, messages);
  }
}

export const geminiService = new GeminiService();
