import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";
import { AppMode, ModelConfig, GeneratedImage, Character, Language } from './types';
import { DEFAULT_CONFIG, getCharacters } from './constants';
import { geminiService } from './services/geminiService';
import { setTTSLanguage } from './services/deepgramTTS';
import * as db from './services/supabaseData';
import { loadLocale } from './lib/i18n/index';

import { useAuth } from './lib/hooks/useAuth';
import { useCredits } from './lib/hooks/useCredits';
import { useSessions } from './lib/hooks/useSessions';
import { useStories } from './lib/hooks/useStories';
import type { StoryArc } from './services/supabaseData';

import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
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
import OnboardingWizard from './components/OnboardingWizard';
import ErrorBoundary from './components/ErrorBoundary';
import InstallButton from './components/InstallButton';
import Icons from './components/Icon';
import { registerServiceWorker, requestNotificationPermission, scheduleReminderNotifications } from './services/notifications';

const loadState = <T,>(key: string, fallback: T): T => {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
};
const saveState = (key: string, value: any) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };

const App = () => {
  const auth = useAuth();
  const { user, setUser } = auth;

  // --- APP STATE ---
  const [mode, setMode] = useState<AppMode>(AppMode.GALLERY);
  const [config] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(() => loadState('language', 'nl'));
  const [dataLoaded, setDataLoaded] = useState(false);

  // --- TOAST ---
  const [toast, setToast] = useState<{ title: string; message: string; icon?: string } | null>(null);
  const showToast = useCallback((title: string, message: string, icon?: string) => {
    setToast({ title, message, icon });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // --- PAYWALL ---
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState('');
  const openPaywall = useCallback((reason: string) => {
    setPaywallReason(reason);
    setShowPaywall(true);
  }, []);

  // --- CHARACTERS ---
  const allCharacters = [...getCharacters(language), ...(user.customCharacters || [])];

  // --- HOOKS ---
  const credits = useCredits(user, setUser, openPaywall, showToast);
  const sessions = useSessions(user.id, allCharacters, language);
  const stories = useStories(user.id);

  // --- IMAGE STATE ---
  const [imaginePrompt, setImaginePrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- DAILY REWARD ---
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardAmount, setDailyRewardAmount] = useState(10);

  // --- LEGAL ---
  const [showLegal, setShowLegal] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');

  // --- ONBOARDING ---
  const [showOnboarding, setShowOnboarding] = useState(false);

  // --- CLIFFHANGER (progressive storyline) ---
  const [cliffhangerArc, setCliffhangerArc] = useState<StoryArc | null>(null);

  // Debounce ref for saving
  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Sync TTS language + preload locale
  useEffect(() => { setTTSLanguage(language); loadLocale(language).catch(() => {}); }, [language]);
  useEffect(() => { saveState('language', language); }, [language]);

  // --- LOAD USER DATA FROM SUPABASE ---
  useEffect(() => {
    if (!user.id || dataLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const [sessionsData, storiesData, images, profile] = await Promise.all([
          db.loadSessions(user.id),
          db.loadStories(user.id),
          db.loadImages(user.id),
          db.loadProfile(user.id),
        ]);
        if (cancelled) return;
        sessions.setSavedSessions(sessionsData);
        stories.setSavedStories(storiesData);
        setGeneratedImages(images);
        if (profile) {
          setUser(prev => ({ ...prev, ...profile }));
        }
          setDataLoaded(true);

          // Show onboarding for brand new users (no sessions, no stories)
          if (sessionsData.length === 0 && storiesData.length === 0) {
            const onboardingDone = localStorage.getItem(`onboarding_done_${user.id}`);
            if (!onboardingDone) setShowOnboarding(true);
          }

          // Load story arcs — show cliffhanger banner if there's a pending arc
          db.loadStoryArcs(user.id).then(arcs => {
            const pending = arcs.find(a => a.cliffhanger);
            if (pending) setCliffhangerArc(pending);
          }).catch(() => {});
      } catch (e) {
        console.error('Failed to load user data:', e);
        setDataLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user.id, dataLoaded]);

  // --- PERSIST user profile changes to Supabase ---
  useEffect(() => {
    if (!user.id || !dataLoaded) return;
    clearTimeout(saveTimer.current['profile']);
    saveTimer.current['profile'] = setTimeout(() => {
      db.saveProfile(user.id, user).catch(() => {});
    }, 2000);
  }, [user, dataLoaded]);

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

  // --- CHECK TRIAL EXPIRY ---
  useEffect(() => { credits.checkTrialExpiry(); }, [user.isPremium, user.vipExpiresAt]);

  // --- LOGOUT (extends auth.handleLogout with local state reset) ---
  const handleLogout = async () => {
    await auth.handleLogout();
    sessions.setSavedSessions([]);
    stories.setSavedStories([]);
    setGeneratedImages([]);
    sessions.setActiveSession(null);
    stories.setActiveStory(undefined);
    setDataLoaded(false);
    setMode(AppMode.GALLERY);
  };

  // --- CUSTOM CHARACTER ---
  const handleSaveCustomCharacter = async (char: Character) => {
    const updated = [...(user.customCharacters || []), char];
    setUser(prev => ({ ...prev, customCharacters: updated }));
    // Immediately persist to DB so it survives page refresh
    if (user.id) {
      try {
        await db.saveProfile(user.id, { customCharacters: updated });
      } catch (e) {
        console.error('Failed to save custom character:', e);
      }
    }
    setMode(AppMode.GALLERY);
  };

  // --- IMAGINE ---
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imaginePrompt.trim()) return;
    if (!credits.onConsumeCredit(5)) return;
    setIsGeneratingImage(true);
    try {
      const rawUrl = await geminiService.generateImage(imaginePrompt);
      // Upload to Supabase Storage (converts base64 -> public URL)
      let finalUrl = rawUrl;
      if (user.id) {
        const storageUrl = await db.saveImage(user.id, { url: rawUrl, prompt: imaginePrompt });
        if (storageUrl) finalUrl = storageUrl;
      }
      const newImage: GeneratedImage = { url: finalUrl, prompt: imaginePrompt };
      setGeneratedImages(prev => [...prev, newImage]);
    } catch (err: any) {
      if (err?.message === 'INSUFFICIENT_CREDITS') openPaywall('Je hebt 5 credits nodig voor een afbeelding.');
      else console.error('Image generation failed', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- LANDING PAGE ---
  if (!user.isAuthenticated) {
    return (
      <>
        <HoverReceiver />
        <LandingPage
          authScreen={auth.authScreen}
          setAuthScreen={auth.setAuthScreen}
          handleAuthSubmit={auth.handleAuthSubmit}
          handleGoogleLogin={auth.handleGoogleLogin}
          isAgeAccepted={auth.isAgeAccepted}
          setIsAgeAccepted={auth.setIsAgeAccepted}
          authName={auth.authName}
          setAuthName={auth.setAuthName}
          authEmail={auth.authEmail}
          setAuthEmail={auth.setAuthEmail}
          authPassword={auth.authPassword}
          setAuthPassword={auth.setAuthPassword}
          authLoading={auth.authLoading}
          authError={auth.authError}
          onOpenLegal={(tab) => { setLegalTab(tab); setShowLegal(true); }}
          language={language}
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
            selectedCharacterId={sessions.activeSession?.characterId || ''}
            onSelect={(selected) => { sessions.handleCharacterSelect(selected); setMode(AppMode.CHAT); }}
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
        if (!sessions.activeSession) { setMode(AppMode.GALLERY); return null; }
        return (
          <ChatInterface
            initialSession={sessions.activeSession}
            onSaveSession={sessions.handleSaveSession}
            user={user}
            onUpdateUser={(updates) => setUser(prev => ({ ...prev, ...updates }))}
            onConsumeCredit={credits.onConsumeCredit}
            onConsumeDailyMessage={credits.onConsumeDailyMessage}
            onShowPaywall={openPaywall}
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
            initialStory={stories.activeStory}
            onSaveStory={stories.handleSaveStory}
            characters={allCharacters}
            onCreateNew={() => stories.setActiveStory(undefined)}
            onConsumeCredit={credits.onConsumeCredit}
          />
        );
      case AppMode.LIVE:
        return (
          <LiveInterface
            config={config}
            isActive={mode === AppMode.LIVE}
            language={language}
            onConsumeCredit={credits.onConsumeCredit}
            user={user}
            allCharacters={allCharacters}
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
            onConsumeCredit={credits.onConsumeCredit}
            user={user}
          />
        );
      case AppMode.AUDIO_STORIES:
        return <AudioStoriesInterface user={user} language={language} />;
      default:
        return null;
    }
  };

  // Is it an immersive mode where we hide the bottom nav?
  const isImmersiveMode = mode === AppMode.CHAT || mode === AppMode.LIVE || mode === AppMode.SOLO_COACH;

  return (
    <div className="fixed inset-0 flex flex-col md:flex-row bg-black overflow-hidden">
      <HoverReceiver />
      
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          characters={allCharacters}
          language={language}
          onSelectLanguage={setLanguage}
          onComplete={(selectedChar) => {
            setShowOnboarding(false);
            localStorage.setItem(`onboarding_done_${user.id}`, '1');
            if (selectedChar) {
              sessions.handleCharacterSelect(selectedChar);
              setMode(AppMode.CHAT);
            }
          }}
        />
      )}

      <Sidebar
        config={config}
        onConfigChange={() => {}}
        onClearChat={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        mode={mode}
        onModeChange={setMode}
        savedSessions={sessions.savedSessions}
        savedStories={stories.savedStories}
        onLoadSession={(s) => { sessions.handleLoadSession(s); setMode(AppMode.CHAT); }}
        onLoadStory={(s) => { stories.handleLoadStory(s); setMode(AppMode.STORY); }}
        onDeleteSession={sessions.handleDeleteSession}
        onDeleteStory={stories.handleDeleteStory}
        user={user}
        onOpenPaywall={() => openPaywall('')}
        onStartTrial={credits.handleStartTrial}
        language={language}
        onSelectLanguage={setLanguage}
        onLogout={handleLogout}
        activeSessionId={sessions.activeSession?.id}
        activeStoryId={stories.activeStory?.id}
        onResetActiveStory={() => stories.setActiveStory(undefined)}
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

        {/* Cliffhanger Return Banner */}
        {cliffhangerArc && !showOnboarding && (
          <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-purple-900/90 border-b border-purple-500/30 px-4 py-2.5 flex items-center gap-3 shrink-0 z-40 animate-in slide-in-from-top-2 duration-500">
            <span className="text-xl shrink-0">📖</span>
            <div className="flex-1 min-w-0">
              <p className="text-purple-200 text-xs font-black uppercase tracking-widest leading-none mb-0.5">
                {language === 'nl' ? 'Jouw verhaal wacht...' : language === 'de' ? 'Deine Geschichte wartet...' : language === 'fr' ? 'Ton histoire attend...' : language === 'es' ? 'Tu historia espera...' : language === 'it' ? 'La tua storia aspetta...' : 'Your story awaits...'}
              </p>
              <p className="text-purple-100 text-xs leading-snug truncate italic">"{cliffhangerArc.cliffhanger}"</p>
            </div>
            <button
              onClick={() => { setMode(AppMode.STORY); setCliffhangerArc(null); }}
              className="shrink-0 px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
            >
              {language === 'nl' ? 'Ga Verder' : language === 'de' ? 'Weitermachen' : language === 'fr' ? 'Continuer' : language === 'es' ? 'Continuar' : language === 'it' ? 'Continua' : 'Continue'}
            </button>
            <button onClick={() => setCliffhangerArc(null)} className="p-1 text-purple-400 hover:text-white transition-colors shrink-0">
              <Icons.X size={14} />
            </button>
          </div>
        )}

        {/* Mobile Header - only on gallery/non-immersive on desktop-hidden */}
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

        {/* Content area - add bottom padding on mobile for bottom nav */}
        <div className={`flex-1 flex flex-col overflow-hidden ${!isImmersiveMode ? 'pb-16 md:pb-0' : ''}`}>
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {!isImmersiveMode && (
        <BottomNav mode={mode} onModeChange={setMode} credits={user.credits} />
      )}

      {/* Modals */}
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} onPurchase={credits.handlePurchase} onStartTrial={credits.handleStartTrial} reason={paywallReason} language={language} userId={user.id} />
      <DailyRewardModal isOpen={showDailyReward} onClaim={() => { credits.claimDailyReward(dailyRewardAmount); setShowDailyReward(false); }} streak={user.streak || 0} amount={dailyRewardAmount} />
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
      {credits.showTrialConfirm && (
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
