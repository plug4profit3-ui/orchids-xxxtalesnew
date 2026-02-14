import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { AppMode, ChatSession, SavedStory, UserProfile, ModelConfig, GeneratedImage, Character, Language } from './types';
import { DEFAULT_CONFIG, getCharacters } from './constants';
import { geminiService } from './services/geminiService';
import { setTTSLanguage } from './services/deepgramTTS';
import { supabase } from './services/supabase';
import * as db from './services/supabaseData';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CharacterSelector from './components/CharacterSelector';
import StoryInterface from './components/StoryInterface';
import LiveInterface from './components/LiveInterface';
import SoloCoachInterface from './components/SoloCoachInterface';
import ImagineInterface from './components/ImagineInterface';
import VideoFinder from './components/VideoFinder';
import CharacterCreator from './components/CharacterCreator';
import AudioStoriesInterface from './components/AudioStoriesInterface';
import LandingPage from './components/LandingPage';
import PaywallModal from './components/PaywallModal';
import DailyRewardModal from './components/DailyRewardModal';
import LegalModal from './components/LegalModal';
import InstallButton from './components/InstallButton';
import Icons from './components/Icon';
import { registerServiceWorker, requestNotificationPermission, scheduleReminderNotifications, scheduleCharacterNotification } from './services/notifications';

// --- LOCALSTORAGE HELPERS (only for non-user data) ---
const loadState = <T,>(key: string, fallback: T): T => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
};
const saveState = (key: string, value: any) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

const DEFAULT_USER: UserProfile = {
  id: '', name: '', email: '', picture: 'https://storage.googleapis.com/foto1982/logo.jpeg',
  isPremium: false, credits: 50, dailyMessagesLeft: 10, isAuthenticated: false, isVerified: false,
  streak: 0, lastLoginDate: undefined, customCharacters: []
};

const App = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<UserProfile>(() => loadState('user', DEFAULT_USER));
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAgeAccepted, setIsAgeAccepted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInitDone, setAuthInitDone] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- APP STATE ---
  const [mode, setMode] = useState<AppMode>(AppMode.GALLERY);
  const [config] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => loadState('language', 'nl'));

  // Sync TTS language when app language changes
  useEffect(() => { setTTSLanguage(language); }, [language]);

  // --- CHAT STATE ---
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  // --- STORY STATE ---
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [activeStory, setActiveStory] = useState<SavedStory | undefined>(undefined);

  // --- IMAGE STATE ---
  const [imaginePrompt, setImaginePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Debounce ref for saving
  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // --- LOAD USER DATA FROM SUPABASE ---
  useEffect(() => {
    if (!user.id || dataLoaded) return;
    let cancelled = false;

    (async () => {
      try {
        const [sessions, stories, images, profile] = await Promise.all([
          db.loadSessions(user.id),
          db.loadStories(user.id),
          db.loadImages(user.id),
          db.loadProfile(user.id),
        ]);
        if (cancelled) return;
        setSavedSessions(sessions);
        setSavedStories(stories);
        setGeneratedImages(images);
        if (profile) {
          setUser(prev => ({ ...prev, ...profile }));
        }
        setDataLoaded(true);
      } catch (e) {
        console.error('Failed to load user data:', e);
        setDataLoaded(true); // still mark as loaded to avoid infinite retry
      }
    })();

    return () => { cancelled = true; };
  }, [user.id, dataLoaded]);

  // --- PAYWALL STATE ---
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');

  // --- DAILY REWARD ---
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(10);

  // --- LEGAL ---
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  // --- TOAST ---
  const [toast, setToast] = useState<{ title: string; message: string; icon?: string } | null>(null);

  // --- CHARACTERS ---
  const allCharacters = [...getCharacters(language), ...(user.customCharacters || [])];

  // --- PERSIST user profile changes to Supabase (debounced) ---
  useEffect(() => {
    if (!user.id || !dataLoaded) return;
    clearTimeout(saveTimer.current['profile']);
    saveTimer.current['profile'] = setTimeout(() => {
      db.saveProfile(user.id, user).catch(() => {});
    }, 2000);
  }, [user, dataLoaded]);
  useEffect(() => { saveState('language', language); }, [language]);

  // --- SERVICE WORKER & PUSH NOTIFICATIONS ---
  useEffect(() => {
    registerServiceWorker().then(async (ok) => {
      if (!ok) return;
      const granted = await requestNotificationPermission();
      if (granted) scheduleReminderNotifications(language);
    });
  }, []);

  // --- DAILY LOGIN CHECK ---
  useEffect(() => {
    if (!user.isAuthenticated) return;
    const today = new Date().toDateString();
    if (user.lastLoginDate !== today) {
      const newStreak = user.lastLoginDate ? (user.streak || 0) + 1 : 1;
      const reward = Math.min(10 + newStreak * 2, 50);
      setDailyRewardAmount(reward);
      setShowDailyReward(true);
    }
  }, [user.isAuthenticated]);

  const claimDailyReward = () => {
    const today = new Date().toDateString();
    const newStreak = user.lastLoginDate ? (user.streak || 0) + 1 : 1;
    setUser(prev => ({
      ...prev,
      credits: prev.credits + dailyRewardAmount,
      lastLoginDate: today,
      streak: newStreak,
      dailyMessagesLeft: 10
    }));
    setShowDailyReward(false);
  };

  // --- SUPABASE AUTH LISTENER ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(prev => {
          // If already authenticated with same id, keep existing data
          if (prev.isAuthenticated && prev.id === session.user.id) return prev;
          return {
            ...prev,
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || prev.name,
            email: session.user.email || prev.email,
            picture: session.user.user_metadata?.avatar_url || prev.picture,
            isAuthenticated: true,
            isVerified: true,
          };
        });
      }
      setAuthInitDone(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- AUTH HANDLERS ---
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      setAuthLoading(true);
      try {
        if (authScreen === 'register') {
          if (!isAgeAccepted) { setAuthLoading(false); return; }
          // Use server-side admin API to create user (no email sent)
          const resp = await fetch('/api/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword, name: authName, action: 'register' }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'Registratie mislukt');
          // Set the session from the server response
          if (data.session?.access_token) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }
        } else {
          // Login via server-side API
          const resp = await fetch('/api/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword, action: 'login' }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.error || 'Login mislukt');
          if (data.session?.access_token) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }
        }
      } catch (err: any) {
        setAuthError(err?.message || 'Er ging iets mis. Probeer het opnieuw.');
      } finally {
        setAuthLoading(false);
      }
    };

  const handleGoogleLogin = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(DEFAULT_USER);
    setSavedSessions([]);
    setSavedStories([]);
    setGeneratedImages([]);
    setActiveSession(null);
    setActiveStory(undefined);
    setDataLoaded(false);
    setMode(AppMode.GALLERY);
  };

  // --- CREDIT & MESSAGE SYSTEM ---
  const onConsumeCredit = useCallback((cost: number): boolean => {
    if (user.isPremium) return true;
    if (user.credits >= cost) {
      setUser(prev => ({ ...prev, credits: prev.credits - cost }));
      return true;
    }
    setPaywallReason(`Je hebt ${cost} credits nodig.`);
    setShowPaywall(true);
    return false;
  }, [user.isPremium, user.credits]);

  const onConsumeDailyMessage = useCallback((): boolean => {
    if (user.isPremium) return true;
    if (user.dailyMessagesLeft > 0) {
      setUser(prev => ({ ...prev, dailyMessagesLeft: prev.dailyMessagesLeft - 1 }));
      return true;
    }
    setPaywallReason('Je dagelijkse berichten zijn op.');
    setShowPaywall(true);
    return false;
  }, [user.isPremium, user.dailyMessagesLeft]);

  // --- SESSION HANDLERS ---
    const handleSaveSession = (session: ChatSession) => {
      setSavedSessions(prev => {
        const idx = prev.findIndex(s => s.id === session.id);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = session; return copy; }
        return [session, ...prev];
      });
      setActiveSession(session);
      // Save to Supabase (debounced)
      if (user.id) {
        clearTimeout(saveTimer.current[`session_${session.id}`]);
        saveTimer.current[`session_${session.id}`] = setTimeout(() => {
          db.saveSession(user.id, session).catch(() => {});
        }, 1500);
      }
      // Schedule character notification when user has been chatting
      if (session.messages.length > 2) {
        const charName = allCharacters.find(c => c.id === session.characterId)?.name;
        if (charName) scheduleCharacterNotification(charName, language);
      }
    };

  const handleLoadSession = (session: ChatSession) => {
    setActiveSession(session);
    setMode(AppMode.CHAT);
  };

    const handleDeleteSession = (id: string) => {
      setSavedSessions(prev => prev.filter(s => s.id !== id));
      if (activeSession?.id === id) setActiveSession(null);
      if (user.id) db.deleteSession(user.id, id).catch(() => {});
    };

  // --- STORY HANDLERS ---
    const handleSaveStory = (story: SavedStory) => {
      setSavedStories(prev => {
        const idx = prev.findIndex(s => s.id === story.id);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = story; return copy; }
        return [story, ...prev];
      });
      setActiveStory(story);
      if (user.id) {
        clearTimeout(saveTimer.current[`story_${story.id}`]);
        saveTimer.current[`story_${story.id}`] = setTimeout(() => {
          db.saveStory(user.id, story).catch(() => {});
        }, 1500);
      }
    };

    const handleLoadStory = (story: SavedStory) => {
      setActiveStory(story);
      setMode(AppMode.STORY);
    };

    const handleDeleteStory = (id: string) => {
      setSavedStories(prev => prev.filter(s => s.id !== id));
      if (activeStory?.id === id) setActiveStory(undefined);
      if (user.id) db.deleteStory(user.id, id).catch(() => {});
    };

  // --- CHARACTER SELECTION ---
  const handleCharacterSelect = (selected: Character | Character[]) => {
    const chars = Array.isArray(selected) ? selected : [selected];
    const primaryChar = chars[0];
    const existingSession = savedSessions.find(s =>
      chars.length === 1 ? s.characterId === primaryChar.id : false
    );

    if (existingSession) {
      setActiveSession(existingSession);
    } else {
      const newSession: ChatSession = {
        id: `chat_${Date.now()}`,
        title: chars.length > 1 ? `Groep: ${chars.map(c => c.name).join(', ')}` : primaryChar.name,
        messages: [],
        lastUpdated: Date.now(),
        characterId: primaryChar.id,
        characterIds: chars.map(c => c.id),
        arousal: 0,
        affection: 0,
        trust: 0,
        intimacy: 0,
        level: 1,
        experience: 0,
        memories: []
      };
      setActiveSession(newSession);
    }
    setMode(AppMode.CHAT);
  };

  // --- CUSTOM CHARACTER ---
  const handleSaveCustomCharacter = (char: Character) => {
    setUser(prev => ({
      ...prev,
      customCharacters: [...(prev.customCharacters || []), char]
    }));
    setMode(AppMode.GALLERY);
  };

  // --- IMAGINE ---
    const handleGenerateImage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!imaginePrompt.trim()) return;
      if (!onConsumeCredit(5)) return;
      setIsGeneratingImage(true);
      try {
        const url = await geminiService.generateImage(imaginePrompt);
        const newImage: GeneratedImage = { url, prompt: imaginePrompt };
        setGeneratedImages(prev => [...prev, newImage]);
        if (user.id) db.saveImage(user.id, newImage).catch(() => {});
      } catch (err) {
        console.error('Image generation failed', err);
      } finally {
        setIsGeneratingImage(false);
      }
    };

    // --- TRIAL SYSTEM ---
    const [showTrialConfirm, setShowTrialConfirm] = useState(false);

    const handleStartTrial = useCallback(() => {
      // Check if user already used their trial
        const trialUsed = loadState(`${user.id}_trialUsed`, false);
        if (trialUsed) {
        // Already used trial, show paywall instead
        setPaywallReason('');
        setShowPaywall(true);
        return;
      }
      // Activate 3-day VIP trial
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3);
      setUser(prev => ({
        ...prev,
        isPremium: true,
        vipExpiresAt: expiresAt.toISOString(),
        credits: prev.credits + 100,
      }));
      saveState(`${user.id}_trialUsed`, true);
      // Show prominent fullscreen confirmation
      setShowTrialConfirm(true);
      setTimeout(() => setShowTrialConfirm(false), 3500);
    }, [user.id]);

  // --- CHECK TRIAL EXPIRY ---
  useEffect(() => {
    if (user.isPremium && user.vipExpiresAt) {
      const expires = new Date(user.vipExpiresAt);
      if (expires <= new Date()) {
        setUser(prev => ({ ...prev, isPremium: false, vipExpiresAt: undefined }));
        showToast('VIP Verlopen', 'Je trial is verlopen. Upgrade voor onbeperkt toegang.', '⏰');
      }
    }
  }, [user.isPremium, user.vipExpiresAt]);

  // --- PAYWALL PURCHASE ---
  const handlePurchase = (amount: number, isSub: boolean) => {
    if (isSub) {
      setUser(prev => ({ ...prev, isPremium: true, credits: prev.credits + amount }));
    } else {
      setUser(prev => ({ ...prev, credits: prev.credits + amount }));
    }
    setShowPaywall(false);
    showToast('Aankoop Geslaagd', `+${amount} credits toegevoegd!`, '✨');
  };

  // --- TOAST ---
  const showToast = (title: string, message: string, icon?: string) => {
    setToast({ title, message, icon });
    setTimeout(() => setToast(null), 4000);
  };

  // --- LANDING PAGE ---
  if (!user.isAuthenticated) {
    return (
      <>
        <HoverReceiver />
        <LandingPage
          authScreen={authScreen}
          setAuthScreen={setAuthScreen}
          handleAuthSubmit={handleAuthSubmit}
          handleGoogleLogin={handleGoogleLogin}
          isAgeAccepted={isAgeAccepted}
          setIsAgeAccepted={setIsAgeAccepted}
          authName={authName}
          setAuthName={setAuthName}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authLoading={authLoading}
          authError={authError}
          onOpenLegal={(tab) => { setLegalTab(tab); setShowLegal(true); }}
        />
        <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} initialTab={legalTab} language={language} />
      </>
    );
  }

  // --- MAIN CONTENT ---
  const renderContent = () => {
    switch (mode) {
      case AppMode.GALLERY:
        return (
          <CharacterSelector
            isOpen={true}
            onClose={() => {}}
            characters={allCharacters}
            selectedCharacterId={activeSession?.characterId || ''}
            onSelect={handleCharacterSelect}
            onToggleSidebar={() => setIsSidebarOpen(true)}
            language={language}
            favoriteIds={user.favoriteCharacterIds || []}
            onToggleFavorite={(charId) => {
              setUser(prev => {
                const favs = prev.favoriteCharacterIds || [];
                const updated = favs.includes(charId)
                  ? favs.filter(id => id !== charId)
                  : favs.length >= 3 ? favs : [...favs, charId];
                return { ...prev, favoriteCharacterIds: updated };
              });
            }}
          />
        );
      case AppMode.CHAT:
        if (!activeSession) {
          setMode(AppMode.GALLERY);
          return null;
        }
        return (
          <ChatInterface
            initialSession={activeSession}
            onSaveSession={handleSaveSession}
            user={user}
            onUpdateUser={(updates) => setUser(prev => ({ ...prev, ...updates }))}
            onConsumeCredit={onConsumeCredit}
            onConsumeDailyMessage={onConsumeDailyMessage}
            onShowPaywall={(reason) => { setPaywallReason(reason); setShowPaywall(true); }}
            language={language}
            characters={allCharacters}
            onShowToast={showToast}
          />
        );
      case AppMode.STORY:
        return (
          <StoryInterface
            language={language}
            user={user}
            initialStory={activeStory}
            onSaveStory={handleSaveStory}
            characters={allCharacters}
            onCreateNew={() => setActiveStory(undefined)}
            onConsumeCredit={onConsumeCredit}
          />
        );
      case AppMode.LIVE:
        return (
          <LiveInterface
            config={config}
            isActive={mode === AppMode.LIVE}
            language={language}
            onConsumeCredit={onConsumeCredit}
            user={user}
          />
        );
      case AppMode.SOLO_COACH:
        return <SoloCoachInterface language={language} user={user} />;
      case AppMode.IMAGINE:
        return (
          <ImagineInterface
            prompt={imaginePrompt}
            onPromptChange={setImaginePrompt}
            onGenerate={handleGenerateImage}
            isGenerating={isGeneratingImage}
            generatedImages={generatedImages}
            language={language}
          />
        );
      case AppMode.VIDEOS:
        return <VideoFinder language={language} />;
      case AppMode.CREATOR:
        return (
          <CharacterCreator
            onSave={handleSaveCustomCharacter}
            language={language}
            onConsumeCredit={onConsumeCredit}
            user={user}
          />
        );
      case AppMode.AUDIO_STORIES:
        return <AudioStoriesInterface user={user} language={language} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex bg-black overflow-hidden w-full" style={{ height: '100dvh' }}>
      <HoverReceiver />
      <Sidebar
        config={config}
        onConfigChange={() => {}}
        onClearChat={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
        savedSessions={savedSessions}
        savedStories={savedStories}
        onLoadSession={handleLoadSession}
        onLoadStory={handleLoadStory}
        onDeleteSession={handleDeleteSession}
        onDeleteStory={handleDeleteStory}
        user={user}
          onOpenPaywall={() => { setPaywallReason(''); setShowPaywall(true); }}
          onStartTrial={handleStartTrial}
        language={language}
        onSelectLanguage={setLanguage}
        onLogout={handleLogout}
        activeSessionId={activeSession?.id}
        activeStoryId={activeStory?.id}
        onResetActiveStory={() => setActiveStory(undefined)}
        onOpenLegal={(tab) => { setLegalTab(tab); setShowLegal(true); }}
      />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Trial Active Banner */}
          {user.isPremium && user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date() && (
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 flex items-center justify-center gap-2 shrink-0 z-40">
              <Icons.Sparkles size={14} className="text-white" />
              <span className="text-white text-xs font-bold">
                VIP TRIAL ACTIEF — nog {Math.ceil((new Date(user.vipExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dagen
              </span>
              <Icons.Sparkles size={14} className="text-white" />
            </div>
          )}
        {/* Mobile Header */}
        {mode !== AppMode.CHAT && mode !== AppMode.LIVE && mode !== AppMode.SOLO_COACH && (
          <div className="md:hidden absolute top-4 right-4 z-50">
            <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-gold-500 bg-black/60 rounded-full border border-gold-500/20 backdrop-blur-md shadow-lg">
              <Icons.Menu size={24} />
            </button>
          </div>
        )}

        {mode === AppMode.CHAT && (
          <div className="md:hidden absolute top-4 left-4 z-50">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gold-500 bg-black/40 rounded-full border border-gold-500/20 backdrop-blur-md">
              <Icons.Menu size={20} />
            </button>
          </div>
        )}

        {renderContent()}
      </main>

      {/* Modals */}
        <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} onPurchase={handlePurchase} onStartTrial={handleStartTrial} reason={paywallReason} language={language} userId={user.id} />
      <DailyRewardModal isOpen={showDailyReward} onClaim={claimDailyReward} streak={user.streak || 0} amount={dailyRewardAmount} />
      <LegalModal isOpen={showLegal} onClose={() => setShowLegal(false)} initialTab={legalTab} language={language} />
      <InstallButton />

      {/* Toast */}
        {toast && (
          <div className="fixed top-6 right-6 z-[200] bg-zinc-900 border border-gold-500/30 rounded-2xl p-4 shadow-2xl animate-in slide-in-from-top-4 fade-in max-w-xs">
            <div className="flex items-center gap-3">
              {toast.icon && <span className="text-2xl">{toast.icon}</span>}
              <div>
                <h4 className="text-white font-bold text-sm">{toast.title}</h4>
                <p className="text-zinc-400 text-xs">{toast.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Trial Activation Confirmation Overlay */}
        {showTrialConfirm && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="text-center animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Icons.Check className="text-emerald-400" size={48} />
              </div>
              <h2 className="text-3xl font-black text-white mb-3">VIP Trial Geactiveerd!</h2>
              <p className="text-emerald-400 text-lg font-bold mb-2">3 dagen gratis VIP</p>
              <p className="text-zinc-400 text-sm">+100 bonus credits toegevoegd</p>
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Icons.Sparkles size={14} className="text-emerald-400" />
                <span className="text-emerald-300 text-xs font-bold">Alle premium features ontgrendeld</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default App;
