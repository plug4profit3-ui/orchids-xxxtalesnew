
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import StoryInterface from './components/StoryInterface';
import ChatInterface from './components/ChatInterface';
import LiveInterface from './components/LiveInterface';
import ImagineInterface from './components/ImagineInterface';
import CharacterCreator from './components/CharacterCreator';
import CharacterSelector from './components/CharacterSelector';
import VideoFinder from './components/VideoFinder';
import AudioStoriesInterface from './components/AudioStoriesInterface';
import SoloCoachInterface from './components/SoloCoachInterface';
import PaywallModal from './components/PaywallModal';
import LegalModal from './components/LegalModal';
import Icons from './components/Icon';
import InstallButton from './components/InstallButton';
import LandingPage from './components/LandingPage';
import { ModelConfig, AppMode, ChatSession, UserProfile, Language, Character, SavedStory, GeneratedImage } from './types';
import { DEFAULT_CONFIG, getCharacters } from './constants';
import { geminiService } from './services/geminiService';
import { paymentClient } from './services/paymentClient';

type AuthScreen = 'login' | 'register' | 'verify';

interface Toast {
  id: string;
  title: string;
  message: string;
  icon: string;
  characterId?: string;
}

// Helper to decode Google JWT
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) { return null; }
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    id: '', name: '', email: '', picture: '', isPremium: false, credits: 0,
    dailyMessagesLeft: 20, lastLoginDate: '', streak: 1, isAuthenticated: false,
    isVerified: false, customCharacters: [], unlockedTraits: [],
    unlockedAppearances: [], highestLevelReached: 1
  });
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAgeAccepted, setIsAgeAccepted] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [language, setLanguage] = useState<Language>('nl');
  
  // Modals
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms'>('privacy');
  
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");
  const [mode, setMode] = useState<AppMode>(AppMode.GALLERY);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatConfig, setChatConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | undefined>(undefined);
  const [activeStory, setActiveStory] = useState<SavedStory | undefined>(undefined);

  // Imagine Mode State
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // Prevent duplicates by using a Map or rigorous filtering
  const allCharacters = useMemo(() => {
    const custom = user.customCharacters || [];
    const defaults = getCharacters(language);
    
    // Create a map to ensure uniqueness by ID
    const charMap = new Map<string, Character>();
    
    // Add custom characters first (they take precedence or just sit at top)
    custom.forEach(c => charMap.set(c.id, c));
    
    // Add default characters if ID doesn't exist yet
    defaults.forEach(d => {
        if (!charMap.has(d.id)) {
            charMap.set(d.id, d);
        }
    });

    return Array.from(charMap.values());
  }, [user.customCharacters, language]);

  const globalAmbientVideo = useMemo(() => {
    const videoChars = allCharacters.filter(c => c.video && !c.isDoll);
    if (videoChars.length === 0) return "https://storage.googleapis.com/foto1982/claudia.mp4";
    return videoChars[Math.floor(Math.random() * videoChars.length)].video;
  }, [allCharacters]);

  const addToast = useCallback((title: string, message: string, icon: string = "✨", characterId?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, message, icon, characterId }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 8000);
  }, []);

  const handleUpdateUser = useCallback((updates: Partial<UserProfile>) => {
    setUser(prev => {
        const updated = { ...prev, ...updates };
        if (prev.id) {
            localStorage.setItem(`xxx_user_${prev.id}_profile`, JSON.stringify(updated));
        }
        return updated;
    });
  }, []);

  const handleStartChat = useCallback((chars: Character | Character[]) => {
    const selectedChars = Array.isArray(chars) ? chars : [chars];
    const isGroup = selectedChars.length > 1;
    const primaryChar = selectedChars[0];
    const characterIds = selectedChars.map(c => c.id);

    // For group chats, we always create a new session ID to avoid complex merges.
    // For single chats, we try to find existing.
    let existingSession = !isGroup ? savedSessions.find(s => s.characterId === primaryChar.id && (!s.characterIds || s.characterIds.length <= 1)) : null;

    if (existingSession) {
      setActiveSession(existingSession);
    } else {
      const title = isGroup 
        ? `Groep: ${selectedChars.map(c => c.name).join(' & ')}` 
        : `Chat met ${primaryChar.name}`;
        
      const newSession: ChatSession = { 
        id: `sess_${Date.now()}`, 
        title: title, 
        messages: [], 
        characterId: primaryChar.id, 
        characterIds: characterIds,
        lastUpdated: Date.now(), 
        arousal: 0, 
        affection: 0, 
        trust: 0, 
        intimacy: 0, 
        level: 1, 
        experience: 0, 
        unlockedTraits: [],
        memories: [] // Initialize session memory
      };
      
      setSavedSessions(prev => {
        const updated = [newSession, ...prev];
        if (user.id) localStorage.setItem(`xxx_user_${user.id}_sessions`, JSON.stringify(updated));
        return updated;
      });
      setActiveSession(newSession);
    }
    setMode(AppMode.CHAT);
  }, [savedSessions, user.id]);

  const handleToastClick = useCallback((t: Toast) => {
    if (t.characterId) {
      const char = allCharacters.find(c => c.id === t.characterId);
      if (char) handleStartChat(char);
    }
    setToasts(prev => prev.filter(toast => toast.id !== t.id));
  }, [allCharacters, handleStartChat]);

  const handleConsumeCredit = useCallback((amount: number): boolean => {
    if (user.isPremium) return true; // VIP users bypass credit cost for most actions (unless specifically gated)
    
    if (user.credits >= amount) {
      setUser(prev => ({ ...prev, credits: prev.credits - amount }));
      return true;
    }
    setPaywallReason("Onvoldoende credits beschikbaar");
    setIsPaywallOpen(true);
    return false;
  }, [user.credits, user.isPremium]);

  const handleConsumeDailyMessage = useCallback((): boolean => {
    if (user.isPremium) return true;
    if (user.dailyMessagesLeft > 0) {
      setUser(prev => ({ ...prev, dailyMessagesLeft: prev.dailyMessagesLeft - 1 }));
      return true;
    }
    // Instead of forcing paywall immediately, we return false.
    // ChatInterface will then check if user has credits to pay per message.
    return false;
  }, [user.isPremium, user.dailyMessagesLeft]);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || isGeneratingImage) return;

    const COST = 5;
    if (user.credits < COST) {
      setPaywallReason("Onvoldoende credits voor visualisatie");
      setIsPaywallOpen(true);
      return;
    }

    setIsGeneratingImage(true);
    try {
      const imageUrl = await geminiService.generateImage(imagePrompt);
      const newImage: GeneratedImage = { url: imageUrl, prompt: imagePrompt };
      
      setGeneratedImages(prev => [newImage, ...prev]);
      
      // Update user credits
      setUser(prev => ({ ...prev, credits: prev.credits - COST }));
      setImagePrompt('');
      addToast("Succes", "Je afbeelding is klaar!", "🎨");
    } catch (error) {
      addToast("Fout", "Kon afbeelding niet genereren. Probeer het later opnieuw.", "⚠️");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const loadUserData = useCallback((userId: string) => {
    const profileStr = localStorage.getItem(`xxx_user_${userId}_profile`);
    const sessionsStr = localStorage.getItem(`xxx_user_${userId}_sessions`);
    const storiesStr = localStorage.getItem(`xxx_user_${userId}_stories`);
    if (profileStr) {
      try {
        const p = JSON.parse(profileStr);
        setUser({ 
            ...p, 
            id: userId, 
            isAuthenticated: true, 
            isVerified: p.isVerified || false, 
            customCharacters: p.customCharacters || []
        });
        if (!p.isVerified) { setAuthScreen('verify'); setAuthEmail(p.email); }
      } catch (e) {}
    }
    if (sessionsStr) { try { setSavedSessions(JSON.parse(sessionsStr)); } catch (e) {} }
    if (storiesStr) { try { setSavedStories(JSON.parse(storiesStr)); } catch (e) {} }
  }, []);

  useEffect(() => {
    const savedUserId = localStorage.getItem('xxx_active_session_id');
    if (savedUserId && !user.isAuthenticated) loadUserData(savedUserId);
  }, [loadUserData, user.isAuthenticated]);

  useEffect(() => {
    if (user.isAuthenticated && user.id && user.isVerified) {
      localStorage.setItem('xxx_active_session_id', user.id);
      const { isAuthenticated, ...data } = user;
      localStorage.setItem(`xxx_user_${user.id}_profile`, JSON.stringify(data));
    }
  }, [user]);

  // --- GOOGLE LOGIN LOGIC ---
  const handleGoogleResponse = useCallback((response: any) => {
    const payload = parseJwt(response.credential);
    if(payload && payload.email) {
        const userId = payload.email.toLowerCase();
        const name = payload.name;
        const picture = payload.picture;

        // Check existing
        const existingProfileStr = localStorage.getItem(`xxx_user_${userId}_profile`);
        let userProfile;

        if (existingProfileStr) {
            userProfile = JSON.parse(existingProfileStr);
            // Update picture if google has one
            userProfile.picture = picture || userProfile.picture;
            // Google users are automatically verified
            userProfile.isVerified = true;
        } else {
            // Register new
            userProfile = {
                id: userId,
                name: name || userId.split('@')[0],
                email: userId,
                picture: picture || `https://ui-avatars.com/api/?name=${name || userId}&background=D4AF37&color=000`,
                isPremium: false,
                credits: 15,
                dailyMessagesLeft: 20,
                isVerified: true, 
                customCharacters: [],
                highestLevelReached: 1
            };
        }
        
        // Save and log in
        localStorage.setItem(`xxx_user_${userId}_profile`, JSON.stringify(userProfile));
        localStorage.setItem('xxx_active_session_id', userId);
        
        setUser({ ...userProfile, isAuthenticated: true });
        
        // Load existing sessions/stories for this user
        const sessionsStr = localStorage.getItem(`xxx_user_${userId}_sessions`);
        const storiesStr = localStorage.getItem(`xxx_user_${userId}_stories`);
        if (sessionsStr) setSavedSessions(JSON.parse(sessionsStr));
        if (storiesStr) setSavedStories(JSON.parse(storiesStr));
        
        addToast("Welkom", `Ingelogd als ${userProfile.name}`, "✨");
    }
  }, [addToast]);

  useEffect(() => {
    if (!user.isAuthenticated && (authScreen === 'login' || authScreen === 'register')) {
        const loadGoogle = () => {
            const google = (window as any).google;
            if (google && google.accounts && google.accounts.id) {
                try {
                    google.accounts.id.initialize({
                        client_id: "860900982353-m7p05t1tbhhnvojg3u3bi6i1cgcipmbq.apps.googleusercontent.com",
                        callback: handleGoogleResponse
                    });
                    google.accounts.id.renderButton(
                        document.getElementById("googleBtn"),
                        { theme: "filled_black", size: "large", shape: "pill", width: "350", text: authScreen === 'register' ? "signup_with" : "signin_with" }
                    );
                } catch (e) {
                    console.error("Google button render error", e);
                }
            } else {
                // Retry if script not loaded yet (prevents button from missing)
                setTimeout(loadGoogle, 500);
            }
        };
        loadGoogle();
    }
  }, [user.isAuthenticated, authScreen, handleGoogleResponse]);
  // --------------------------

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) return;
    const userId = authEmail.toLowerCase().trim();
    const existingProfile = localStorage.getItem(`xxx_user_${userId}_profile`);
    if (authScreen === 'register') {
      if (!isAgeAccepted) return alert("Je moet 18 jaar of ouder zijn.");
      const newProfile = { name: authName || userId.split('@')[0], email: userId, isPremium: false, isVerified: false, credits: 15, dailyMessagesLeft: 20, customCharacters: [], highestLevelReached: 1, picture: `https://ui-avatars.com/api/?name=${authName || userId}&background=D4AF37&color=000` };
      localStorage.setItem(`xxx_user_${userId}_profile`, JSON.stringify(newProfile));
      setUser({ ...newProfile as any, id: userId, isAuthenticated: true });
      setAuthScreen('verify');
    } else {
      if (existingProfile) loadUserData(userId);
      else alert("Account niet gevonden.");
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length < 4) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setUser(prev => ({ ...prev, isVerified: true }));
      addToast("Account Geverifieerd", "Welkom bij XXX-Tales! Je 15 start credits zijn toegevoegd.", "💎");
    }, 1500);
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter(s => s.id !== id);
    setSavedSessions(updated);
    if (user.id) localStorage.setItem(`xxx_user_${user.id}_sessions`, JSON.stringify(updated));
    if (activeSession?.id === id) setActiveSession(undefined);
  };

  const handleDeleteStory = (id: string) => {
    const updated = savedStories.filter(s => s.id !== id);
    setSavedStories(updated);
    if (user.id) localStorage.setItem(`xxx_user_${user.id}_stories`, JSON.stringify(updated));
    if (activeStory?.id === id) setActiveStory(undefined);
  };

  const handleSaveSession = (session: ChatSession) => {
    setSavedSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      let updated;
      if (idx >= 0) { updated = [...prev]; updated[idx] = session; } else { updated = [session, ...prev]; }
      if (user.id) localStorage.setItem(`xxx_user_${user.id}_sessions`, JSON.stringify(updated));
      return updated;
    });
    setActiveSession(session);
  };

  const handleSaveStory = (story: SavedStory) => {
    setSavedStories(prev => {
      const idx = prev.findIndex(s => s.id === story.id);
      let updated;
      if (idx >= 0) { updated = [...prev]; updated[idx] = story; } else { updated = [story, ...prev]; }
      if (user.id) localStorage.setItem(`xxx_user_${user.id}_stories`, JSON.stringify(updated));
      return updated;
    });
    setActiveStory(story);
  };

  const handlePurchase = async (amount: number, isSub: boolean) => {
      if (isProcessingPayment) return;
      setIsProcessingPayment(true);
      
      const plan = isSub ? 'vip_monthly' : `credits_${amount}`;
      try {
          const result = await paymentClient.createCheckout(user.id, plan);
          
          if (result.success) {
            const isVip = result.plan.includes('vip');
            const creditsMatch = result.plan.match(/credits_(\d+)/);
            // Updated VIP credit amount to 400 based on new design
            const creditsToAdd = creditsMatch ? parseInt(creditsMatch[1]) : (isVip ? 400 : 0);
            
            setUser(prev => {
                const updated = {
                    ...prev,
                    isPremium: prev.isPremium || !!isVip,
                    credits: prev.credits + creditsToAdd
                };
                localStorage.setItem(`xxx_user_${prev.id}_profile`, JSON.stringify(updated));
                return updated;
            });

            addToast("Betaling Geslaagd!", `Je ${isVip ? 'VIP lidmaatschap' : 'credits'} zijn succesvol toegevoegd.`, "🎉");
            setIsPaywallOpen(false);
          }
      } catch (e) {
          addToast("Fout", "Betaling kon niet verwerkt worden", "❌");
      } finally {
          setIsProcessingPayment(false);
      }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('xxx_active_session_id');
    
    // Disable Google Auto-select and cancel prompts to prevent immediate re-login
    if ((window as any).google?.accounts?.id) {
        try {
            (window as any).google.accounts.id.disableAutoSelect();
            (window as any).google.accounts.id.cancel();
        } catch (e) {
            console.error("Google logout error", e);
        }
    }

    // Hard reload to clear all React state and memory (AudioContexts, Singletons, etc.)
    window.location.reload();
  }, []);

  const handleOpenLegal = (tab: 'privacy' | 'terms') => {
      setLegalTab(tab);
      setIsLegalModalOpen(true);
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[100dvh] bg-black text-white font-body overflow-hidden">
      
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <video 
          key={globalAmbientVideo}
          src={globalAmbientVideo} 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="w-full h-full object-cover opacity-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      </div>

      <div className="fixed top-6 right-6 z-[1000] space-y-3 pointer-events-none">
          {toasts.map(t => (
            <div 
              key={t.id} 
              onClick={() => handleToastClick(t)}
              className={`pointer-events-auto bg-black/95 glass-premium border-gold-500/50 p-4 rounded-2xl shadow-2xl flex items-start gap-4 animate-toast-in max-w-xs md:max-w-md w-full border-l-4 cursor-pointer hover:border-gold-400 transition-all active:scale-95`}
            >
                <div className="w-10 h-10 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-xl shrink-0">{t.icon}</div>
                <div className="flex-1">
                    <h4 className="text-[11px] font-black text-gold-500 uppercase tracking-widest">{t.title}</h4>
                    <p className="text-zinc-200 text-xs mt-1 leading-snug">{t.message}</p>
                </div>
            </div>
          ))}
      </div>

      {!user.isAuthenticated || !user.isVerified ? (
        <LandingPage
          authScreen={authScreen}
          setAuthScreen={setAuthScreen}
          handleAuthSubmit={handleAuthSubmit}
          isAgeAccepted={isAgeAccepted}
          setIsAgeAccepted={setIsAgeAccepted}
          authName={authName}
          setAuthName={setAuthName}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          verificationCode={verificationCode}
          setVerificationCode={setVerificationCode}
          handleVerifyCode={handleVerifyCode}
          isVerifying={isVerifying}
          onOpenLegal={handleOpenLegal}
        />
      ) : (
        <>
          <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} onPurchase={handlePurchase} reason={paywallReason} language={language} />
          <LegalModal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} initialTab={legalTab} language={language} />
          
          {isProcessingPayment && (
            <div className="fixed inset-0 z-[20001] bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4 animate-in fade-in">
                 <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-gold-500 font-black uppercase tracking-widest animate-pulse">Betaling verwerken...</p>
            </div>
          )}
          <Sidebar 
            config={chatConfig} 
            onConfigChange={setChatConfig} 
            mode={mode} 
            onModeChange={setMode} 
            onClearChat={() => { setActiveSession(undefined); geminiService.reset(); }} 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            savedSessions={savedSessions} 
            savedStories={savedStories} 
            onLoadSession={s => { setActiveSession(s); setMode(AppMode.CHAT); setIsSidebarOpen(false); }} 
            onLoadStory={s => { setActiveStory(s); setMode(AppMode.STORY); setIsSidebarOpen(false); }} 
            onDeleteSession={handleDeleteSession} 
            onDeleteStory={handleDeleteStory} 
            user={user} 
            onOpenPaywall={() => { setPaywallReason("VIP Toegang"); setIsPaywallOpen(true); }} 
            language={language} 
            onSelectLanguage={(lang) => setLanguage(lang)}
            onLogout={handleLogout} 
            activeSessionId={activeSession?.id} 
            activeStoryId={activeStory?.id}
            onResetActiveStory={() => setActiveStory(undefined)}
            onOpenLegal={handleOpenLegal}
          />
          <div className="flex-1 flex flex-col h-full min-h-0 relative bg-transparent z-10">
            <div className="md:hidden p-4 border-b border-gold-500/10 flex items-center justify-center bg-black/90 backdrop-blur-md z-50 pt-safe flex-shrink-0 relative">
              <button onClick={() => setIsSidebarOpen(true)} className="absolute left-4 text-gold-500 p-2"><Icons.Menu size={22} /></button>
              <div className="flex items-center gap-2">
                  <img src="https://storage.googleapis.com/foto1982/logo.jpeg" className="w-8 h-8 rounded-lg object-cover" alt="mini logo" />
                  <span className="font-headline font-black text-shine text-lg tracking-tighter">XXX-Tales</span>
              </div>
              <button onClick={() => { setPaywallReason("VIP Toegang"); setIsPaywallOpen(true); }} className="absolute right-4 bg-gold-500/10 px-3 py-1 rounded-full border border-gold-500/20"><span className="text-[10px] font-black text-gold-200">{user.credits} CR</span></button>
            </div>
            <main className="flex-1 min-h-0 relative overflow-hidden bg-black flex flex-col">
              {mode === AppMode.GALLERY && <CharacterSelector isOpen={true} onClose={() => {}} characters={allCharacters} selectedCharacterId="" onSelect={handleStartChat} onToggleSidebar={() => setIsSidebarOpen(true)} language={language} />}
              {mode === AppMode.CHAT && activeSession && <ChatInterface key={`chat_${activeSession.id}`} initialSession={activeSession} onSaveSession={handleSaveSession} user={user} onUpdateUser={handleUpdateUser} onConsumeCredit={handleConsumeCredit} onConsumeDailyMessage={handleConsumeDailyMessage} onShowPaywall={r => { setPaywallReason(r); setIsPaywallOpen(true); }} language={language} characters={allCharacters} onShowToast={addToast} />}
              {mode === AppMode.STORY && <StoryInterface key={activeStory?.id || 'new_story'} language={language} user={user} onSaveStory={handleSaveStory} initialStory={activeStory} characters={allCharacters} onCreateNew={() => setActiveStory(undefined)} onConsumeCredit={handleConsumeCredit} />}
              {mode === AppMode.LIVE && <LiveInterface config={chatConfig} isActive={true} language={language} onConsumeCredit={handleConsumeCredit} user={user} />}
              {mode === AppMode.CREATOR && <CharacterCreator onSave={char => { setUser(prev => { const currentCustom = prev.customCharacters || []; return { ...prev, customCharacters: [...currentCustom, char] }; }); handleStartChat(char); }} language={language} onConsumeCredit={handleConsumeCredit} user={user} />}
              {mode === AppMode.VIDEOS && <VideoFinder />}
              {mode === AppMode.AUDIO_STORIES && <AudioStoriesInterface user={user} />}
              {mode === AppMode.IMAGINE && <ImagineInterface prompt={imagePrompt} onPromptChange={setImagePrompt} onGenerate={handleGenerateImage} isGenerating={isGeneratingImage} generatedImages={generatedImages} language={language} />}
              {mode === AppMode.SOLO_COACH && <SoloCoachInterface language={language} user={user} />}
            </main>
          </div>
        </>
      )}
      <InstallButton />
    </div>
  );
};

export default App;
