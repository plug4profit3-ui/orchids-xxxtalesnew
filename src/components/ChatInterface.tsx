
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Character, Message, ChatSession, UserProfile, Language, VoiceStyle, IntensityLevel, UserMood, RelationshipPhase, TypingIndicatorState, UserCharacterMemory } from '../types';
import { getGifts, DEFAULT_VIDEO, getTexts, getVoiceStyles, getDiceActions, getChatScenarios } from '../constants';
import { geminiService } from '../services/geminiService';
import { uploadImageToStorage, recordChatInteraction } from '../services/supabaseData';
import { memoryService, evolutionService, feedbackService } from '../services/memoryService';
import Icons from './Icon';
import TypingIndicator from './TypingIndicator';
import MemoryIndicator from './MemoryIndicator';

interface ChatInterfaceProps {
  initialSession: ChatSession;
  onSaveSession: (session: ChatSession) => void;
  user: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void; // Kept for interface compat, but not used for global memory anymore
  onConsumeCredit: (cost: number) => boolean;
  onConsumeDailyMessage: () => boolean;
  onShowPaywall: (reason: string) => void;
  language: Language;
  characters: Character[];
  onShowToast?: (title: string, message: string, icon?: string, characterId?: string) => void;
  // New credit API integration
  consumeCreditsApi?: (params: {
    estimated_input_tokens: number;
    estimated_output_tokens: number;
    message_id?: string;
    intensity?: 'normal' | 'high' | 'extreme';
  }) => Promise<{ success: boolean; requestId?: string; error?: string }>;
  adjustCreditsApi?: (params: {
    request_id: string;
    actual_input_tokens: number;
    actual_output_tokens: number;
    message_id?: string;
    intensity?: 'normal' | 'high' | 'extreme';
  }) => Promise<boolean>;
  refreshBalance?: () => Promise<void>;
}

const XP_PER_LEVEL = 100;

const getMoodIcon = (mood?: UserMood) => {
    switch (mood) {
        case 'horny': return '🔥';
        case 'lonely': return '🧸';
        case 'stressed': return '💆';
        case 'happy': return '✨';
        case 'angry': return '💢';
        case 'curious': return '🤔';
        default: return '😐';
    }
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialSession,
  onSaveSession,
  user,
  onUpdateUser,
  onConsumeCredit,
  onConsumeDailyMessage,
  onShowPaywall,
  language,
  characters,
  onShowToast,
  consumeCreditsApi,
  adjustCreditsApi,
  refreshBalance,
}) => {
  const [session, setSession] = useState<ChatSession>(initialSession);
  const [inputText, setInputText] = useState('');
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [diceResult, setDiceResult] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // State for voice modulation - initialized from session
  const [speechSpeed, setSpeechSpeed] = useState(initialSession.speechSpeed || 1.0);
  const [speechPitch, setSpeechPitch] = useState(initialSession.speechPitch || 0);

  const [nextSpeakerId, setNextSpeakerId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isMounted = useRef(true);

  const [intensity, setIntensity] = useState<IntensityLevel>(initialSession.intensity || 'normal');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>(
      initialSession.voiceStyle || 
      characters.find(c => c.id === initialSession.characterId)?.voiceStyle || 
      'seductive'
  );

  const texts = getTexts(language);
  const t = texts.chat;
  const tIntensity = texts.intensity;
  const gifts = getGifts(language);
  const diceActions = getDiceActions(language);
  const voiceStyles = getVoiceStyles(language);
  const chatScenarios = getChatScenarios(language);
  const [showScenarios, setShowScenarios] = useState(false);

  // Feature 1: Persistent Memory
  const [userCharacterMemory, setUserCharacterMemory] = useState<UserCharacterMemory | null>(null);
  const [showMemoryIndicator, setShowMemoryIndicator] = useState(true);

  // Feature 2: Character Evolution
  const [relationshipPhase, setRelationshipPhase] = useState<RelationshipPhase>(initialSession.relationshipPhase || 'meeting');
  const [interactionCount, setInteractionCount] = useState(initialSession.interactionCount || 0);

  // Feature 3: Real-time Feedback
  const [typingIndicatorState, setTypingIndicatorState] = useState<TypingIndicatorState>('thinking');
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);

  const activeCharacters = useMemo(() => {
    const ids = session.characterIds && session.characterIds.length > 0 
        ? session.characterIds 
        : [session.characterId];
    return ids.map(id => characters.find(c => c.id === id)).filter(Boolean) as Character[];
  }, [characters, session.characterId, session.characterIds]);

  const primaryCharacter = activeCharacters[0] || characters[0];
  const isGroupChat = activeCharacters.length > 1;

    const backgroundMedia = useMemo(() => {
        // Custom characters without video: use their avatar as static background
        if (primaryCharacter.isCustom && !primaryCharacter.video && primaryCharacter.avatar) {
          return { type: 'image' as const, src: primaryCharacter.avatar };
        }
        if (primaryCharacter.video) return { type: 'video' as const, src: primaryCharacter.video };
        const charWithVideo = activeCharacters.find(c => c.video);
        if (charWithVideo) return { type: 'video' as const, src: charWithVideo.video! };
        return { type: 'video' as const, src: DEFAULT_VIDEO };
    }, [primaryCharacter, activeCharacters]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
        isMounted.current = false;
        if (currentSourceRef.current) {
            try { currentSourceRef.current.stop(); } catch(e) {}
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  useEffect(() => {
    setSession(initialSession);
    if (initialSession.intensity) setIntensity(initialSession.intensity);
    if (initialSession.voiceStyle) {
        setVoiceStyle(initialSession.voiceStyle);
    } else {
        const firstChar = characters.find(c => c.id === initialSession.characterId);
        if (firstChar && firstChar.voiceStyle) setVoiceStyle(firstChar.voiceStyle);
    }
    // Also update speech params if session changes (e.g. loading different chat)
    setSpeechSpeed(initialSession.speechSpeed || 1.0);
    setSpeechPitch(initialSession.speechPitch || 0);
    
    // Feature 2: Load relationship phase and interaction count
    setRelationshipPhase(initialSession.relationshipPhase || 'meeting');
    setInteractionCount(initialSession.interactionCount || 0);
  }, [initialSession, characters]);

  // Feature 1: Load persistent memory on mount
  useEffect(() => {
    if (user.id && primaryCharacter?.id) {
      memoryService.getMemory(user.id, primaryCharacter.id).then(memory => {
        if (memory) {
          setUserCharacterMemory(memory);
        }
      });
    }
  }, [user.id, primaryCharacter?.id]);

  // Feature 2: Check for phase transition when interaction count changes
  useEffect(() => {
    if (evolutionService.shouldTransition(relationshipPhase, interactionCount)) {
      const nextPhase = evolutionService.getNextPhase(relationshipPhase, interactionCount);
      setRelationshipPhase(nextPhase);
      
      // Show toast for phase transition
      const phaseNames: Record<RelationshipPhase, string> = {
        meeting: 'Ontmoeting',
        acquaintance: 'Kennismaking',
        flirt: 'Flirt',
        intimate: 'Intiem',
        deep_trust: 'Diep Vertrouwen'
      };
      onShowToast?.('Relatie verdiept!', `Jullie relatie is nu: ${phaseNames[nextPhase]}`, '💕');
    }
  }, [interactionCount, relationshipPhase]);

  const updateSettings = (updates: { voiceStyle?: VoiceStyle; intensity?: IntensityLevel; speechSpeed?: number; speechPitch?: number }) => {
      if (updates.voiceStyle) setVoiceStyle(updates.voiceStyle);
      if (updates.intensity) setIntensity(updates.intensity);
      if (updates.speechSpeed !== undefined) setSpeechSpeed(updates.speechSpeed);
      if (updates.speechPitch !== undefined) setSpeechPitch(updates.speechPitch);
      
      const updatedSession = { 
          ...session, 
          ...updates 
      };
      setSession(updatedSession);
      onSaveSession(updatedSession);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isTyping]);

  const initAudio = useCallback(async () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

    const playSpeech = useCallback(async (text: string, speakerId?: string) => {
        if (!isMounted.current || isMuted || !text) return;

        setIsSpeaking(true);
        
        try {
          const { speakWithDeepgram } = await import('../services/deepgramTTS');
            // Use the actual speaker's character object for correct voice
            const speaker = speakerId 
              ? activeCharacters.find(c => c.id === speakerId) || primaryCharacter
              : primaryCharacter;
            await speakWithDeepgram(text, speaker?.id || speaker?.name || 'default', speaker?.voiceStyle);
        } catch (error) {
          console.error('Deepgram TTS failed:', error);
        } finally {
          if (isMounted.current) setIsSpeaking(false);
        }
      }, [isMuted, primaryCharacter, activeCharacters]);

  const recognitionRef = useRef<any>(null);
  const sttBaseTextRef = useRef('');

  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast?.('Niet beschikbaar', 'Spraakherkenning wordt niet ondersteund in deze browser.', '🎙️');
      return;
    }

    // Save current input as base text before starting recognition
    sttBaseTextRef.current = inputText.replace(/\s*\[.*?\]\s*/g, '').trim();

    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = { nl: 'nl-NL', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', it: 'it-IT' };
    const langPrefix = language.substring(0, 2);
    recognition.lang = langMap[langPrefix] || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => { setIsListening(false); recognitionRef.current = null; };
    recognition.onerror = (event: any) => {
      console.error('SpeechRecognition error:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === 'not-allowed') {
        onShowToast?.('Microfoon geblokkeerd', 'Geef toestemming voor de microfoon in je browser instellingen.', '🎙️');
      } else if (event.error === 'no-speech') {
        // silent, just stop
      } else {
        onShowToast?.('Spraakherkenning mislukt', `Fout: ${event.error}`, '⚠️');
      }
    };

    let finalTranscript = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interim = transcript;
        }
      }
      const base = sttBaseTextRef.current;
      const parts = [base, finalTranscript.trim(), interim ? `[${interim}]` : ''].filter(Boolean);
      setInputText(parts.join(' '));
    };

    try {
      recognition.start();
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
      recognitionRef.current = null;
      onShowToast?.('Spraakherkenning mislukt', 'Kon de microfoon niet starten. Probeer het opnieuw.', '🎙️');
    }
  }, [isListening, language, inputText, onShowToast]);

  const handleSendMessage = async () => {
    // Stop speech recognition if active
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; setIsListening(false); }
    // Clean up interim markers from voice input
    const cleanedInput = inputText.replace(/\s*\[.*?\]\s*/g, ' ').trim();
    setInputText(cleanedInput);
    if (!cleanedInput) return;
    
    // --- COST LOGIC ---
    // Cost depends on intensity level
    let messageCost = 1;
    if (intensity === 'high') messageCost = 5;
    if (intensity === 'extreme') messageCost = 10;

    let isPaidAction = false;
    let requestId: string | undefined;

    if (!user.isPremium) {
        // Only consume daily messages if intensity is NORMAL
        if (intensity === 'normal' && user.dailyMessagesLeft > 0) {
            // Free message, managed by onConsumeDailyMessage
            if (!onConsumeDailyMessage()) return;
        } else {
            // Intensity is HIGH/EXTREME OR daily limit reached -> consume credits
            // Use new API if available, fallback to legacy
            if (consumeCreditsApi) {
                // Estimate tokens (rough approximation: 1 token ≈ 4 chars)
                const estimatedInputTokens = Math.ceil(cleanedInput.length / 4);
                const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 1.5); // Estimate 1.5x output
                
                const consumeResult = await consumeCreditsApi({
                    estimated_input_tokens: estimatedInputTokens,
                    estimated_output_tokens: estimatedOutputTokens,
                    intensity,
                    service_type: 'chat',
                });
                
                if (!consumeResult.success) {
                    // API already showed paywall, just return
                    return;
                }
                requestId = consumeResult.requestId;
                isPaidAction = true;
            } else {
                // Fallback to legacy local consumption
                if (!onConsumeCredit(messageCost)) return;
                isPaidAction = true;
            }
        }
    }
    // ------------------
    
    const messageId = Date.now().toString();
    await initAudio();

    const newMessage: Message = { id: Date.now().toString(), role: 'user', text: cleanedInput, timestamp: Date.now() };
    
    // Feature 2: Update interaction count
    const newInteractionCount = interactionCount + 1;
    setInteractionCount(newInteractionCount);
    
    const updatedSession = { 
      ...session, 
      messages: [...session.messages, newMessage], 
      lastUpdated: Date.now(), 
      voiceStyle, 
      intensity, 
      speechSpeed, 
      speechPitch,
      interactionCount: newInteractionCount,
      relationshipPhase
    };

    setSession(updatedSession);
    onSaveSession(updatedSession);
    setInputText('');
    setQuickReplies([]);
    
    // Feature 3: Show typing indicator with emotional state
    setTypingIndicatorState('typing_fast');
    setShowTypingIndicator(true);
    setIsTyping(true);

    const requestedSpeakerId = nextSpeakerId;
    setNextSpeakerId(null);

    try {
      const response = await geminiService.sendRoleplayMessage(
        newMessage.text, 
        activeCharacters, 
        updatedSession, 
        user, 
        intensity, 
        voiceStyle, 
        undefined, 
        session.messagesSinceLastImage, 
        requestedSpeakerId || undefined, 
        language,
        isPaidAction,
        speechSpeed,
        speechPitch,
        // Streaming callback - show text as it arrives
        (partialText) => { setStreamingText(partialText); },
        // Async image callback
        (imageUrl) => {
          setSession(prev => {
            const msgs = [...prev.messages];
            const lastModel = [...msgs].reverse().find(m => m.role === 'model');
            if (lastModel) lastModel.imageUrl = imageUrl;
            const updated = { ...prev, messages: msgs, messagesSinceLastImage: 0 };
            onSaveSession(updated);
            return updated;
          });
        }
      );

      setStreamingText('');

      // --- CREDIT ADJUSTMENT ---
      // Adjust credits based on actual token usage if we used the new API
      if (requestId && adjustCreditsApi) {
        const actualInputTokens = response.usage?.promptTokens || Math.ceil(cleanedInput.length / 4);
        const actualOutputTokens = response.usage?.completionTokens || Math.ceil(response.text.length / 4);
        
        // Fire and forget - don't block the UI
        adjustCreditsApi({
          request_id: requestId,
          actual_input_tokens: actualInputTokens,
          actual_output_tokens: actualOutputTokens,
          message_id: messageId,
          intensity,
        }).catch(err => console.error('Credit adjustment failed:', err));
      }
      // ------------------------

      // MEMORY & AFFECTION UPDATE LOGICA
      const currentMemories = session.memories || [];
      const newResponseMemories = response.new_memories || [];
      // Voeg alleen unieke, nieuwe herinneringen toe
      const updatedMemories = Array.from(new Set([...currentMemories, ...newResponseMemories]));

      const currentAffection = session.affection || 0;
      const affectionDelta = response.affection_change || 0;
      const newAffection = Math.min(100, Math.max(0, currentAffection + affectionDelta));

      const newMood = response.moodDetected || session.currentMood;

        const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response.text, timestamp: Date.now(), imageUrl: response.imageUrl, characterId: response.characterId };
        // Haptic feedback on message received (mobile)
        if (navigator.vibrate) navigator.vibrate(50);
        let newXp = (session.experience || 0) + (response.xpGained || 10);
      let newLevel = session.level;
      if (newXp >= newLevel * XP_PER_LEVEL) { newLevel++; newXp = newXp - (newLevel - 1) * XP_PER_LEVEL; }

      const finalSession: ChatSession = {
        ...updatedSession, 
        messages: [...updatedSession.messages, modelMessage], 
        arousal: Math.min(100, (session.arousal || 0) + (response.arousal || 5)), 
        affection: newAffection,
        experience: newXp, 
        level: newLevel, 
        messagesSinceLastImage: modelMessage.imageUrl ? 0 : (session.messagesSinceLastImage || 0) + 1, 
        intensity: intensity,
        voiceStyle: voiceStyle,
        speechSpeed: speechSpeed,
        speechPitch: speechPitch,
        memories: updatedMemories,
        currentMood: newMood
      };

      if (affectionDelta > 4 && onShowToast) {
         const speaker = activeCharacters.find(c => c.id === response.characterId) || primaryCharacter;
         onShowToast("Affectie Gestegen", `${speaker.name} voelt zich meer verbonden met je!`, "💖", speaker.id);
      }

        setSession(finalSession);
          onSaveSession(finalSession);
          setQuickReplies(response.suggestions || []);
          if (!isMuted) playSpeech(modelMessage.text, modelMessage.characterId);
          // Track affection in persistent relationship (fire-and-forget)
          if (user.id) {
            recordChatInteraction(user.id, primaryCharacter.id, Math.max(0, affectionDelta)).catch(() => {});
          }
      } catch (error) { console.error(error); } finally { setIsTyping(false); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!onConsumeCredit(2)) return; // Image upload cost logic preserved
    
    initAudio();
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const mimeType = file.type;
      const newMessage: Message = { id: Date.now().toString(), role: 'user', text: "...", timestamp: Date.now(), imageUrl: base64String };
      const updatedSession = { ...session, messages: [...session.messages, newMessage], lastUpdated: Date.now(), voiceStyle, intensity, speechSpeed, speechPitch };
      setSession(updatedSession);
      onSaveSession(updatedSession);
      setIsTyping(true);
      setNextSpeakerId(null);
       try {
        // Image message always considered "Paid" interaction contextually because user paid 2 credits to upload
        const response = await geminiService.sendRoleplayMessage(
            newMessage.text, 
            activeCharacters, 
            updatedSession, 
            user, 
            intensity, 
            voiceStyle, 
            { data: base64String.split(',')[1], mimeType }, 
            session.messagesSinceLastImage, 
            undefined, 
            language,
            true,
            speechSpeed,
            speechPitch
        );
        
        // Consistent Memory & Affection Logic
        const currentMemories = session.memories || [];
        const newResponseMemories = response.new_memories || [];
        const updatedMemories = Array.from(new Set([...currentMemories, ...newResponseMemories]));

        const currentAffection = session.affection || 0;
        const affectionDelta = response.affection_change || 0;
        const newAffection = Math.min(100, Math.max(0, currentAffection + affectionDelta));

        const newMood = response.moodDetected || session.currentMood;

        const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response.text, timestamp: Date.now(), imageUrl: response.imageUrl, characterId: response.characterId };
        const finalSession: ChatSession = { 
            ...updatedSession, 
            messages: [...updatedSession.messages, modelMessage], 
            arousal: Math.min(100, (session.arousal || 0) + (response.arousal || 15)), 
            affection: newAffection,
            messagesSinceLastImage: modelMessage.imageUrl ? 0 : (session.messagesSinceLastImage || 0) + 1,
            memories: updatedMemories,
            currentMood: newMood,
            intensity: intensity,
            voiceStyle: voiceStyle,
            speechSpeed: speechSpeed,
            speechPitch: speechPitch
        };
        
        setSession(finalSession);
        onSaveSession(finalSession);
        if (!isMuted) playSpeech(modelMessage.text, modelMessage.characterId);
       } catch (e) { console.error(e); } finally { setIsTyping(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSendGift = (gift: any) => {
      if (!onConsumeCredit(gift.cost)) return;
      initAudio();
      const newMessage: Message = { id: Date.now().toString(), role: 'user', text: `*Geeft ${gift.name}* ${gift.icon}`, timestamp: Date.now(), isGift: true };
      const updatedSession = { ...session, messages: [...session.messages, newMessage], affection: (session.affection || 0) + gift.affectionBoost, voiceStyle, intensity, speechSpeed, speechPitch };
      setSession(updatedSession);
      onSaveSession(updatedSession);
      setShowGifts(false);
      setIsTyping(true);
      setNextSpeakerId(null);
      // Gift message also implies premium context
      geminiService.sendRoleplayMessage(`[ACTION: User gave gift: ${gift.name}]`, activeCharacters, updatedSession, user, intensity, voiceStyle, undefined, 0, undefined, language, true, speechSpeed, speechPitch).then(response => {
          const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response.text, timestamp: Date.now(), characterId: response.characterId };
          const finalSession = { 
              ...updatedSession, 
              messages: [...updatedSession.messages, modelMessage], 
              arousal: Math.min(100, (session.arousal || 0) + 5), 
              affection: (updatedSession.affection || 0) + (response.affection_change || 0), // Add dynamic affection on top of gift boost
              voiceStyle, 
              intensity,
              speechSpeed,
              speechPitch 
          };
          setSession(finalSession);
          onSaveSession(finalSession);
          setIsTyping(false);
          if(!isMuted) playSpeech(modelMessage.text, modelMessage.characterId);
      });
  };

  const rollDice = () => {
      if (!onConsumeCredit(1)) return;
      const action = diceActions[Math.floor(Math.random() * diceActions.length)];
      setDiceResult(action);
      setInputText(prev => (prev ? prev + " " + action : action));
      setTimeout(() => setDiceResult(null), 4000);
  };

  return (
      <div className="flex flex-col h-full bg-black relative">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {backgroundMedia.type === 'video' ? (
              <video src={backgroundMedia.src} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-100" />
            ) : (
              <img src={backgroundMedia.src} alt="" className="w-full h-full object-cover opacity-60" />
            )}
            <div className="absolute inset-0 bg-black/10" />
        </div>

      <div className="relative z-10 p-4 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between safe-pt">
          <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                  {activeCharacters.map((char, index) => (
                      <button key={char.id} className={`relative z-0 transition-transform active:scale-95 ${nextSpeakerId === char.id ? 'z-20 scale-110' : ''}`} style={{ zIndex: nextSpeakerId === char.id ? 20 : 10 - index }} onClick={() => isGroupChat && setNextSpeakerId(char.id === nextSpeakerId ? null : char.id)}>
                          <img src={char.avatar} className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${nextSpeakerId === char.id ? 'border-gold-500 shadow-[0_0_15px_rgba(255,215,0,0.6)]' : 'border-gold-500/50'}`} />
                          {nextSpeakerId === char.id && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center border border-black shadow-lg"><Icons.MessageSquare size={8} className="text-black" /></div>}
                      </button>
                  ))}
              </div>
              <div>
                  <h3 className="text-white font-headline font-bold text-sm leading-none flex items-center gap-2 drop-shadow-md">
                      {isGroupChat ? `${activeCharacters.length} Partners` : primaryCharacter.name}
                      {isSpeaking && <span className="text-[9px] text-gold-500 font-black animate-pulse uppercase">Spreekt...</span>}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                       <div className="h-1 w-16 bg-black/50 rounded-full overflow-hidden"><div className="h-full bg-pink-500" style={{ width: `${session.arousal || 0}%` }} /></div>
                       <span className="text-[9px] text-pink-400 font-bold uppercase drop-shadow-md">{t.lust}</span>
                       {session.currentMood && <span className="text-lg animate-in zoom-in" title={`Mood: ${session.currentMood}`}>{getMoodIcon(session.currentMood)}</span>}
                       {/* Credit Balance Indicator */}
                       {!user.isPremium && user.credits !== undefined && (
                         <span 
                           className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                             user.credits < 10 ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 
                             user.credits < 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 
                             'bg-green-500/20 text-green-400 border border-green-500/50'
                           }`}
                           title={`Credits: ${user.credits}`}
                         >
                           {user.credits < 10 && '🚨 '}{user.credits} credits
                         </span>
                       )}
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={() => {
                const charName = isGroupChat ? activeCharacters.map(c => c.name).join(', ') : primaryCharacter.name;
                const lines = session.messages.map(msg => {
                  const name = msg.role === 'user' ? 'Jij' : charName;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                  return `[${time}] ${name}: ${msg.text}`;
                });
                const text = `Chat met ${charName}\n${'='.repeat(40)}\n\n${lines.join('\n\n')}`;
                navigator.clipboard.writeText(text).then(() => {
                  onShowToast?.('Gekopieerd!', 'Chat is gekopieerd naar klembord', '📋');
                }).catch(() => {});
              }} className="p-2 text-gold-500 bg-black/30 rounded-full hover:bg-black/50 transition-colors border border-transparent" title="Kopieer chat">
                <Icons.Copy size={18} />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className={`p-2 rounded-full border transition-all ${isMuted ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-gold-500/20 text-gold-500 bg-black/30'}`}>{isMuted ? <Icons.VolumeX size={18} /> : <Icons.Volume2 size={18} />}</button>
              <button onClick={() => setShowDice(!showDice)} className="p-2 text-gold-500 bg-black/30 rounded-full hover:bg-black/50 transition-colors border border-transparent"><Icons.Dices size={20} /></button>
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-zinc-300 hover:text-white transition-colors"><Icons.Settings size={20} /></button>
          </div>
      </div>

      {/* Feature 1: Memory Indicator */}
      {showMemoryIndicator && userCharacterMemory && (
        <div className="absolute top-16 left-4 right-16 z-40 animate-in fade-in slide-in-from-top-5">
          <MemoryIndicator 
            memory={userCharacterMemory} 
            onClose={() => setShowMemoryIndicator(false)}
          />
        </div>
      )}

      {showSettings && (
          <>
              {/* Backdrop - tap to close (mobile only) */}
              <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowSettings(false)} />
              <div className="fixed inset-x-0 bottom-0 z-50 md:absolute md:inset-auto md:top-16 md:right-4 md:w-96 bg-[#0b0b0c] border border-white/10 md:rounded-2xl rounded-t-3xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-5 md:slide-in-from-top-5 max-h-[80dvh] overflow-y-auto no-scrollbar">
                  {/* Drag indicator (mobile only) */}
                  <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-3 md:hidden" />
              <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <h3 className="text-gold-500 font-headline font-bold uppercase tracking-widest text-sm">
                      Chat Instellingen
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors"><Icons.X size={16}/></button>
              </div>

              {/* Feature 2: Relationship Phase Display */}
              <div className="mb-6">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-2">
                    Relatie Fase
                  </label>
                  <div className="bg-zinc-900/50 p-4 rounded-xl border border-gold-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gold-500 font-bold text-sm capitalize">
                        {relationshipPhase === 'meeting' && 'Ontmoeting 💫'}
                        {relationshipPhase === 'acquaintance' && 'Kennismaking 🤝'}
                        {relationshipPhase === 'flirt' && 'Flirt 💕'}
                        {relationshipPhase === 'intimate' && 'Intiem 🔥'}
                        {relationshipPhase === 'deep_trust' && 'Diep Vertrouwen 💝'}
                      </span>
                      <span className="text-zinc-500 text-xs">{interactionCount} berichten</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-gold-500 to-pink-500 transition-all duration-500" 
                        style={{ width: `${Math.min(100, (interactionCount % 50) * 2)}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {50 - (interactionCount % 50)} berichten tot volgende fase
                    </p>
                  </div>
              </div>

              {/* EMOTIONELE TOON */}
              <div className="mb-6">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-2">{t.settings.tone}</label>
                  <div className="grid grid-cols-2 gap-2">
                      {voiceStyles.slice(0, 6).map(s => (
                          <button
                              key={s.id}
                              onClick={() => updateSettings({ voiceStyle: s.id })}
                              className={`p-3 rounded-lg border text-xs font-bold transition-all ${voiceStyle === s.id ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                          >
                              {s.label}
                          </button>
                      ))}
                  </div>
              </div>

              {/* STEM MODIFICATIE */}
              <div className="mb-6">
                  <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-2">{t.settings.voice_mod}</label>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-wider">
                          <span>{t.settings.speed}</span>
                          <span className="text-gold-500">{speechSpeed.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2.0" 
                        step="0.1" 
                        value={speechSpeed} 
                        onChange={(e) => updateSettings({ speechSpeed: parseFloat(e.target.value) })} 
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-gold-500 mb-6" 
                      />

                      <div className="flex justify-between text-[10px] text-zinc-400 mb-2 font-bold uppercase tracking-wider">
                          <span>{t.settings.pitch}</span>
                          <span className="text-gold-500">{speechPitch > 0 ? '+' : ''}{speechPitch}</span>
                      </div>
                      <input 
                        type="range" 
                        min="-10" 
                        max="10" 
                        step="1" 
                        value={speechPitch} 
                        onChange={(e) => updateSettings({ speechPitch: parseInt(e.target.value) })} 
                        className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-gold-500" 
                      />
                      <div className="flex justify-between text-[8px] text-zinc-600 mt-2 font-bold uppercase">
                          <span>{t.settings.deep}</span>
                          <span>{t.settings.high}</span>
                      </div>
                  </div>
              </div>

              {/* INTENSITEIT */}
              <div>
                   <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider block mb-2">{t.settings.intensity}</label>
                   <div className="flex gap-2">
                      {(['normal', 'high', 'extreme'] as IntensityLevel[]).map(l => {
                          const isRed = l === 'high' || l === 'extreme';
                          const isActive = intensity === l;
                          
                          let activeClass = '';
                          if (isActive) {
                             activeClass = isRed 
                                ? 'border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]' 
                                : 'border-gold-500 bg-gold-500/10 text-gold-500 shadow-[0_0_15px_rgba(255,215,0,0.4)]';
                          } else {
                             activeClass = 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800';
                          }

                          return (
                              <button
                                  key={l}
                                  onClick={() => updateSettings({ intensity: l })}
                                  className={`flex-1 p-3 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${activeClass}`}
                              >
                                  {tIntensity[l]}
                              </button>
                          );
                      })}
                   </div>
              </div>
          </div>
          </>
      )}

      {diceResult && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
              <div className="bg-gold-500 text-black px-6 py-3 rounded-full font-black text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(255,215,0,0.6)] animate-in zoom-in duration-300">🎲 {diceResult}</div>
          </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar relative z-10">
          {session.messages.map((msg) => {
              const speaker = msg.role === 'model' && msg.characterId ? activeCharacters.find(c => c.id === msg.characterId) || primaryCharacter : primaryCharacter;
              return (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    {msg.role === 'model' && isGroupChat && <div className="mr-2 self-end mb-1"><img src={speaker.avatar} className="w-8 h-8 rounded-full object-cover border border-white/20" title={speaker.name} /></div>}
                    <div className={`relative max-w-[80%] md:max-w-[60%] ${msg.role === 'user' ? 'bg-gold-500/10 border border-gold-500/20 rounded-2xl rounded-tr-sm' : 'bg-zinc-950/70 border border-white/5 rounded-2xl rounded-tl-sm'} p-3 md:p-4 backdrop-blur-md group shadow-xl`}>
                        {msg.role === 'model' && isGroupChat && <div className="text-[10px] font-black text-gold-500/70 mb-1 uppercase tracking-widest">{speaker.name}</div>}
                        {msg.role === 'model' && <button onClick={() => playSpeech(msg.text, msg.characterId)} className="absolute -right-10 top-2 p-2 text-zinc-500 hover:text-gold-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"><Icons.Volume2 size={16} /></button>}
                        {msg.imageUrl && (
                          <div className="mb-3 rounded-xl overflow-hidden border border-white/10 relative group/img">
                            <img src={msg.imageUrl} className="w-full h-auto object-cover max-h-80 cursor-pointer transition-transform hover:scale-[1.02]" alt="" onClick={() => window.open(msg.imageUrl, '_blank')} />
                            {msg.role === 'model' && (
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                <span className="bg-black/60 text-gold-500 text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur-sm border border-gold-500/20">AI Generated</span>
                              </div>
                            )}
                          </div>
                        )}
                        {msg.isGift && <div className="text-center mb-2"><div className="inline-block bg-gold-500/20 text-gold-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-gold-500/30">{t.gift_sent}</div></div>}
                        <p className="text-sm md:text-base leading-relaxed text-zinc-100 whitespace-pre-wrap font-body">{msg.text}</p>
                        <span className="text-[9px] text-zinc-500 mt-1 block text-right opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
              );
          })}
        {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              {isGroupChat && (
                <div className="mr-2 self-end mb-1">
                  <img src={(nextSpeakerId ? activeCharacters.find(c => c.id === nextSpeakerId) : primaryCharacter)?.avatar || primaryCharacter.avatar} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                </div>
              )}
              <div className="bg-zinc-950/70 border border-white/5 rounded-2xl rounded-tl-sm p-3 px-5 backdrop-blur-md shadow-xl max-w-[80%] md:max-w-[60%]">
                {streamingText ? (
                  <>
                    {isGroupChat && <div className="text-[10px] font-black text-gold-500/70 mb-1 uppercase tracking-widest">{(nextSpeakerId ? activeCharacters.find(c => c.id === nextSpeakerId)?.name : primaryCharacter.name) || primaryCharacter.name}</div>}
                    <p className="text-sm md:text-base leading-relaxed text-zinc-100 whitespace-pre-wrap font-body">{streamingText}<span className="inline-block w-1.5 h-4 bg-gold-500/60 ml-0.5 animate-pulse" /></p>
                  </>
                ) : (
                  <>
                    {/* Feature 3: Enhanced Typing Indicator */}
                    <TypingIndicator 
                      state={typingIndicatorState} 
                      characterName={!isGroupChat ? primaryCharacter.name : undefined}
                    />
                  </>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {showGifts && (
          <div className="bg-zinc-900 border-t border-white/10 p-4 animate-in slide-in-from-bottom-10 z-20">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                  {gifts.map(gift => (
                      <button key={gift.id} onClick={() => handleSendGift(gift)} className="flex-shrink-0 w-24 bg-black border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 hover:border-gold-500 hover:bg-white/5 transition-all">
                          <span className="text-2xl">{gift.icon}</span><span className="text-[10px] font-bold text-white">{gift.name}</span><span className="text-[9px] text-gold-500">{gift.cost} CR</span>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {showDice && <div className="absolute bottom-20 left-4 z-30 bg-black/90 border border-gold-500/20 rounded-xl p-3 backdrop-blur-md animate-in zoom-in-95 origin-bottom-left shadow-xl"><button onClick={rollDice} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold-500 hover:text-white transition-colors"><Icons.Dices size={16} /><span>{t.dice}</span></button></div>}

      {showScenarios && (
        <div className="bg-black/60 border-t border-white/10 px-3 py-2 z-20 animate-in slide-in-from-bottom-5 backdrop-blur-md">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {chatScenarios.map((s: any, i: number) => (
              <button
                key={i}
                onClick={() => { setInputText(s.prompt); setShowScenarios(false); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-zinc-900/80 text-xs font-bold text-zinc-300 hover:border-gold-500 hover:text-gold-500 hover:bg-gold-500/5 transition-all active:scale-95"
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

        <div className="p-3 md:p-4 bg-black/40 border-t border-white/5 relative z-20 safe-pb backdrop-blur-md">
            {nextSpeakerId && isGroupChat && <div className="absolute -top-10 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-2 fade-in"><div className="bg-gold-500 text-black px-4 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center gap-2"><Icons.MessageSquare size={12} /><span>Volgende: {activeCharacters.find(c => c.id === nextSpeakerId)?.name}</span><button onClick={() => setNextSpeakerId(null)} className="ml-2 hover:text-white"><Icons.X size={12} /></button></div></div>}
            {quickReplies.length > 0 && !isTyping && (
              <div className="max-w-4xl mx-auto flex gap-2 mb-2 overflow-x-auto no-scrollbar pb-1">
                {quickReplies.map((reply, i) => (
                  <button key={i} onClick={() => { setInputText(reply); setQuickReplies([]); }} className="flex-shrink-0 px-4 py-2 bg-zinc-900/80 border border-gold-500/30 text-gold-200 text-xs rounded-full hover:border-gold-500 hover:bg-gold-500/10 transition-all active:scale-95 whitespace-nowrap">
                    {reply}
                  </button>
                ))}
              </div>
            )}
          {/* Credit Cost Warning */}
          {!user.isPremium && user.credits !== undefined && (
            <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between text-xs">
              <span className={`font-medium ${
                intensity === 'normal' ? 'text-green-400' : 
                intensity === 'high' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                💰 Cost: {intensity === 'normal' ? (user.dailyMessagesLeft > 0 ? 'FREE' : '1 credit') : intensity === 'high' ? '5 credits' : '10 credits'}
              </span>
              {user.credits < 10 && user.dailyMessagesLeft === 0 && intensity === 'normal' && (
                <span className="text-red-400 animate-pulse">🚨 Low balance - Top up now!</span>
              )}
            </div>
          )}

          <div className="max-w-4xl mx-auto flex items-end gap-2">
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white hover:border-gold-500 transition-all active:scale-95"><Icons.Image size={20} /></button>
              <button onClick={() => setShowGifts(!showGifts)} className={`p-3 rounded-full bg-zinc-900/80 border transition-all active:scale-95 ${showGifts ? 'border-gold-500 text-gold-500' : 'border-white/10 text-zinc-400 hover:text-white'}`}><Icons.Sparkles size={20} /></button>
              <button onClick={() => setShowScenarios(!showScenarios)} className={`p-3 rounded-full bg-zinc-900/80 border transition-all active:scale-95 ${showScenarios ? 'border-gold-500 text-gold-500' : 'border-white/10 text-zinc-400 hover:text-white'}`}><Icons.MapPin size={20} /></button>
              <button onClick={toggleListening} className={`p-3 rounded-full bg-zinc-900/80 border transition-all active:scale-95 ${isListening ? 'border-red-500 text-red-500 animate-pulse' : 'border-white/10 text-zinc-400 hover:text-white'}`}>{isListening ? <Icons.MicOff size={20} /> : <Icons.Mic size={20} />}</button>
              <div className="flex-1 bg-zinc-900/80 border border-white/10 rounded-[1.5rem] flex items-center px-4 py-1.5 focus-within:border-gold-500/50 transition-colors">
                  <textarea value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder={isListening ? t.listening : t.type_message} className="w-full bg-transparent border-none text-white text-sm max-h-24 py-2 resize-none focus:ring-0 placeholder-zinc-500 no-scrollbar leading-relaxed" rows={1} style={{minHeight: '44px'}} />
              </div>
              <button onClick={handleSendMessage} disabled={!inputText.trim()} className="p-3 rounded-full bg-gold-500 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all shadow-lg active:scale-90"><Icons.Send size={20} fill="currentColor" className="ml-0.5" /></button>
          </div>
      </div>
    </div>
  );
};

export default ChatInterface;
