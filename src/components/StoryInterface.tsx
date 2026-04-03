
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { StoryConfig, StoryTurn, UserProfile, Language, Character, SavedStory, IntensityLevel, VoiceStyle } from '../types';
import { getLocations, getSoloToys, getKinks, getStoryScenarios, DEFAULT_VIDEO, getTexts, VOICE_STYLES, getStoryKeywords } from '../constants';
import { geminiService } from '../services/geminiService';
import Icons from './Icon';

interface StoryInterfaceProps {
  language?: Language;
  user?: UserProfile;
  onOpenPaywall?: () => void;
  initialStory?: SavedStory;
  onSaveStory?: (story: SavedStory) => void;
  characters?: Character[];
  onCreateNew?: () => void;
  onConsumeCredit?: (amount: number) => boolean; // Added onConsumeCredit
}

// --- AUDIO ENGINE CLASS (Deepgram TTS) ---
class StoryNarrator {
    private stopRequested = false;
    private isPlaying = false;
    private chunks: string[] = [];
    private currentIndex = 0;
    private characterName: string = 'default';

    // Callbacks
    public onLoadingProgress: (percentage: number, estimatedSecondsLeft: number) => void = () => {};
    public onPlaybackProgress: (percentage: number) => void = () => {};
    public onComplete: () => void = () => {};

    constructor() {}

    public stop() {
        this.stopRequested = true;
        this.isPlaying = false;
        this.chunks = [];
        this.currentIndex = 0;
        import('../services/deepgramTTS').then(({ stopSpeaking }) => stopSpeaking());
    }

    public voiceStyle: VoiceStyle = 'seductive';

    public async loadFullStory(text: string, _voice: string, style: VoiceStyle, characterName?: string) {
        this.stop();
        this.stopRequested = false;
        this.voiceStyle = style;
        this.characterName = characterName || 'default';

        // Split tekst in zinnen
        const regex = /[^.!?]+[.!?]+["']?|[^.!?]+$/g;
        const rawChunks = text.match(regex) || [text];
        this.chunks = rawChunks.map(c => c.trim()).filter(c => c.length > 0);

        this.onLoadingProgress(100, 0);

        if (!this.stopRequested && this.chunks.length > 0) {
            this.isPlaying = true;
            this.currentIndex = 0;
            this.playNextChunk();
        } else {
            this.onComplete();
        }
    }

    private async playNextChunk() {
        if (this.stopRequested || this.currentIndex >= this.chunks.length) {
            this.isPlaying = false;
            this.onComplete();
            return;
        }

        const percentage = (this.currentIndex / this.chunks.length) * 100;
        this.onPlaybackProgress(percentage);

        try {
            const { speakWithDeepgram } = await import('../services/deepgramTTS');
            await speakWithDeepgram(this.chunks[this.currentIndex], this.characterName);
            if (this.stopRequested) return;
            this.currentIndex++;
            this.playNextChunk();
        } catch {
            if (this.stopRequested) return;
            this.currentIndex++;
            this.playNextChunk();
        }
    }
}

const StoryInterface: React.FC<StoryInterfaceProps> = ({ language = 'nl', user, initialStory, onSaveStory, characters = [], onCreateNew, onConsumeCredit }) => {
  const activeLocations = getLocations(language as Language);
  const soloToys = getSoloToys(language as Language);
  const activeScenarios = getStoryScenarios(language as Language);
  const activeKinks = getKinks(language as Language);
  const activeKeywords = getStoryKeywords(language as string);
  const texts = getTexts(language as string);
  const t = texts.story;
  const tIntensity = texts.intensity;
  
  const [mode, setMode] = useState<'setup' | 'play'>('setup');
  const [setupStep, setSetupStep] = useState<'scenario' | 'details' | 'kinks'>('scenario');
  const [isSaved, setIsSaved] = useState(false);
  
  const [config, setConfig] = useState<StoryConfig>({ 
      characters: [], toys: [], keywords: [], customKeywords: '', location: '', extremeness: 3, length: 3, category: activeScenarios[0].title, prompt: '', voiceStyle: 'seductive', intensity: 'high' 
  });
  
  const [turns, setTurns] = useState<StoryTurn[]>([]);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSoloMode, setIsSoloMode] = useState(true);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  
  // Audio State
  const [playback, setPlayback] = useState<{ 
      idx: number | null; 
      isPlaying: boolean; 
      isLoading: boolean; 
      progress: number;
      timeLeft: number; // New: Estimated time left for loading
  }>({ 
      idx: null, isPlaying: false, isLoading: false, progress: 0, timeLeft: 0
  });

  const [openSettingsIdx, setOpenSettingsIdx] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const narratorRef = useRef<StoryNarrator | null>(null);

  useEffect(() => {
    narratorRef.current = new StoryNarrator();
    
    // Loading progress updates
    narratorRef.current.onLoadingProgress = (percentage, secondsLeft) => {
        setPlayback(prev => ({ ...prev, isLoading: percentage < 100, progress: percentage, timeLeft: secondsLeft }));
    };

    // Playback progress updates
    narratorRef.current.onPlaybackProgress = (percentage) => {
        setPlayback(prev => ({ ...prev, isLoading: false, isPlaying: true, progress: percentage, timeLeft: 0 }));
    };

    narratorRef.current.onComplete = () => {
        setPlayback(prev => ({ ...prev, isPlaying: false, isLoading: false, progress: 100, timeLeft: 0 }));
        setTimeout(() => setPlayback(prev => ({ ...prev, idx: null, progress: 0 })), 1500);
    };

    return () => {
        narratorRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (initialStory && initialStory.turns?.length > 0) {
      setTurns(initialStory.turns); 
      setConfig(initialStory.config); 
      setStoryTitle(initialStory.title);
      setCurrentStoryId(initialStory.id);
      setMode('play');
    } else { 
      setMode('setup'); 
      setCurrentStoryId(null);
      setTurns([]);
      setStoryTitle('');
      setSetupStep('scenario');
    }
  }, [initialStory]);

  useEffect(() => {
    if (mode === 'setup' && !initialStory) {
        setConfig(prev => ({ ...prev, category: activeScenarios[0].title }));
    }
  }, [language]);

  const ambientVideo = useMemo(() => {
    let loc = activeLocations.find(l => l.name === config.location);
    if (loc?.image.endsWith('.mp4')) return loc.image;
    if (config.characters.length > 0) {
        const char = characters.find(c => c.id === config.characters[0]);
        if (char?.video) return char.video;
    }
    return DEFAULT_VIDEO;
  }, [config.location, activeLocations, config.characters, characters]);

  const togglePlayback = (index: number, text: string) => {
    if (!narratorRef.current) return;

    // Stop if currently interacting with this card
    if (playback.idx === index && (playback.isPlaying || playback.isLoading)) {
        narratorRef.current.stop();
        setPlayback(prev => ({ ...prev, isPlaying: false, isLoading: false, idx: null }));
        return;
    }

    // Start New
    setPlayback({ idx: index, isPlaying: false, isLoading: true, progress: 0, timeLeft: 10 }); // Start with initial guess
    
    const activeCharId = config.characters[0];
    const char = characters.find(c => c.id === activeCharId);
    const voice = char?.voice || 'Kore'; 
    const style = config.voiceStyle || 'seductive';

    narratorRef.current.loadFullStory(text, voice, style);
  };

  const handleStyleChange = (style: VoiceStyle) => {
    setConfig(prev => ({ ...prev, voiceStyle: style }));
    if (playback.isPlaying || playback.isLoading) {
        narratorRef.current?.stop();
        setPlayback(prev => ({ ...prev, isPlaying: false, isLoading: false, idx: null }));
    }
    setOpenSettingsIdx(null);
  };

  const performSave = useCallback((currentTurns: StoryTurn[], currentTitle: string, currentConfig: StoryConfig, explicitId?: string) => {
    if (!onSaveStory) return;
    const idToUse = explicitId || currentStoryId || `story_${Date.now()}`;
    if (!currentStoryId) setCurrentStoryId(idToUse);

    const storyToSave: SavedStory = {
        id: idToUse,
        title: currentTitle || config.category || 'Verhaal',
        turns: currentTurns,
        config: currentConfig,
        timestamp: Date.now()
    };
    onSaveStory(storyToSave);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }, [currentStoryId, config.category, onSaveStory]);

  const handleStartStory = async () => {
    // --- CREDIT CHECK ---
    const COST = 120;
    if (user && !user.isPremium && onConsumeCredit && !onConsumeCredit(COST)) {
        return; // Paywall triggers in App.tsx
    }
    // --------------------

    setMode('play'); 
    setIsGenerating(true);
    setStreamingText('');
    setGenerateError(null);
    const newStoryId = `story_${Date.now()}`;
    setCurrentStoryId(newStoryId);

    try {
        const finalLocation = config.location || activeLocations[0].name;
        const finalConfig = { ...config, location: finalLocation, characters: isSoloMode ? [] : config.characters };
        const turn = await geminiService.generateStoryTurn(finalConfig, [], undefined, language as Language, user?.isPremium, (partial: string) => setStreamingText(partial));
        setStreamingText('');
        if (turn?.text) {
            const newTurns = [turn];
            setTurns(newTurns);
            const newTitle = turn.title || config.category || 'Nieuw Verhaal';
            setStoryTitle(newTitle);
            performSave(newTurns, newTitle, finalConfig, newStoryId);
        } else {
            setMode('setup');
            setGenerateError('Verhaal genereren mislukt. Probeer opnieuw.');
        }
    } catch (e: any) {
        setStreamingText('');
        setMode('setup');
        setGenerateError(e?.message || 'Onbekende fout bij genereren verhaal');
        console.error('[StoryGenerate]', e);
    } finally { setIsGenerating(false); }
  };

  const handleNextTurn = async (choice: string) => {
    // --- CREDIT CHECK ---
    const COST = 120;
    if (user && !user.isPremium && onConsumeCredit && !onConsumeCredit(COST)) {
        return;
    }
    // --------------------

    setIsGenerating(true);
    setStreamingText('');
    setGenerateError(null);
    narratorRef.current?.stop();
    setPlayback(prev => ({ ...prev, isPlaying: false, isLoading: false, idx: null }));
    
    try {
        const finalLocation = config.location || activeLocations[0].name;
        const finalConfig = { ...config, location: finalLocation, characters: isSoloMode ? [] : config.characters };
        const turn = await geminiService.generateStoryTurn(finalConfig, turns, choice, language as Language, user?.isPremium, (partial: string) => setStreamingText(partial));
        setStreamingText('');
        if (turn?.text) {
            const newTurns = [...turns, turn];
            setTurns(newTurns);
            performSave(newTurns, storyTitle, finalConfig);
            setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, 150);
        } else {
            setGenerateError('Verhaal genereren mislukt. Probeer opnieuw.');
        }
    } catch (e: any) {
        setStreamingText('');
        setGenerateError(e?.message || 'Fout bij genereren');
        console.error('[StoryNextTurn]', e);
    } finally { setIsGenerating(false); }
  };

  const handleRegenerate = async () => {
    if (turns.length === 0 || isGenerating) return;
    // No extra credit cost for regenerate (user already paid)
    
    setIsGenerating(true);
    setStreamingText('');
    setGenerateError(null);
    narratorRef.current?.stop();
    setPlayback(prev => ({ ...prev, isPlaying: false, isLoading: false, idx: null }));

    try {
      const finalLocation = config.location || activeLocations[0].name;
      const finalConfig = { ...config, location: finalLocation, characters: isSoloMode ? [] : config.characters };
      const previousTurns = turns.slice(0, -1);
      const lastChoice = turns.length > 1 ? 'Herschrijf dit anders, meer variatie en detail.' : 'Herschrijf dit opener anders, creatiever.';
      const turn = await geminiService.generateStoryTurn(finalConfig, previousTurns, lastChoice, language as Language, user?.isPremium, (partial: string) => setStreamingText(partial));
      setStreamingText('');
      if (turn?.text) {
        const newTurns = [...previousTurns, turn];
        setTurns(newTurns);
        performSave(newTurns, storyTitle, finalConfig);
      } else {
        setGenerateError('Herschrijven mislukt. Probeer opnieuw.');
      }
    } catch (e: any) {
      setStreamingText('');
      setGenerateError(e?.message || 'Fout bij regenereren');
      console.error('[StoryRegenerate]', e);
    } finally { setIsGenerating(false); }
  };

  // Export functions
  const handleExportPDF = () => {
    const content = turns.map((turn, idx) => `${idx === 0 && turn.title ? turn.title + '\n\n' : ''}${turn.text}`).join('\n\n---\n\n');
    const fullContent = `${turn.title || 'Story'}\n\n${content}\n\n---\nExported from XXX Tales`;
    
    // Create a simple print-friendly window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${turn.title || 'Story'} - XXX Tales</title>
            <style>
              body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; }
              h1 { color: #D4AF37; }
              .meta { color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${turn.title || 'Untitled Story'}</h1>
            ${turns.map((turn, idx) => `<p>${turn.text.replace(/\n/g, '<br>')}</p>`).join('<br>')}
            <div class="meta">Exported from XXX Tales on ${new Date().toLocaleString()}</div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
    setShowExportMenu(false);
  };

  const handleCopyText = async () => {
    const content = turns.map((turn, idx) => `${idx === 0 && turn.title ? turn.title + '\n\n' : ''}${turn.text}`).join('\n\n---\n\n');
    const fullContent = `${turn.title || 'Story'}\n\n${content}\n\n---\nExported from XXX Tales`;
    
    try {
      await navigator.clipboard.writeText(fullContent);
      alert(t.copied || 'Copied to clipboard!');
    } catch (e) {
      console.error('Copy failed:', e);
    }
    setShowExportMenu(false);
  };

  const handleBackToSetup = () => {
      narratorRef.current?.stop();
      if (onCreateNew) onCreateNew();
      else { setMode('setup'); setCurrentStoryId(null); setTurns([]); }
  };

  if (mode === 'setup') {
    return (
      <div className="flex-1 overflow-y-auto bg-black p-4 space-y-6 pb-32 no-scrollbar relative h-full safe-pt">
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"><video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-100" /><div className="absolute inset-0 bg-black/40" /></div>
        <div className="relative z-10 text-center pt-8">
            <h1 className="text-4xl font-headline font-black text-shine uppercase tracking-tighter">{t.title}</h1>
            <p className="text-gold-500 text-[11px] uppercase font-black tracking-widest mt-1">{t.subtitle}</p>
        </div>
        <div className="relative z-10 glass-premium rounded-[2.5rem] p-6 max-w-xl mx-auto border-gold-500/30 bg-black/80 backdrop-blur-3xl shadow-2xl">
            {setupStep === 'scenario' && (
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block text-center">{t.step1}</label>
                  <div className="grid grid-cols-1 gap-3">
                    {activeScenarios.map(s => (
                      <button key={s.id} onClick={() => { setConfig({...config, category: s.title}); setIsSoloMode(s.id === 'solo_voyage'); setSetupStep('details'); }} className={`w-full p-4 rounded-3xl border-2 transition-all flex items-center gap-4 ${config.category === s.title ? 'bg-gold-500/20 border-gold-500' : 'bg-black/40 border-white/5'}`}>
                        <span className="text-2xl">{s.icon}</span><div className="text-left"><h4 className="text-white font-bold text-sm">{s.title}</h4><p className="text-zinc-500 text-[10px] mt-1">{s.desc}</p></div>
                      </button>
                    ))}
                  </div>
                </div>
            )}
            {setupStep === 'details' && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4"><button onClick={() => setSetupStep('scenario')} className="text-gold-500 p-2 bg-white/5 rounded-full border border-gold-500/20"><Icons.ChevronLeft size={20}/></button><span className="text-white font-black text-xs uppercase tracking-widest">{config.category}</span></div>
                    
                    {/* Photo Upload Feature */}
                    <div className="space-y-4">
                      <label className="text-[11px] font-black text-pink-500 uppercase tracking-widest block">{t.photo_upload || 'Add Your Photo'}</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 px-4 py-3 bg-pink-500/20 border border-pink-500/30 rounded-xl cursor-pointer hover:bg-pink-500/30 transition-all">
                          <Icons.Image size={18} className="text-pink-400" />
                          <span className="text-xs font-bold text-pink-300">{t.upload || 'Upload Photo'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                setUploadedImage(ev.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }} />
                        </label>
                        {uploadedImage && (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-pink-500/50">
                            <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                            <button onClick={() => setUploadedImage(null)} className="absolute top-0 right-0 p-1 bg-red-500 rounded-bl-lg">
                              <Icons.X size={12} className="text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4"><label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{t.step2}</label>
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                          {activeLocations.map(loc => (
                              <button key={loc.id} onClick={() => setConfig({...config, location: loc.name})} className={`relative w-32 h-24 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${config.location === loc.name ? 'border-gold-500 scale-105' : 'border-white/10 opacity-60'}`}>
                                  {loc.image.endsWith('.mp4') ? <video src={loc.image} autoPlay loop muted playsInline className="w-full h-full object-cover" /> : <img src={loc.image} className="w-full h-full object-cover" />}
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-[10px] font-black text-white uppercase px-1 text-center">{loc.name}</div>
                              </button>
                          ))}
                      </div>
                    </div>
                    {!isSoloMode ? (
                        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">{characters.map(char => (
                                <button key={char.id} onClick={() => setConfig(prev => ({...prev, characters: prev.characters.includes(char.id) ? prev.characters.filter(id => id !== char.id) : [...prev.characters, char.id]}))} className={`relative w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 transition-all ${config.characters.includes(char.id) ? 'border-gold-500 scale-110 shadow-lg' : 'border-white/5 opacity-40'}`}>
                                    <img src={char.avatar} className="w-full h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/80 text-[8px] text-white text-center pb-1">{char.name}</div>
                                </button>
                            ))}
                        </div>
                    ) : ( <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl"><p className="text-center text-zinc-400 text-[10px] uppercase font-black tracking-widest">{t.solo_mode}</p></div> )}
                    <div className="space-y-4"><label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{t.step3}</label>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                            {soloToys.map(toy => (
                                <button key={toy.id} onClick={() => setConfig(prev => ({...prev, toys: prev.toys.includes(toy.id) ? prev.toys.filter(t => t !== toy.id) : [...prev.toys, toy.id]}))} className={`relative w-24 h-28 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${config.toys.includes(toy.id) ? 'border-gold-500 scale-105' : 'border-white/5 opacity-60'}`}>
                                    {(toy as any).image ? <img src={(toy as any).image} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-2xl">{toy.icon}</div>}
                                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1 text-[9px] text-white text-center">{toy.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setSetupStep('kinks')} className="w-full py-5 btn-premium rounded-2xl text-sm font-black uppercase tracking-widest">{t.next_step}</button>
                </div>
            )}
            {setupStep === 'kinks' && (
                <div className="space-y-8">
                    <div className="flex items-center gap-4"><button onClick={() => setSetupStep('details')} className="text-gold-500 p-2 bg-white/5 rounded-full border border-gold-500/20"><Icons.ChevronLeft size={20}/></button><span className="text-white font-black text-xs uppercase tracking-widest">{t.specific_wishes}</span></div>
                    
                    <div className="space-y-4"><label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{t.intensity_label}</label>
                        <div className="flex gap-3">
                            {(['normal', 'high', 'extreme'] as const).map(l => (
                                <button key={l} onClick={() => setConfig(prev => ({...prev, intensity: l}))} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${config.intensity === l ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-black/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/30'}`}>
                                    {tIntensity[l]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4"><label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{language === 'nl' ? 'LENGTE' : language === 'de' ? 'LÄNGE' : language === 'fr' ? 'LONGUEUR' : language === 'es' ? 'LONGITUD' : language === 'it' ? 'LUNGHEZZA' : 'LENGTH'}</label>
                        <div className="flex gap-3">
                            {[
                                { value: 1, label: language === 'nl' ? 'Kort' : language === 'de' ? 'Kurz' : language === 'fr' ? 'Court' : language === 'es' ? 'Corto' : language === 'it' ? 'Corto' : 'Short', sub: '500' },
                                { value: 2, label: language === 'nl' ? 'Normaal' : language === 'de' ? 'Normal' : language === 'fr' ? 'Normal' : language === 'es' ? 'Normal' : language === 'it' ? 'Normale' : 'Normal', sub: '1000' },
                                { value: 3, label: language === 'nl' ? 'Lang' : language === 'de' ? 'Lang' : language === 'fr' ? 'Long' : language === 'es' ? 'Largo' : language === 'it' ? 'Lungo' : 'Long', sub: '1500' },
                            ].map(opt => (
                                <button key={opt.value} onClick={() => setConfig(prev => ({...prev, length: opt.value}))} className={`flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${config.length === opt.value ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_15px_rgba(255,215,0,0.4)]' : 'bg-black/40 border-white/10 text-zinc-500 hover:text-white hover:border-white/30'}`}>
                                    <div>{opt.label}</div>
                                    <div className="text-[8px] mt-0.5 opacity-70">{opt.sub} {language === 'nl' ? 'woorden' : language === 'de' ? 'Wörter' : language === 'fr' ? 'mots' : language === 'es' ? 'palabras' : language === 'it' ? 'parole' : 'words'}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4"><label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{t.quick_pick}</label>
                        <div className="grid grid-cols-2 gap-3">{activeKeywords.map(k => (
                                <button key={k.id} onClick={() => setConfig(prev => ({...prev, keywords: prev.keywords.includes(k.label) ? prev.keywords.filter(kw => kw !== k.label) : [...prev.keywords, k.label]}))} className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${config.keywords.includes(k.label) ? 'bg-gold-500/20 border-gold-500' : 'bg-black/40 border-white/5'}`}>
                                    <span className="text-xl">{k.icon}</span><span className="text-white font-bold text-xs">{k.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4"><label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{t.specific_wishes}</label>
                        <div className="relative group"><Icons.Sparkles className="absolute left-4 top-4 text-gold-500/40" size={20} />
                            <textarea value={config.customKeywords || ''} onChange={(e) => setConfig({ ...config, customKeywords: e.target.value })} placeholder={t.placeholder} className="w-full bg-black/40 border border-gold-500/20 focus:border-gold-500 rounded-2xl p-4 pl-12 text-white text-sm outline-none transition-all placeholder-zinc-600 min-h-[100px] resize-none focus:bg-black/60 focus:shadow-[0_0_20px_rgba(255,215,0,0.1)]" />
                        </div>
                    </div>
                    {/* Updated button to show cost */}
                    <button onClick={handleStartStory} className="w-full py-5 btn-premium rounded-2xl text-sm font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,215,0,0.3)] flex flex-col items-center">
                        <span>{t.start_adventure}</span>
                        {!user?.isPremium && <span className="text-[9px] mt-1 opacity-80">(120 Credits)</span>}
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col flex h-full bg-black relative overflow-hidden">
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden"><video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-100" /><div className="absolute inset-0 bg-black/10" /></div>
        {/* ... (rest of the component remains similar, mostly logic) */}
        <div className="absolute top-0 left-0 right-0 p-4 z-[60] safe-pt">
            <div className="max-w-xl mx-auto flex items-center justify-between">
              <button onClick={handleBackToSetup} className="flex items-center gap-2 p-3 bg-black/60 backdrop-blur-xl rounded-full text-gold-500 border border-gold-500/30 shadow-xl active:scale-90"><Icons.ChevronLeft size={22} /><span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">{t.new}</span></button>
              <div className="flex items-center gap-3">
                <button onClick={handleRegenerate} disabled={isGenerating || turns.length === 0} className="flex items-center gap-2 px-4 py-3 rounded-full border bg-black/60 backdrop-blur-xl border-white/10 text-zinc-400 hover:text-gold-500 hover:border-gold-500/40 transition-all disabled:opacity-30 active:scale-90"><Icons.RefreshCw size={16} /><span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Rewrite</span></button>
                <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={turns.length === 0} className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all bg-black/60 backdrop-blur-xl border-gold-500/40 text-gold-500 hover:bg-gold-500 hover:text-black disabled:opacity-30`}><Icons.Download size={18} /><span className="text-[11px] font-black uppercase tracking-widest">Export</span></button>
                {showExportMenu && (
                  <div className="absolute top-full right-0 mt-3 w-48 bg-black/90 glass-premium border border-gold-500/30 rounded-2xl p-2 z-50 animate-in zoom-in-95 origin-top-right">
                    <button onClick={handleExportPDF} className="w-full text-left text-xs py-2 px-3 rounded-xl transition-all font-bold text-zinc-300 hover:bg-white/10 hover:text-white flex items-center gap-2"><Icons.FileText size={14} /> {t.export_pdf || 'Export PDF'}</button>
                    <button onClick={handleCopyText} className="w-full text-left text-xs py-2 px-3 rounded-xl transition-all font-bold text-zinc-300 hover:bg-white/10 hover:text-white flex items-center gap-2"><Icons.Copy size={14} /> {t.export_copy || 'Copy Text'}</button>
                  </div>
                )}
                <button onClick={() => performSave(turns, storyTitle, config)} className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all ${isSaved ? 'bg-green-600 border-green-600 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-black/60 backdrop-blur-xl border-gold-500/40 text-gold-500'}`}>{isSaved ? <Icons.Check size={18} /> : <Icons.Save size={18} />}<span className="text-[11px] font-black uppercase tracking-widest">{isSaved ? t.saved : t.save}</span></button>
              </div>
            </div>
        </div>
        <div className="flex-1 scroll-container px-6 pt-36 space-y-16 no-scrollbar relative z-10" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-16">
                {turns.map((turn, idx) => (
                    <div key={idx} className={`transition-all duration-1000 ${idx === turns.length - 1 ? 'opacity-100 scale-100' : 'opacity-60 scale-[0.98]'}`}>
                        <div className="bg-black/35 backdrop-blur-sm p-8 md:p-14 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-transparent opacity-30 pointer-events-none" />
                            
                            {/* Audio Controls */}
                            <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                                <div className="relative">
                                    <button 
                                        onClick={() => setOpenSettingsIdx(openSettingsIdx === idx ? null : idx)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${openSettingsIdx === idx ? 'bg-gold-500 text-black border-gold-500' : 'bg-black/40 text-zinc-400 border border-white/10 hover:text-white'}`}
                                    >
                                        <Icons.Settings size={18} />
                                    </button>
                                    
                                    {/* Style Selection Popover */}
                                    {openSettingsIdx === idx && (
                                        <div className="absolute top-full right-0 mt-3 w-40 bg-black/90 glass-premium border border-gold-500/30 rounded-2xl p-2 z-30 animate-in zoom-in-95 origin-top-right">
                                            <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                                                {VOICE_STYLES.map(style => (
                                                    <button 
                                                        key={style.id} 
                                                        onClick={() => handleStyleChange(style.id)}
                                                        className={`w-full text-left text-[10px] py-2 px-3 rounded-xl transition-all font-bold uppercase tracking-wider ${config.voiceStyle === style.id ? 'bg-gold-500 text-black' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        {style.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => togglePlayback(idx, turn.text)}
                                    className={`w-auto px-4 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 gap-2 ${playback.idx === idx && (playback.isPlaying || playback.isLoading) ? 'bg-gold-500 text-black shadow-[0_0_20px_rgba(255,215,0,0.4)]' : 'bg-black/40 text-gold-500 border border-gold-500/30 hover:bg-gold-500 hover:text-black'}`}
                                >
                                    {playback.idx === idx && playback.isLoading ? (
                                        <>
                                            <Icons.Loader2 size={18} className="animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{playback.timeLeft > 0 ? `±${playback.timeLeft}s` : '...'}</span>
                                        </>
                                    ) : playback.idx === idx && playback.isPlaying ? (
                                        <Icons.Pause size={20} fill="currentColor" />
                                    ) : (
                                        <Icons.Play size={20} fill="currentColor" className="ml-1" />
                                    )}
                                </button>
                            </div>

                            {idx === 0 && (turn.title || storyTitle) && <h2 className="text-3xl md:text-5xl font-headline font-black text-shine uppercase tracking-tighter mb-8 text-center drop-shadow-xl border-b border-gold-500/20 pb-6 pr-12">{turn.title || storyTitle}</h2>}
                            <p className="font-body text-[20px] md:text-3xl leading-[1.85] text-white font-medium whitespace-pre-wrap drop-shadow-[0_4px_12px_rgba(0,0,0,1)] text-left md:text-center selection:bg-gold-500 selection:text-black relative z-10">{turn.text}</p>
                            
                            {/* Progress Bar for Audio */}
                            {playback.idx === idx && (playback.isPlaying || playback.isLoading) && (
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                    <div 
                                        className={`h-full transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(255,215,0,0.8)] ${playback.isLoading ? 'bg-zinc-500 animate-pulse' : 'bg-gold-500'}`}
                                        style={{ width: `${playback.progress}%` }} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {isGenerating && (
                <div className="flex flex-col items-center justify-center p-12 space-y-6 animate-pulse">
                    <div className="flex gap-5">{[0, 1, 2].map(i => <div key={i} className="w-4 h-4 bg-gold-500 rounded-full shadow-[0_0_15px_gold]" style={{ animationDelay: `${i * 200}ms` }} />)}</div>
                    <span className="text-[12px] font-black text-gold-500 uppercase tracking-[0.5em] drop-shadow-lg">{t.generating}</span>
                </div>
            )}
            {generateError && (
                <div className="flex flex-col items-center justify-center p-6 m-4 border border-red-500/30 bg-red-500/10 rounded-xl">
                    <p className="text-red-400 text-sm mb-3">{generateError}</p>
                    <button onClick={() => setMode('setup')} className="px-6 py-2 bg-gold-500 text-black font-bold rounded-full text-sm">Opnieuw proberen</button>
                </div>
            )}
            {turns.length > 0 && turns[turns.length-1]?.text?.includes('...') && (
                <div className="flex flex-col items-center justify-center p-6 m-4 border border-red-500/30 bg-red-500/10 rounded-xl">
                    <p className="text-red-400 text-sm mb-3">Het verhaal is afgekort. Wil je verder?</p>
                    <button onClick={handleRegenerate} className="px-6 py-2 bg-gold-500 text-black font-bold rounded-full text-sm">Herschrijf verhaal</button>
                </div>
            )}
            <div className="h-[480px]" />
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-[55] pointer-events-none">
            <div className="h-80 bg-gradient-to-t from-black via-black/95 to-transparent w-full" />
            <div className="absolute bottom-0 inset-x-0 px-6 pb-safe-bottom pointer-events-auto">
                {!isGenerating && turns.length > 0 && (
                    <div className="max-w-xl mx-auto pb-10 space-y-5">
                        <div className="flex items-center justify-center gap-4 mb-2"><div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-500/30" /><p className="text-gold-500 text-[11px] font-black uppercase tracking-[0.6em] whitespace-nowrap drop-shadow-lg">{t.what_next}</p><div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-500/30" /></div>
                        <div className="flex flex-col gap-3 relative z-10">
                            {(() => {
                                const lastTurn = turns[turns.length-1];
                                const choices = lastTurn?.choices && lastTurn.choices.length > 0 
                                    ? lastTurn.choices 
                                    : ['Ga door met het verhaal', 'Neem even pauze', 'Probeer opnieuw'];
                                return choices.map((c, i) => (
                                    <button key={i} onClick={() => i === 2 && !lastTurn?.choices ? handleRegenerate() : handleNextTurn(c)} className="w-full py-4.5 px-6 rounded-[2.2rem] text-left text-[14px] md:text-[17px] font-bold shadow-2xl flex items-center gap-5 group active:scale-[0.96] border border-gold-500/40 bg-black/85 backdrop-blur-3xl transition-all hover:bg-gold-500 hover:text-black hover:border-white/20">
                                        <div className="w-10 h-10 rounded-full bg-gold-500 text-black flex items-center justify-center text-[14px] font-black shrink-0 group-hover:bg-black group-hover:text-gold-500 transition-colors shadow-lg">{i + 1}</div>
                                        <span className="leading-tight drop-shadow-sm flex-1">{c}</span>
                                        {!user?.isPremium && i !== 1 && <span className="text-[9px] text-zinc-500 font-bold ml-auto opacity-70 group-hover:text-black">(120 Cr)</span>}
                                    </button>
                                ));
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default StoryInterface;
