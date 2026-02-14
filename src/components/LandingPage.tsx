
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Icons from './Icon';

const LANDING_VIDEOS = [
  'https://storage.googleapis.com/foto1982/jamie2.mp4',
  'https://storage.googleapis.com/foto1982/claudia.mp4',
  'https://storage.googleapis.com/foto1982/vivianna2.mp4',
  'https://storage.googleapis.com/foto1982/jalin2.mp4',
  'https://storage.googleapis.com/foto1982/katja2.mp4',
  'https://storage.googleapis.com/foto1982/kimberly2.mp4',
  'https://storage.googleapis.com/foto1982/astrid2.mp4',
  'https://storage.googleapis.com/foto1982/shavon2.mp4',
  'https://storage.googleapis.com/foto1982/landa2.mp4',
  'https://storage.googleapis.com/foto1982/lisselot2.mp4',
  'https://storage.googleapis.com/foto1982/bella2.mp4',
  'https://storage.googleapis.com/foto1982/bonita2.mp4',
  'https://storage.googleapis.com/foto1982/luna2.mp4',
  'https://storage.googleapis.com/foto1982/anastasia2.mp4',
];

const TESTIMONIALS = [
  {
    name: 'Mark V.',
    avatar: 'M',
    rating: 5,
    text: 'De verhalen zijn ongelooflijk realistisch. De AI begrijpt precies wat ik wil en de karakters voelen echt levensecht aan.',
  },
  {
    name: 'Dennis K.',
    avatar: 'D',
    rating: 5,
    text: 'Al maanden VIP-lid. De audio-verhalen met stemmen zijn next level. Beter dan wat ik ooit heb meegemaakt online.',
  },
  {
    name: 'Robert J.',
    avatar: 'R',
    rating: 4,
    text: 'Enorme variatie aan karakters en scenario\'s. De group chat feature is heel creatief. Aanrader voor wie iets nieuws zoekt.',
  },
  {
    name: 'Stefan B.',
    avatar: 'S',
    rating: 5,
    text: 'Discreet, veilig en de kwaliteit is top. De imagine-functie maakt het helemaal compleet. Beste investering dit jaar.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Is XXX-Tales gratis te gebruiken?',
    a: 'Ja! Je kunt gratis beginnen met een beperkt aantal berichten per dag. Met een VIP-abonnement krijg je onbeperkt toegang tot alle karakters, verhalen, audio en premium functies. Je kunt ook 3 dagen gratis VIP proberen zonder creditcard.',
  },
  {
    q: 'Hoe werkt de AI precies?',
    a: 'Onze AI maakt gebruik van geavanceerde taalmodellen die speciaal zijn afgestemd op creatief schrijven en rollenspel. Elk karakter heeft een unieke persoonlijkheid en stijl, en de AI past zich aan op jouw voorkeuren en scenario\'s.',
  },
  {
    q: 'Is mijn privacy beschermd?',
    a: 'Absoluut. Al je gesprekken worden lokaal op je apparaat opgeslagen en worden niet gedeeld met derden. We slaan geen chatgeschiedenis op onze servers op. Je kunt op elk moment al je data verwijderen.',
  },
  {
    q: 'Kan ik mijn abonnement opzeggen?',
    a: 'Ja, je kunt je VIP-abonnement op elk moment opzeggen. Er zijn geen verborgen kosten of langetermijnverplichtingen. Na opzegging behoud je toegang tot het einde van je betaalperiode.',
  },
  {
    q: 'Welke functies zijn er beschikbaar?',
    a: 'XXX-Tales biedt: 1-op-1 chat met 40+ karakters, group chats, AI-gegenereerde erotische verhalen met audio, een Imagine-functie voor visuele content, live voice chat, en een Solo Coach modus. VIP-leden krijgen toegang tot alles.',
  },
];

interface LandingPageProps {
  authScreen: 'login' | 'register';
  setAuthScreen: (screen: 'login' | 'register') => void;
  handleAuthSubmit: (e: React.FormEvent) => void;
  handleGoogleLogin: () => void;
  isAgeAccepted: boolean;
  setIsAgeAccepted: (val: boolean) => void;
  authName: string;
  setAuthName: (val: string) => void;
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  authLoading: boolean;
  authError: string;
  onOpenLegal: (tab: 'privacy' | 'terms') => void;
}

const FAQItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-zinc-900/40 hover:border-white/20 transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left"
      >
        <span className="text-white font-bold text-sm md:text-base pr-4">{q}</span>
        <div className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
          <Icons.ChevronDown className="text-zinc-400" size={20} />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="px-5 md:px-6 pb-5 md:pb-6 text-zinc-400 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
};

const LandingPage: React.FC<LandingPageProps> = ({
  authScreen,
  setAuthScreen,
  handleAuthSubmit,
  handleGoogleLogin,
  isAgeAccepted,
  setIsAgeAccepted,
  authName,
  setAuthName,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authLoading,
  authError,
  onOpenLegal
}) => {
  
    const [videoIdx, setVideoIdx] = useState(0);
    const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
    const videoARef = useRef<HTMLVideoElement>(null);
    const videoBRef = useRef<HTMLVideoElement>(null);

    const advanceVideo = useCallback(() => {
      setVideoIdx(prev => {
        const next = (prev + 1) % LANDING_VIDEOS.length;
        const incoming = activeSlot === 0 ? videoBRef.current : videoARef.current;
        if (incoming) {
          incoming.src = LANDING_VIDEOS[next];
          incoming.load();
          incoming.play().catch(() => {});
        }
        setActiveSlot(s => (s === 0 ? 1 : 0) as 0 | 1);
        return next;
      });
    }, [activeSlot]);

    useEffect(() => {
      const timer = setInterval(advanceVideo, 8000);
      return () => clearInterval(timer);
    }, [advanceVideo]);

    const scrollToForm = () => {
      if (authScreen === 'login') setAuthScreen('register');
      const formElement = document.getElementById('auth-form');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const scrollToFeatures = () => {
      const el = document.getElementById('features');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    return (
      <div className="h-full w-full bg-black overflow-y-auto no-scrollbar relative flex flex-col">
        {/* Background Video Crossfade */}
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black z-10" />
            <video 
              ref={videoARef}
              src={LANDING_VIDEOS[0]} 
              autoPlay loop muted playsInline 
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
              style={{ opacity: activeSlot === 0 ? 0.6 : 0 }}
            />
            <video 
              ref={videoBRef}
              muted playsInline loop
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms]"
              style={{ opacity: activeSlot === 1 ? 0.6 : 0 }}
            />
        </div>

      {/* Navbar */}
      <nav className="relative z-50 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <img src="https://storage.googleapis.com/foto1982/logo.jpeg" className="w-10 h-10 rounded-lg border border-gold-500/30 object-cover shadow-lg" alt="Logo" />
            <span className="font-headline font-black text-xl text-shine tracking-tighter hidden md:block">XXX-Tales</span>
        </div>
        <div className="flex gap-4">
             {authScreen === 'register' ? (
                 <button onClick={() => setAuthScreen('login')} className="px-6 py-2 rounded-full border border-white/10 bg-black/40 text-xs font-bold text-white hover:text-gold-500 hover:border-gold-500/50 uppercase tracking-widest transition-all backdrop-blur-md">Inloggen</button>
             ) : (
                 <button onClick={scrollToForm} className="px-6 py-2 btn-premium rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Aanmelden</button>
             )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-40 flex flex-col items-center justify-center px-4 pt-10 pb-20 w-full max-w-5xl mx-auto text-center mt-8 md:mt-16">
          
          <div className="space-y-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-950/30 backdrop-blur-md mb-2 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                 <Icons.Lock size={12} className="text-red-500" />
                 <span className="text-[10px] font-black text-red-200 uppercase tracking-[0.2em]">18+ Exclusief Platform</span>
             </div>
             
             <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                Ontdek Jouw <br className="md:hidden" /> <span className="text-red-600 inline-block filter drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]">Geheime</span> <br />
                <span className="text-red-600 filter drop-shadow-[0_0_25px_rgba(220,38,38,0.6)]">Verlangens</span>
             </h1>
             
             <p className="max-w-2xl mx-auto text-zinc-300 text-sm md:text-lg leading-relaxed font-body font-medium">
                Ongecensureerde AI-gestuurde erotische verhalen en intieme rollenspellen met 40+ verleidelijke karakters. Ervaar fantasieën die tot leven komen.
             </p>
             
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button onClick={scrollToForm} className="w-full sm:w-auto px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95">
                    Start Gratis
                </button>
                <button onClick={scrollToFeatures} className="w-full sm:w-auto px-12 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-white rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest backdrop-blur-md transition-all active:scale-95">
                    Ontdek Meer
                </button>
             </div>
          </div>

          {/* Social Proof Bar */}
          <div className="w-full max-w-2xl mx-auto mb-16 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2">
              <Icons.Users className="text-gold-500" size={20} />
              <div className="text-left">
                <p className="text-white font-black text-lg leading-tight">10.000+</p>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Gebruikers</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <Icons.Star className="text-gold-500" size={20} />
              <div className="text-left">
                <p className="text-white font-black text-lg leading-tight">4.8 / 5</p>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Beoordeling</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden md:block" />
            <div className="flex items-center gap-2">
              <Icons.MessageCircle className="text-gold-500" size={20} />
              <div className="text-left">
                <p className="text-white font-black text-lg leading-tight">1M+</p>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Berichten</p>
              </div>
            </div>
          </div>

        {/* Auth Form */}
        <div id="auth-form" className="w-full max-w-md mx-auto glass-premium p-8 md:p-10 rounded-[2.5rem] border-gold-500/30 shadow-2xl animate-in zoom-in-95 duration-500 relative bg-black/40 backdrop-blur-xl">
               {/* Error Message */}
               {authError && (
                 <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs text-center font-medium">
                   {authError}
                 </div>
               )}

               {/* Google Button */}
               <button
                 type="button"
                 onClick={handleGoogleLogin}
                 className="w-full h-12 mb-6 flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 rounded-xl transition-colors"
               >
                 <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                   <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                   <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                   <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                 </svg>
                 <span className="text-zinc-800 font-bold text-sm">Doorgaan met Google</span>
               </button>
               
               <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">OF MET E-MAIL</span>
                    <div className="h-px bg-white/10 flex-1"></div>
               </div>

               <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                    {authScreen === 'register' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <div className="relative group">
                                <Icons.User className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={18} />
                                <input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Gebruikersnaam" className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-gold-500/50 transition-colors placeholder-zinc-600" required />
                            </div>
                            
                            <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setIsAgeAccepted(!isAgeAccepted)}>
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${isAgeAccepted ? 'bg-gold-500 border-gold-500 text-black' : 'border-zinc-600 bg-black'}`}>
                                    {isAgeAccepted && <Icons.Check size={14} strokeWidth={4} />}
                                </div>
                                <span className="text-[11px] text-zinc-400 select-none leading-tight mt-0.5">Ik bevestig dat ik <span className="text-white font-bold">18 jaar of ouder</span> ben en akkoord ga met de voorwaarden.</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="relative group">
                        <Icons.Mail className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={18} />
                        <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="E-mailadres" className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-gold-500/50 transition-colors placeholder-zinc-600" required />
                    </div>

                    <div className="relative group">
                        <Icons.Lock className="absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={18} />
                        <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Wachtwoord (min. 6 tekens)" minLength={6} className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm outline-none focus:border-gold-500/50 transition-colors placeholder-zinc-600" required />
                    </div>

                    <button type="submit" disabled={authLoading} className="w-full py-4 btn-premium rounded-xl font-black text-[11px] uppercase tracking-widest mt-4 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
                        {authLoading ? 'EVEN GEDULD...' : authScreen === 'register' ? 'Maak Gratis Account' : 'Inloggen'}
                    </button>
               </form>
               
               <button onClick={() => setAuthScreen(authScreen === 'login' ? 'register' : 'login')} className="mt-8 text-[10px] text-zinc-500 uppercase font-black tracking-widest hover:text-gold-500 transition-colors w-full text-center">
                    {authScreen === 'login' ? 'Nieuw hier? Maak een account aan' : 'Heb je al een account? Log in'}
               </button>
               
               <div className="flex justify-center gap-6 mt-8 pt-6 border-t border-white/10">
                   <button onClick={() => onOpenLegal('privacy')} className="text-[9px] text-zinc-600 hover:text-zinc-300 uppercase font-bold tracking-widest transition-colors">Privacybeleid</button>
                   <button onClick={() => onOpenLegal('terms')} className="text-[9px] text-zinc-600 hover:text-zinc-300 uppercase font-bold tracking-widest transition-colors">Voorwaarden</button>
               </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-40 bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
                <h2 className="text-3xl md:text-5xl font-headline font-black text-white">Wat Maakt XXX-Tales <span className="text-gold-500">Uniek</span>?</h2>
                <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">Premium AI-technologie voor jouw meest persoonlijke fantasieën</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-8 hover:border-red-500/50 transition-all group hover:bg-zinc-900/60">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                        <Icons.Flame className="text-red-500" size={32} />
                    </div>
                    <h3 className="text-xl font-headline font-bold text-white mb-4">40+ Karakters</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">Kies uit een diverse collectie van verleidelijke persoonlijkheden, elk met unieke fantasieën en verlangens die wachten om ontdekt te worden.</p>
                </div>

                {/* Feature 2 */}
                <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-8 hover:border-gold-500/50 transition-all group hover:bg-zinc-900/60">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-900/10 border border-gold-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                        <Icons.Sparkles className="text-gold-500" size={32} />
                    </div>
                    <h3 className="text-xl font-headline font-bold text-white mb-4">AI Rollenspel</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">Intieme real-time gesprekken waar karakters intelligent reageren op jouw diepste verlangens, zonder censuur of oordeel.</p>
                </div>

                {/* Feature 3 */}
                <div className="bg-zinc-900/40 border border-white/10 rounded-[2rem] p-8 hover:border-pink-500/50 transition-all group hover:bg-zinc-900/60">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/10 to-pink-900/10 border border-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(236,72,153,0.1)]">
                        <Icons.Heart className="text-pink-500" size={32} />
                    </div>
                    <h3 className="text-xl font-headline font-bold text-white mb-4">Verhaal Generatie</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">Laat de AI unieke, gepersonaliseerde erotische verhalen schrijven op basis van jouw specifieke scenario's, kinks en favoriete karakters.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-40 bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/20 bg-gold-500/5 mb-2">
              <Icons.Quote size={12} className="text-gold-500" />
              <span className="text-[10px] font-black text-gold-200 uppercase tracking-[0.2em]">Reviews</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-headline font-black text-white">
              Wat Onze <span className="text-gold-500">Leden</span> Zeggen
            </h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] font-bold">
              Duizenden tevreden gebruikers gingen je voor
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-gold-500/30 transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-black text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{t.name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Icons.Star
                          key={si}
                          size={14}
                          className={si < t.rating ? 'text-gold-500 fill-gold-500' : 'text-zinc-700'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-40 bg-black py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-2">
              <Icons.HelpCircle size={12} className="text-zinc-400" />
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">FAQ</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-headline font-black text-white">
              Veelgestelde <span className="text-gold-500">Vragen</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>

          {/* CTA after FAQ */}
          <div className="mt-16 text-center">
            <p className="text-zinc-400 text-sm mb-6">Nog vragen? Begin gewoon — het is gratis.</p>
            <button
              onClick={scrollToForm}
              className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105 active:scale-95"
            >
              Start Nu Gratis
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 py-10 text-center border-t border-white/5 bg-black">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">&copy; 2026 XXX-Tales AI. Alle rechten voorbehouden.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
