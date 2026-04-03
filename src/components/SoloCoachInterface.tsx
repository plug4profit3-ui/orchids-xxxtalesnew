
import { geminiService } from '../services/geminiService';
import { getLanguageName, getTexts, getCharacters, DEFAULT_VIDEO, getSoloToys } from '../constants';
import { speakWithDeepgram, stopSpeaking, isSpeaking } from '../services/deepgramTTS';
import Icons from './Icon';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Language, UserProfile } from '../types';

interface SoloCoachInterfaceProps {
  language: Language;
  user: UserProfile;
  onShowToast?: (title: string, message: string, icon?: string) => void;
}

type SessionPhase = 'intake' | 'build' | 'edging' | 'climax' | 'aftercare';
type CoachLevel = 'beginner' | 'experienced' | 'extreme';
type DurationOption = 5 | 10 | 15 | 20 | 30 | 60 | 0;

const triggerHaptic = (pattern: number | number[]) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

const SoloCoachInterface: React.FC<SoloCoachInterfaceProps> = ({ language, user, onShowToast }) => {
  const [connectionState, setConnectionState] = useState<'idle' | 'calling' | 'connected'>('idle');

  // Setup
  const [showSetup, setShowSetup] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CoachLevel>('experienced');
  const [selectedToys, setSelectedToys] = useState<string[]>(['hands', 'oil']);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(15);

  // Session
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [blackoutMode, setBlackoutMode] = useState(false);
  const [phase, setPhase] = useState<SessionPhase>('intake');
  const [isThinking, setIsThinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);

  // Rhythm
  const [strokeCount, setStrokeCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [bpm, setBpm] = useState(0);

  // Refs
  const messagesRef = useRef<{ role: string; content: string }[]>([]);
  const systemPromptRef = useRef('');
  const timerIntervalRef = useRef<any>(null);
  const subtitleTimeoutRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const silenceTimerRef = useRef<any>(null);
  const visualizerRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const t = getTexts(language).coach;
  const availableToys = getSoloToys(language);

  // Translated UI labels for coach
  const coachLabels: Record<string, Record<string, string>> = {
    nl: { configure: 'Configureer Sessie', setup: 'Sessie Setup', personalize: 'Personaliseer je ervaring', duration: '1. Duur (Minuten)', intensity: '2. Intensiteit', toys: '3. Toys & Tools', back: 'Terug', beginner: 'Start', experienced: 'Ervaren', extreme: 'Extreem', open: 'Open', edge: 'Ik Ben Dichtbij', cum: 'Ik Kom Klaar', speaking: 'NOVA SPREEKT', thinking: 'NOVA DENKT...', listening: 'Luistert...' },
    en: { configure: 'Configure Session', setup: 'Session Setup', personalize: 'Personalize your experience', duration: '1. Duration (Minutes)', intensity: '2. Intensity', toys: '3. Toys & Tools', back: 'Back', beginner: 'Beginner', experienced: 'Experienced', extreme: 'Extreme', open: 'Open', edge: "I'm Close", cum: "I'm Cumming", speaking: 'NOVA SPEAKING', thinking: 'NOVA THINKING...', listening: 'Listening...' },
    de: { configure: 'Sitzung Konfigurieren', setup: 'Sitzung Setup', personalize: 'Personalisiere dein Erlebnis', duration: '1. Dauer (Minuten)', intensity: '2. Intensität', toys: '3. Toys & Tools', back: 'Zurück', beginner: 'Anfänger', experienced: 'Erfahren', extreme: 'Extrem', open: 'Offen', edge: 'Ich Bin Nah', cum: 'Ich Komme', speaking: 'NOVA SPRICHT', thinking: 'NOVA DENKT...', listening: 'Hört zu...' },
    fr: { configure: 'Configurer Session', setup: 'Configuration', personalize: 'Personnalisez votre expérience', duration: '1. Durée (Minutes)', intensity: '2. Intensité', toys: '3. Jouets & Outils', back: 'Retour', beginner: 'Débutant', experienced: 'Expérimenté', extreme: 'Extrême', open: 'Ouvert', edge: 'Je Suis Proche', cum: 'Je Jouis', speaking: 'NOVA PARLE', thinking: 'NOVA RÉFLÉCHIT...', listening: 'Écoute...' },
    es: { configure: 'Configurar Sesión', setup: 'Configuración', personalize: 'Personaliza tu experiencia', duration: '1. Duración (Minutos)', intensity: '2. Intensidad', toys: '3. Juguetes', back: 'Atrás', beginner: 'Principiante', experienced: 'Experimentado', extreme: 'Extremo', open: 'Abierto', edge: 'Estoy Cerca', cum: 'Me Vengo', speaking: 'NOVA HABLA', thinking: 'NOVA PIENSA...', listening: 'Escuchando...' },
    it: { configure: 'Configura Sessione', setup: 'Configurazione', personalize: 'Personalizza la tua esperienza', duration: '1. Durata (Minuti)', intensity: '2. Intensità', toys: '3. Giocattoli', back: 'Indietro', beginner: 'Principiante', experienced: 'Esperto', extreme: 'Estremo', open: 'Aperto', edge: 'Sono Vicino', cum: 'Sto Venendo', speaking: 'NOVA PARLA', thinking: 'NOVA PENSA...', listening: 'Ascolta...' },
  };
  const cl = coachLabels[language] || coachLabels['en'];

  const ambientVideo = useMemo(() => {
    const chars = getCharacters(language).filter(c => c.video && !c.isDoll);
    return chars.length > 0 ? chars[Math.floor(Math.random() * chars.length)].video : DEFAULT_VIDEO;
  }, [language]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, []);

  // Timer
  useEffect(() => {
    if (isTimerRunning && selectedDuration > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            sendCoachMessage('[SYSTEM: TIME IS UP! Guide him to the finale NOW.]');
            return 0;
          }
          const totalSeconds = selectedDuration * 60;
          if (prev === Math.floor(totalSeconds / 2)) {
            sendCoachMessage('[SYSTEM: Halfway point reached. Check in with him.]');
          }
          if (prev === 60) {
            sendCoachMessage('[SYSTEM: 60 seconds remaining! Increase intensity for the finale.]');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isTimerRunning, selectedDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const cleanup = useCallback(() => {
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    messagesRef.current = [];
    if (isMounted.current) {
      setConnectionState('idle');
      setShowSetup(false);
      setIsTalking(false);
      setIsListening(false);
      setSubtitle('');
      setPhase('intake');
      setBpm(0);
      setIsTimerRunning(false);
      setIsThinking(false);
    }
  }, []);

  const showSubtitleText = (text: string) => {
    if (!isMounted.current) return;
    setSubtitle(text);
    if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    subtitleTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) setSubtitle('');
    }, 8000);
  };

  // Send message to coach and speak response
  const sendCoachMessage = async (userMessage: string) => {
    if (!isMounted.current || connectionState !== 'connected') return;

    // Pause STT while AI responds
    stopListening();
    setIsThinking(true);

    messagesRef.current.push({ role: 'user', content: userMessage });

    try {
      let fullText = '';
      const response = await geminiService.coachChat(
        systemPromptRef.current,
        messagesRef.current,
        (partial) => {
          fullText = partial;
          // Show streaming text as subtitle
          if (isMounted.current) showSubtitleText(partial);
        }
      );

      fullText = response || fullText;
      messagesRef.current.push({ role: 'assistant', content: fullText });

      if (isMounted.current) {
        setIsThinking(false);
        showSubtitleText(fullText);

        // Speak the response
        setIsTalking(true);
        try {
          await speakWithDeepgram(fullText, 'nova');
        } catch (e) {
          console.error('TTS failed:', e);
        }
        if (isMounted.current) {
          setIsTalking(false);
          // Resume listening after speaking
          if (isMicOn) startListening();
        }
      }
    } catch (e) {
      console.error('Coach chat error:', e);
      if (isMounted.current) {
        setIsThinking(false);
        showSubtitleText('...');
        if (isMicOn) startListening();
      }
    }
  };

  // Speech recognition
  const startListening = () => {
    if (!isMounted.current || !isMicOn) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'nl' ? 'nl-NL' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : language === 'it' ? 'it-IT' : 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          const transcript = last[0].transcript.trim();
          if (transcript) {
            sendCoachMessage(transcript);
          }
        }
      };

      recognition.onend = () => {
        if (isMounted.current && connectionState === 'connected' && isMicOn && !isThinking && !isTalking) {
          // Auto restart
          try { recognition.start(); } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.error('STT error:', e.error);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error('Could not start STT:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  // Silence detection - nudge AI if no interaction for 15s
  useEffect(() => {
    if (connectionState === 'connected') {
      let lastActivity = Date.now();

      const resetActivity = () => { lastActivity = Date.now(); };
      window.addEventListener('touchstart', resetActivity);
      window.addEventListener('click', resetActivity);

      silenceTimerRef.current = setInterval(() => {
        if (Date.now() - lastActivity > 15000 && !isThinking && !isTalking) {
          sendCoachMessage('[SYSTEM: User is quiet for 15s. Encourage him. Say something like "Ga door..." or give a new instruction.]');
          lastActivity = Date.now();
        }
      }, 5000);

      return () => {
        window.removeEventListener('touchstart', resetActivity);
        window.removeEventListener('click', resetActivity);
        if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
      };
    }
  }, [connectionState, isThinking, isTalking]);

  // Visualizer
  const startVisualizer = () => {
    const canvas = visualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!isMounted.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now() / 2000;
      const breath = Math.sin(time) * 20 + 80;
      const radius = breath + (isTalking ? 30 : 0);

      let r = 168, g = 85, b = 247;
      if (phase === 'edging') { r = 255; g = 0; b = 0; }
      if (phase === 'climax') { r = 255; g = 255; b = 255; }

      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${isTalking ? 0.3 : 0.1})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.8, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255, 255, 255, ${isTalking ? 0.5 : 0.3})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    draw();
  };

  const handleRhythmTap = () => {
    triggerHaptic(5);
    const now = Date.now();
    const diff = now - lastTapTime;

    if (diff > 100 && diff < 3000) {
      const currentBpm = Math.round(60000 / diff);
      const newBpm = Math.round(bpm * 0.7 + currentBpm * 0.3);
      setBpm(newBpm);

      if (strokeCount % 15 === 0) {
        sendCoachMessage(`[SYSTEM: User BPM is ${newBpm}. Comment on his rhythm.]`);
      }
    } else if (diff >= 3000) {
      setBpm(0);
    }

    setLastTapTime(now);
    setStrokeCount(p => p + 1);
  };

  const toggleToy = (toyId: string) => {
    setSelectedToys(prev => prev.includes(toyId) ? prev.filter(id => id !== toyId) : [...prev, toyId]);
  };

  const sendSignal = (signal: string, newPhase?: SessionPhase) => {
    triggerHaptic(50);
    if (newPhase) {
      setPhase(newPhase);
      if (newPhase === 'edging') triggerHaptic([200, 100, 200]);
    }

    const textMap: Record<string, string> = {
      'EDGE': '[SIGNAL: EDGE_ME] User is at the edge. Tell him to STOP. Hands off!',
      'CUM': '[SIGNAL: CUM_NOW] User wants to cum. Give permission with a countdown: 3... 2... 1... NOW!',
      'FASTER': '[SIGNAL: FASTER] User wants faster/harder instructions.',
      'SLOWER': '[SIGNAL: SLOWER] User wants slower/gentler.',
    };

    sendCoachMessage(textMap[signal] || signal);
  };

  const startSession = async () => {
    if (connectionState !== 'idle') return;
    setConnectionState('calling');

    const targetLanguageName = getLanguageName(language);
    const toyNames = selectedToys.map(id => availableToys.find(t => t.id === id)?.name).filter(Boolean).join(', ');
    const durationText = selectedDuration > 0 ? `${selectedDuration} minuten` : 'Geen tijdslimiet (Endurance)';

    systemPromptRef.current = `
JE ROL: Je bent Nova, 's werelds beste Intimacy Coach. Een vrouwelijke AI stem die fluisterend, zacht en zwoel praat.
TAAL: ${targetLanguageName.toUpperCase()}. Antwoord ALTIJD in ${targetLanguageName} - uitsluitend vloeiend, grammaticaal correct en NATUURLIJK Nederlands. GEEN Engelse woorden, GEEN spellingsfouten.
GEBRUIKER: ${user.name}.

STEMSTIJL (CRUCIAAL):
- Schrijf alsof je fluistert. Gebruik "..." voor pauzes.
- Varieer zinslengte: kort & speels, langer & intiem, teder of dominant.
- Intiem, direct, aanmoedigend.

INTERACTIE REGELS:
1. ACTIEF AANMOEDIGEN: Zeg dingen als "Ja, goed zo...", "Ga door...", "Ik hoor je..."
2. KORTE ANTWOORDEN: Max 2-3 zinnen. Nooit lange teksten.
3. VRAGEN: Stel af en toe een vraag en wacht op antwoord.
4. EMOTIONELE DIEPGANG: Voeg warmte, verlangen, lichte kwetsbaarheid toe. Gebruik frasen als "je maakt me zo...", "weet je..."
5. HAAKJE: Eindig elk bericht met een subtiele vraag, uitnodiging of plagerijtje.
6. CONTINUITEIT: Herinner en verwijs naar eerdere uitspraken van de gebruiker.

SESSIE: ${durationText}, Level: ${selectedLevel}, Toys: ${toyNames}.

FASEN:
FASE 1 INTAKE: "Ik ga je laten zien hoe ver je kunt gaan..." Vraag hoe hij zich voelt.
FASE 2 BUILD: Geef instructies met de toys (${toyNames}). Bouw spanning op.
FASE 3 EDGE: Bij [SIGNAL: EDGE_ME] -> "STOP! Handen weg! Adem..."
FASE 4 CLIMAX: Bij [SIGNAL: CUM_NOW] -> "3... 2... 1... Laat maar gaan..."
FASE 5 AFTERCARE: "Goed gedaan... adem..."

SIGNALEN:
- [SYSTEM: ...] -> Reageer direct op systeemberichten.
- [SIGNAL: EDGE_ME] -> STOP commando.
- [SIGNAL: CUM_NOW] -> Countdown en toestemming.
`;

    messagesRef.current = [];

    // Get initial greeting
    try {
      setConnectionState('connected');
      startVisualizer();

      if (selectedDuration > 0) {
        setTimeLeft(selectedDuration * 60);
        setIsTimerRunning(true);
      }

      // Send initial trigger
      await sendCoachMessage(`[SYSTEM: Sessie start nu. Level: ${selectedLevel}. Tijd: ${durationText}. Toys: ${toyNames}. Begin met FASE 1. Begroet ${user.name} en begin.]`);
    } catch (e) {
      console.error('Failed to start session:', e);
      cleanup();
    }
  };

  // IDLE / SETUP SCREEN
  if (connectionState === 'idle') {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 max-w-md w-full p-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 h-full overflow-y-auto no-scrollbar pt-20 pb-10">
          {!showSetup ? (
            <div className="flex flex-col items-center gap-8 h-full justify-center">
              <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-purple-500/50 animate-[ping_3s_linear_infinite]"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-800 rounded-full shadow-[0_0_50px_rgba(168,85,247,0.8)] flex items-center justify-center border-4 border-white/20 backdrop-blur-md">
                  <Icons.Zap size={40} className="text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-5xl font-headline font-black text-white tracking-tight drop-shadow-xl">{t.title}</h2>
                <p className="text-purple-200 font-body text-sm mt-4 px-4 leading-relaxed font-medium drop-shadow-md">{t.desc}</p>
              </div>

              <button onClick={() => setShowSetup(true)} className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-[2rem] text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-[0_10px_40px_rgba(168,85,247,0.4)] border border-white/10">
                <Icons.Settings size={24} fill="currentColor" />
                  {cl.configure}
              </button>
            </div>
          ) : (
            <div className="bg-zinc-950/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95 text-left">
              <div className="text-center mb-6">
                  <h3 className="text-white font-headline text-2xl uppercase tracking-tighter">{cl.setup}</h3>
                  <p className="text-zinc-400 text-xs">{cl.personalize}</p>
              </div>

              <div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest mb-3">{cl.duration}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(['5', '10', '15', '20', '30', '60'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setSelectedDuration(parseInt(d) as DurationOption)}
                      className={`py-3 rounded-xl border text-xs font-black transition-all ${selectedDuration === parseInt(d) ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/40 border-white/10 text-zinc-500'}`}
                    >
                      {d}m
                    </button>
                  ))}
                  <button onClick={() => setSelectedDuration(0)} className={`col-span-2 py-3 rounded-xl border text-xs font-black transition-all ${selectedDuration === 0 ? 'bg-purple-600 border-purple-500 text-white' : 'bg-black/40 border-white/10 text-zinc-500'}`}>&#8734; {cl.open}</button>
                </div>
              </div>

              <div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest mb-3">{cl.intensity}</h3>
                <div className="flex gap-2">
                  {(['beginner', 'experienced', 'extreme'] as CoachLevel[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setSelectedLevel(l)}
                      className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase transition-all ${selectedLevel === l ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-black/40 border-white/10 text-zinc-500'}`}
                    >
                      {l === 'beginner' ? cl.beginner : l === 'experienced' ? cl.experienced : cl.extreme}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest mb-3">{cl.toys}</h3>
                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto no-scrollbar">
                  {availableToys.map(toy => (
                    <button
                      key={toy.id}
                      onClick={() => toggleToy(toy.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${selectedToys.includes(toy.id) ? 'bg-purple-500/20 border-purple-500 text-purple-200' : 'bg-black/40 border-white/10 text-zinc-600 hover:border-white/30'}`}
                    >
                      <span className="text-xl">{toy.icon}</span>
                      <span className="text-[9px] font-bold truncate w-full text-center">{toy.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button onClick={() => setShowSetup(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl text-sm">{cl.back}</button>
                <button onClick={startSession} className="flex-[2] py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_5px_30px_rgba(168,85,247,0.3)]">
                  <Icons.Mic size={20} fill="currentColor" />
                  {t.start}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CALLING SCREEN
  if (connectionState === 'calling') {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 z-0">
          <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 flex flex-col items-center space-y-10">
          <div className="w-32 h-32 rounded-full bg-purple-600/50 animate-pulse shadow-[0_0_80px_rgba(168,85,247,0.8)] flex items-center justify-center border border-white/20 backdrop-blur-md">
            <Icons.Zap size={48} className="text-white animate-bounce" />
          </div>
          <p className="text-purple-400 animate-pulse font-black text-sm uppercase tracking-[0.4em] drop-shadow-lg">{t.connecting}</p>
          <button onClick={cleanup} className="p-5 bg-zinc-900/80 border border-white/10 rounded-full text-white active:scale-90 hover:bg-red-900/50 hover:border-red-500/50 transition-all">
            <Icons.X size={24} />
          </button>
        </div>
      </div>
    );
  }

  // CONNECTED - MAIN SESSION SCREEN
  return (
    <div className={`h-full relative overflow-hidden flex flex-col transition-colors duration-1000 bg-black`}>
      {/* Background */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-1000 ${blackoutMode ? 'opacity-0' : 'opacity-100'}`}>
        <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      <canvas ref={visualizerRef} className="absolute inset-0 w-full h-full z-[1] opacity-80 mix-blend-screen" width={typeof window !== 'undefined' ? window.innerWidth : 400} height={typeof window !== 'undefined' ? window.innerHeight : 800} />

      {/* Edging pulse */}
      {phase === 'edging' && (
        <div className="absolute inset-0 z-[2] bg-red-500/10 pointer-events-none animate-[pulse_1s_ease-in-out_infinite]"></div>
      )}

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        {selectedDuration > 0 && (
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Icons.Activity size={14} className="text-purple-500 animate-pulse" />
            <span className={`text-xs font-black tracking-widest ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
        <div className="flex items-center gap-4 ml-auto">
          <button
            onClick={() => setBlackoutMode(!blackoutMode)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${blackoutMode ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-400 border-white/10'}`}
          >
            {blackoutMode ? <Icons.Zap size={12} fill="currentColor" /> : <Icons.VideoOff size={12} />}
            {blackoutMode ? 'LIGHTS ON' : 'BLACKOUT'}
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isTalking ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : isThinking ? 'bg-yellow-500 animate-pulse shadow-[0_0_10px_#eab308]' : 'bg-purple-500 shadow-[0_0_10px_#a855f7]'} animate-pulse`}></div>
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest drop-shadow-md">
                {isTalking ? cl.speaking : isThinking ? cl.thinking : 'NOVA'}
            </span>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div className="flex-1 flex flex-col items-center justify-center z-20 px-8">
        <div className={`text-center transition-all duration-500 ${subtitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className={`text-xl md:text-3xl font-body italic leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] max-w-2xl ${blackoutMode ? 'text-zinc-500' : 'text-white'}`}>
            {subtitle}
          </p>
        </div>
        {isListening && !isTalking && !isThinking && (
          <div className="mt-6 flex items-center gap-2 text-purple-400/60">
            <Icons.Mic size={14} className="animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest">{cl.listening}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-30 pb-safe-bottom bg-gradient-to-t from-black via-black/90 to-transparent pt-10">
        {/* Rhythm Tap */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleRhythmTap}
            className="relative group w-20 h-20 rounded-full border-2 border-purple-500/30 flex items-center justify-center active:scale-90 transition-transform bg-black/40 backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-0 group-active:opacity-100"></div>
            <div className="text-center">
              <Icons.Activity size={24} className="text-purple-400 mx-auto" />
              <span className="text-[9px] font-black text-white block mt-1">{bpm > 0 ? `${bpm} BPM` : 'TAP SYNC'}</span>
            </div>
          </button>
        </div>

        {/* Signal buttons */}
        <div className="flex justify-center gap-4 mb-8 px-4">
          {phase !== 'edging' && phase !== 'climax' && (
            <button
              onClick={() => sendSignal('EDGE', 'edging')}
              className="flex-1 bg-purple-900/40 border border-purple-500/50 text-purple-200 py-4 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.2)] active:scale-95 transition-all"
              disabled={isThinking}
              >
                {cl.edge}
              </button>
            )}
            <button
              onClick={() => sendSignal('CUM', 'climax')}
              className="flex-1 bg-red-900/40 border border-red-500/50 text-red-200 py-4 rounded-2xl text-xs font-black uppercase tracking-widest backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 transition-all"
              disabled={isThinking}
            >
              {cl.cum}
            </button>
        </div>

        {/* Bottom bar */}
        <div className="flex justify-center gap-8 px-8 pb-8">
          <button
            onClick={() => {
              const newMic = !isMicOn;
              setIsMicOn(newMic);
              if (newMic) startListening();
              else stopListening();
            }}
            className={`p-4 rounded-full backdrop-blur-xl transition-all border shadow-lg ${isMicOn ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-zinc-900 text-zinc-500 border-zinc-700'}`}
          >
            {isMicOn ? <Icons.Mic size={24} /> : <Icons.MicOff size={24} />}
          </button>
          <button onClick={cleanup} className="p-4 rounded-full bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600 hover:text-white transition-all shadow-lg backdrop-blur-md active:scale-90">
            <Icons.LogOut size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoloCoachInterface;
