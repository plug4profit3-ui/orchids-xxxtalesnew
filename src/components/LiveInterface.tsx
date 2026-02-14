
import { geminiService } from '../services/geminiService';
import { getCharacters, getLanguageName, getTexts } from '../constants';
import { speakWithDeepgram, stopSpeaking } from '../services/deepgramTTS';
import Icons from './Icon';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ModelConfig, Language, UserProfile } from '../types';

interface LiveInterfaceProps {
  config: ModelConfig;
  isActive: boolean;
  language: Language;
  onConsumeCredit: (amount: number) => boolean;
  user: UserProfile;
}

const LiveInterface: React.FC<LiveInterfaceProps> = ({ config, isActive, language, onConsumeCredit, user }) => {
  const characters = getCharacters(language).filter(c => !c.isDoll);
  const [connectionState, setConnectionState] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(characters[0]);
  const [isTalking, setIsTalking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [subtitle, setSubtitle] = useState<string>('');

  const subtitleTimeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bgVisualizerRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const messagesRef = useRef<{ role: string; content: string }[]>([]);
  const systemPromptRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const isMounted = useRef(true);
  const isMicOnRef = useRef(isMicOn);
  const creditIntervalRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);

  const t = getTexts(language).live;

  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);

  const cleanup = useCallback(() => {
    stopSpeaking();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (creditIntervalRef.current) {
      clearInterval(creditIntervalRef.current);
      creditIntervalRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearInterval(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    messagesRef.current = [];
    if (isMounted.current) {
      setConnectionState('idle');
      setIsTalking(false);
      setIsThinking(false);
      setIsListening(false);
      setSubtitle('');
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Credit deduction
  useEffect(() => {
    if (connectionState === 'connected' && !user.isPremium) {
      creditIntervalRef.current = setInterval(() => {
        const success = onConsumeCredit(20);
        if (!success) cleanup();
      }, 60000);
    } else {
      if (creditIntervalRef.current) { clearInterval(creditIntervalRef.current); creditIntervalRef.current = null; }
    }
    return () => { if (creditIntervalRef.current) clearInterval(creditIntervalRef.current); };
  }, [connectionState, user.isPremium, onConsumeCredit, cleanup]);

  const showSubtitleText = (text: string) => {
    if (!isMounted.current) return;
    setSubtitle(text);
    if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
    subtitleTimeoutRef.current = window.setTimeout(() => {
      if (isMounted.current) setSubtitle('');
    }, 6000);
  };

  // Send message via Venice text API + Deepgram TTS
  const sendMessage = async (userMessage: string) => {
    if (!isMounted.current || connectionState !== 'connected') return;

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
          if (isMounted.current) showSubtitleText(partial);
        }
      );

      fullText = response || fullText;
      messagesRef.current.push({ role: 'assistant', content: fullText });

      if (isMounted.current) {
        setIsThinking(false);
        showSubtitleText(fullText);

        setIsTalking(true);
        try {
          await speakWithDeepgram(fullText, selectedCharacter.name);
        } catch (e) {
          console.error('TTS failed:', e);
        }
        if (isMounted.current) {
          setIsTalking(false);
          if (isMicOnRef.current) startListening();
        }
      }
    } catch (e) {
      console.error('Live chat error:', e);
      if (isMounted.current) {
        setIsThinking(false);
        if (isMicOnRef.current) startListening();
      }
    }
  };

  // Speech recognition
  const startListening = () => {
    if (!isMounted.current || !isMicOnRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      const langMap: Record<string, string> = { nl: 'nl-NL', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', en: 'en-US' };
      recognition.lang = langMap[language] || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal) {
          const transcript = last[0].transcript.trim();
          if (transcript) sendMessage(transcript);
        }
      };

      recognition.onend = () => {
        if (isMounted.current && connectionState === 'connected' && isMicOnRef.current && !isThinking && !isTalking) {
          try { recognition.start(); } catch {}
        } else {
          if (isMounted.current) setIsListening(false);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') console.error('STT error:', e.error);
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

  // Silence detection
  useEffect(() => {
    if (connectionState === 'connected') {
      let lastActivity = Date.now();
      const resetActivity = () => { lastActivity = Date.now(); };
      window.addEventListener('touchstart', resetActivity);
      window.addEventListener('click', resetActivity);

      silenceTimerRef.current = setInterval(() => {
        if (Date.now() - lastActivity > 20000 && !isThinking && !isTalking) {
          sendMessage('[SYSTEM: User has been quiet for 20s. Say something flirty to re-engage. Keep it short, 1-2 sentences.]');
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

  // Background visualizer
  const startVisualizer = () => {
    const canvas = bgVisualizerRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = [];
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedX: Math.random() * 0.4 - 0.2,
        speedY: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.4 + 0.1
      });
    }

    const draw = () => {
      if (!ctx || !isMounted.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.25;
      const pulse = isTalking ? 1.3 : isThinking ? 1.1 : 1.0;
      const pulseRadius = baseRadius * pulse + Math.sin(Date.now() / 1000) * 10;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
      gradient.addColorStop(0, `rgba(255, 215, 0, ${isTalking ? 0.12 : 0.04})`);
      gradient.addColorStop(0.6, `rgba(181, 154, 91, ${isTalking ? 0.04 : 0.01})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      particles.forEach(p => {
        p.x += p.speedX + (isTalking ? (Math.random() - 0.5) * 2 : 0);
        p.y += p.speedY + (isTalking ? (Math.random() - 0.5) * 2 : 0);
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const pSize = p.size + (isTalking ? 2 : 0);
        ctx.fillStyle = `rgba(255, 215, 0, ${p.opacity + (isTalking ? 0.2 : 0)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
        ctx.fill();
      });
    };
    draw();
  };

  const startCall = async () => {
    if (connectionState !== 'idle' || !isMounted.current) return;

    if (!user.isPremium) {
      if (!onConsumeCredit(20)) return;
    }

    setConnectionState('calling');

    const targetLanguageName = getLanguageName(language);
    const charName = selectedCharacter.name;

    systemPromptRef.current = `
JE ROL: Je bent ${charName}. Een echte vrouw in een privé videogesprek.
CONTEXT: Je zit in een live videogesprek met een man. Je kunt hem horen.
TAAL: Spreek ALLEEN in het ${targetLanguageName.toUpperCase()}. Gebruik spreektaal, wees natuurlijk.
STEM: ${selectedCharacter.voiceStyle || 'verleidelijk'}.

HET DOEL: EEN ECHT GESPREK VOEREN MET OPBOUW.
Dit is GEEN monoloog. Dit is een ping-pong interactie.

INSTRUCTIES VOOR INTERACTIE (CRUCIAAL):
1. HOU HET KORT: Geef antwoorden van 1 tot maximaal 3 zinnen.
2. STEL VRAGEN: Eindig je beurt vaak met een vraag om hem te laten praten.
3. LUISTER: Reageer direct op wat hij zegt.

DE OPBOUW (FASE-STRUCTUUR):
- FASE 1 (START): Wees warm, flirterig en nieuwsgierig. Begroet hem.
- FASE 2 (SPANNING): Als het gesprek loopt, word plagerig. Geef complimentjes.
- FASE 3 (ACTIE): Pas als de spanning hoog is, word je explicieter.

KARAKTER INFO:
${selectedCharacter.desc}
${selectedCharacter.personality}
`;

    messagesRef.current = [];

    try {
      // Setup camera if enabled
      if (isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 480 }, height: { ideal: 640 }, facingMode: 'user' }
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(console.error);
          }
        } catch (e) {
          console.warn('Camera not available:', e);
          setIsCameraOn(false);
        }
      }

      setConnectionState('connected');
      startVisualizer();

      // Send initial greeting
      await sendMessage(`[SYSTEM: De verbinding is open. Begroet hem kort en flirterig in het ${targetLanguageName}. Max 2 zinnen.]`);
    } catch (e) {
      console.error("Kon gesprek niet starten:", e);
      cleanup();
    }
  };

  // IDLE SCREEN
  if (connectionState === 'idle') {
    return (
      <div className="h-full bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20 blur-xl scale-110"></div>
        <div className="relative z-10 max-w-md w-full p-6 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8">
          <div className="relative mx-auto w-44 h-44">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold-500/30 animate-[spin_12s_linear_infinite]"></div>
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-gold-500 shadow-[0_0_50px_rgba(255,215,0,0.4)]">
              <img src={selectedCharacter.avatar} alt={selectedCharacter.name} className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-headline font-bold text-white tracking-tight">{selectedCharacter.name}</h2>
            <p className="text-gold-500 uppercase tracking-[0.3em] text-[10px] mt-3 font-black">{t.vip_label}</p>
          </div>
          <div className="flex justify-center gap-2.5 py-4 flex-wrap max-w-xs mx-auto overflow-y-auto max-h-40 no-scrollbar">
            {characters.map(char => (
              <button key={char.id} onClick={() => setSelectedCharacter(char)} className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all ${selectedCharacter.id === char.id ? 'border-gold-500 scale-115 shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'border-white/10 opacity-40 hover:opacity-100'}`}>
                <img src={char.avatar} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <button onClick={startCall} className="w-full py-5 btn-premium rounded-[2rem] text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-[0_10px_40px_rgba(255,215,0,0.3)]">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <Icons.Video size={24} fill="currentColor" />
                <span>{t.start_call}</span>
              </div>
              {!user.isPremium && <span className="text-[9px] mt-1 font-bold opacity-80">(20 Credits / min)</span>}
            </div>
          </button>
          <div className="flex justify-center gap-6 text-zinc-500">
            <button onClick={() => setIsCameraOn(!isCameraOn)} className={`p-4 rounded-full border transition-all ${isCameraOn ? 'bg-white/10 border-gold-500 text-gold-500' : 'border-zinc-800 hover:border-zinc-600'}`}>{isCameraOn ? <Icons.Video size={20} /> : <Icons.VideoOff size={20} />}</button>
            <button onClick={() => setIsMicOn(!isMicOn)} className={`p-4 rounded-full border transition-all ${isMicOn ? 'bg-white/10 border-gold-500 text-gold-500' : 'border-zinc-800 hover:border-zinc-600'}`}>{isMicOn ? <Icons.Mic size={20} /> : <Icons.MicOff size={20} />}</button>
          </div>
        </div>
      </div>
    );
  }

  // CALLING SCREEN
  if (connectionState === 'calling') {
    return (
      <div className="h-full bg-black flex flex-col items-center justify-center relative">
        <div className="relative z-10 flex flex-col items-center space-y-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gold-500 rounded-full animate-pulse opacity-20"></div>
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gold-500 shadow-2xl relative z-10">
              <img src={selectedCharacter.avatar} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-headline font-bold text-white uppercase tracking-widest">{selectedCharacter.name}</h3>
            <p className="text-gold-500/70 animate-pulse mt-4 font-black text-xs uppercase tracking-[0.4em]">{t.connecting}</p>
          </div>
          <button onClick={cleanup} className="p-5 bg-red-600 rounded-full text-white active:scale-90 shadow-xl"><Icons.PhoneOff size={36} fill="currentColor" /></button>
        </div>
      </div>
    );
  }

  // CONNECTED SCREEN
  return (
    <div className="h-full bg-black relative overflow-hidden">
      <canvas ref={bgVisualizerRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" />
      <div className="absolute inset-0 z-[1] pointer-events-none">
        {selectedCharacter.video && <video src={selectedCharacter.video} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80 scale-105 mix-blend-screen" />}
        {!selectedCharacter.video && <img src={selectedCharacter.avatar} className="w-full h-full object-cover opacity-50 blur-sm scale-110" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/95" />
      </div>
      {isCameraOn && streamRef.current && (
        <div className="absolute top-12 right-6 w-32 md:w-56 aspect-[3/4] bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl z-20">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
        </div>
      )}

      {/* Status indicator */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isTalking ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : isThinking ? 'bg-yellow-500 shadow-[0_0_10px_#eab308] animate-pulse' : 'bg-gold-500 shadow-[0_0_10px_#FFD700]'} animate-pulse`}></div>
        <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest">
          {isTalking ? `${selectedCharacter.name} SPREEKT` : isThinking ? `${selectedCharacter.name} DENKT...` : 'LIVE'}
        </span>
        {isListening && !isTalking && !isThinking && (
          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Icons.Mic size={10} className="animate-pulse" /> Luistert...
          </span>
        )}
      </div>

      {/* Subtitle */}
      <div className="absolute bottom-48 left-0 right-0 px-8 text-center z-10 pointer-events-none pb-safe-bottom">
        <div className={`inline-block bg-black/70 backdrop-blur-2xl px-8 py-5 rounded-[2.5rem] text-lg md:text-2xl font-body italic text-gold-50 border border-gold-500/10 transition-all duration-500 shadow-2xl ${subtitle ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>{subtitle}</div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pb-safe-bottom">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="hidden md:flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-gold-500 shadow-[0_0_10px_#FFD700] animate-pulse-gold"></div>
              <span className="text-[10px] font-black text-gold-500 uppercase tracking-widest">LIVE</span>
            </div>
            <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-tighter">{t.hd_conn}</span>
          </div>
          <div className="flex items-center gap-6 mx-auto md:mx-0">
            <button
              onClick={() => {
                const newMic = !isMicOn;
                setIsMicOn(newMic);
                isMicOnRef.current = newMic;
                if (newMic) startListening();
                else stopListening();
              }}
              className={`p-5 rounded-full backdrop-blur-xl transition-all border ${isMicOn ? 'bg-white/10 border-white/10 text-white' : 'bg-white text-black'}`}
            >
              {isMicOn ? <Icons.Mic size={28} /> : <Icons.MicOff size={28} />}
            </button>
            <button onClick={cleanup} className="p-7 rounded-full bg-red-600 text-white shadow-[0_0_40px_rgba(220,38,38,0.4)] transform active:scale-90 transition-all">
              <Icons.PhoneOff size={40} fill="currentColor" />
            </button>
            <button
              onClick={() => {
                const newCam = !isCameraOn;
                setIsCameraOn(newCam);
                if (newCam && !streamRef.current) {
                  navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 480 }, height: { ideal: 640 }, facingMode: 'user' } })
                    .then(stream => {
                      streamRef.current = stream;
                      if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(console.error);
                      }
                    }).catch(console.error);
                } else if (!newCam && streamRef.current) {
                  streamRef.current.getVideoTracks().forEach(t => t.stop());
                  streamRef.current = null;
                }
              }}
              className={`p-4 rounded-full backdrop-blur-xl transition-all border ${isCameraOn ? 'bg-white/10 border-white/10 text-white' : 'bg-white text-black'}`}
            >
              {isCameraOn ? <Icons.Video size={28} /> : <Icons.VideoOff size={28} />}
            </button>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-tighter">{selectedCharacter.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveInterface;
