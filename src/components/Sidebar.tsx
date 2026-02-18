
import React, { useState } from 'react';
import { ModelConfig, AppMode, ChatSession, UserProfile, Language, SavedStory } from '../types';
import { AFFILIATE_BANNERS, SUPPORTED_LANGUAGES, getLanguageFlag, getTexts, getAffiliateLinks } from '../constants';
import Icons from './Icon';

interface SidebarProps {
  config: ModelConfig;
  onConfigChange: (config: ModelConfig) => void;
  onClearChat: () => void;
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  savedSessions: ChatSession[];
  savedStories: SavedStory[];
  onLoadSession: (session: ChatSession) => void;
  onLoadStory: (story: SavedStory) => void;
  onDeleteSession: (id: string) => void;
  onDeleteStory?: (id: string) => void;
  user: UserProfile;
  onOpenPaywall: () => void;
  onStartTrial: () => void;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onLogout: () => void;
  activeSessionId?: string;
  activeStoryId?: string;
  onResetActiveStory?: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms') => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  savedSessions,
  savedStories,
  onLoadSession,
  onLoadStory,
  onDeleteSession,
  onDeleteStory,
  user,
  onStartTrial,
  language,
  onSelectLanguage,
  onLogout,
  activeSessionId,
  activeStoryId,
  onResetActiveStory,
  onOpenLegal
}) => {
  const [showLanguages, setShowLanguages] = useState(false);
  const [showDealsSheet, setShowDealsSheet] = useState(false);
  const t = getTexts(language).sidebar;
  const affiliateLinks = getAffiliateLinks(language as string);

  const navItems = [
    { id: AppMode.GALLERY,    icon: Icons.Heart,         label: t.discover },
    { id: AppMode.CHAT,       icon: Icons.MessageSquare, label: t.chat },
    { id: AppMode.STORY,      icon: Icons.BookOpenCheck,  label: t.story },
    { id: AppMode.IMAGINE,    icon: Icons.Sparkles,       label: t.visualizer },
    { id: AppMode.LAB,        icon: Icons.Zap,            label: 'Lab' },
    { id: AppMode.LIVE,       icon: Icons.Video,          label: t.live_call },
    { id: AppMode.SOLO_COACH, icon: Icons.Zap,            label: t.solo_coach },
  ];

  const handleNav = (m: AppMode) => {
    if (m === AppMode.STORY && onResetActiveStory) onResetActiveStory();
    onModeChange(m);
    onClose();
  };

  const creatorLabel: Record<string, string> = {
    nl: 'Creëer Partner', de: 'Partner Erstellen', fr: 'Créer Partenaire',
    es: 'Crear Pareja', it: 'Crea Partner', en: 'Create Partner'
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] md:hidden animate-in fade-in duration-300" onClick={onClose} />
      )}

      <div className={`fixed inset-y-0 left-0 z-[70] w-60 bg-[#0a0a0a] border-r border-white/[0.07] transform transition-transform duration-400 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 flex flex-col shadow-2xl`}>

        {/* HEADER */}
        <div className="px-4 pt-safe pb-3 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5 mb-3 pt-4">
            <img src="https://storage.googleapis.com/foto1982/logo.jpeg" alt="Logo" className="h-8 w-8 rounded-xl border border-gold-500/20 object-cover" />
            <h1 className="text-base font-black text-shine tracking-tighter">XXX-Tales</h1>
          </div>

          <div className="flex items-center gap-2">
            <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-gold-500/40 object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[11px] truncate leading-tight">{user.name}</p>
              <p className="text-gold-500 text-[9px] font-black uppercase tracking-widest leading-tight">
                {user.credits} {t.credits}{user.isPremium ? ' · VIP' : ''}
              </p>
            </div>
            <button onClick={() => setShowLanguages(v => !v)} className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-sm hover:border-gold-500 transition-colors">
              {getLanguageFlag(language)}
            </button>
            <button onClick={onLogout} className="w-7 h-7 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-red-900/30 hover:border-red-500/40 transition-colors" title="Logout">
              <Icons.LogOut size={12} />
            </button>
          </div>

          {showLanguages && (
            <div className="mt-3 grid grid-cols-3 gap-1.5 animate-in slide-in-from-top-2 duration-200">
              {SUPPORTED_LANGUAGES.map(lang => (
                <button key={lang.code} onClick={() => { onSelectLanguage(lang.code as Language); setShowLanguages(false); }}
                  className={`p-1.5 rounded-xl border flex flex-col items-center gap-0.5 transition-all ${language === lang.code ? 'bg-gold-500/20 border-gold-500' : 'bg-zinc-900 border-white/5 hover:border-white/20'}`}>
                  <span className="text-lg leading-none">{lang.flag}</span>
                  <span className="text-[8px] font-bold text-zinc-300 uppercase">{lang.code}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3">
            {user.isPremium ? (
              <div className="w-full py-1.5 btn-premium font-black uppercase tracking-widest rounded-xl text-[9px] text-center">
                VIP{user.vipExpiresAt && new Date(user.vipExpiresAt) > new Date() ? ` · ${new Date(user.vipExpiresAt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ''}
              </div>
            ) : (
              <button onClick={() => { onStartTrial(); onClose(); }} className="w-full py-1.5 btn-premium font-black uppercase tracking-widest rounded-xl text-[9px]">
                {t.start_trial}
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION — 6 items in 2×3 grid */}
        <div className="px-3 py-3 border-b border-white/[0.07] shrink-0">
          <div className="grid grid-cols-2 gap-1.5">
            {navItems.map(({ id, icon: Icon, label }) => {
              const active = mode === id;
              return (
                <button key={id} onClick={() => handleNav(id)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-gold-500/10 border-gold-500/60 text-gold-400' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-gold-500/20 hover:text-zinc-300'}`}>
                  <Icon size={16} fill={active ? 'currentColor' : 'none'} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <button onClick={() => { onModeChange(AppMode.CREATOR); onClose(); }}
            className={`mt-1.5 w-full flex items-center justify-center gap-2 py-2 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${mode === AppMode.CREATOR ? 'bg-pink-900/30 border-pink-500 text-pink-400' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-pink-500/20 hover:text-zinc-300'}`}>
            <Icons.Sparkles size={14} />
            {creatorLabel[language] ?? creatorLabel['en']}
          </button>
        </div>

        {/* RECENTS */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 no-scrollbar">
          <div>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1 mb-1">{t.chats}</p>
            {savedSessions.length === 0 ? (
              <p className="text-[10px] text-zinc-700 italic px-1">{t.no_chats}</p>
            ) : (
              <div className="space-y-0.5 max-h-28 overflow-y-auto no-scrollbar">
                {savedSessions.slice(0, 8).map(session => (
                  <div key={session.id} className="flex items-center gap-1 group">
                    <button onClick={() => { onLoadSession(session); onClose(); }}
                      className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-left transition-all min-w-0 ${activeSessionId === session.id ? 'bg-gold-500/10 text-gold-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'}`}>
                      <Icons.MessageSquare size={10} className="shrink-0" />
                      <p className="text-[10px] font-bold truncate">{session.title}</p>
                    </button>
                    <button onClick={() => onDeleteSession(session.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-red-500 transition-all shrink-0">
                      <Icons.Trash2 size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1 mb-1">{t.stories}</p>
            {savedStories.length === 0 ? (
              <p className="text-[10px] text-zinc-700 italic px-1">{t.no_stories}</p>
            ) : (
              <div className="space-y-0.5 max-h-28 overflow-y-auto no-scrollbar">
                {savedStories.slice(0, 8).map(story => (
                  <div key={story.id} className="flex items-center gap-1 group">
                    <button onClick={() => { onLoadStory(story); onClose(); }}
                      className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-left transition-all min-w-0 ${activeStoryId === story.id ? 'bg-gold-500/10 text-gold-300' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/60'}`}>
                      <Icons.BookOpenCheck size={10} className="shrink-0" />
                      <p className="text-[10px] font-bold truncate">{story.title || 'Verhaal'}</p>
                    </button>
                    {onDeleteStory && (
                      <button onClick={() => onDeleteStory(story.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-700 hover:text-red-500 transition-all shrink-0">
                        <Icons.Trash2 size={9} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-3 py-3 border-t border-white/[0.07] shrink-0 space-y-2">
          <button onClick={() => setShowDealsSheet(true)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-900 border border-gold-500/20 text-gold-500 text-[9px] font-black uppercase tracking-widest hover:bg-gold-500/10 hover:border-gold-500/40 transition-all">
            <Icons.Sparkles size={12} /> {t.offers}
          </button>
          <div className="flex justify-center gap-4">
            <button onClick={() => { onOpenLegal('privacy'); onClose(); }} className="text-[9px] text-zinc-700 hover:text-gold-500 uppercase font-bold tracking-wider flex items-center gap-1 transition-colors">
              <Icons.ShieldCheck size={9} /> Privacy
            </button>
            <button onClick={() => { onOpenLegal('terms'); onClose(); }} className="text-[9px] text-zinc-700 hover:text-gold-500 uppercase font-bold tracking-wider flex items-center gap-1 transition-colors">
              <Icons.Scale size={9} /> Terms
            </button>
          </div>
        </div>
      </div>

      {/* DEALS BOTTOM SHEET */}
      {showDealsSheet && (
        <div className="fixed inset-0 z-[200] flex items-end" onClick={() => setShowDealsSheet(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-auto bg-zinc-950 border border-gold-500/20 rounded-t-3xl p-5 pb-10 animate-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-4" />
            <h2 className="text-center text-sm font-black text-white uppercase tracking-widest mb-4">{t.offers}</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {AFFILIATE_BANNERS.map((banner, i) => (
                <a key={i} href={banner.link} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gold-500/20 hover:border-gold-500 transition-all active:scale-95">
                  <img src={banner.img} alt="Offer" className="w-full h-auto object-cover" />
                </a>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {affiliateLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="py-2 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-bold text-gold-500 hover:bg-gold-500/10 hover:border-gold-500/30 transition-all text-center uppercase tracking-wider">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
