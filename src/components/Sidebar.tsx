
import React, { useState } from 'react';
import { ModelConfig, AppMode, ChatSession, UserProfile, Language, SavedStory } from '../types';
import { TEXTS, AFFILIATE_BANNERS, SUPPORTED_LANGUAGES, getLanguageFlag, getTexts, getAffiliateLinks } from '../constants';
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
  onClearChat,
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
    onOpenPaywall,
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
  const t = getTexts(language).sidebar;
  const affiliateLinks = getAffiliateLinks(language as string);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] md:hidden animate-in fade-in duration-300" onClick={onClose} />}
      <div className={`fixed inset-y-0 left-0 z-[70] w-64 bg-black border-r border-gold-500/30 transform transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,1)] flex flex-col`}>
        <div className="p-5 border-b border-gold-500/20 bg-black relative overflow-hidden flex-shrink-0 pt-safe">
          <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 via-transparent to-transparent"></div>
          <div className="flex items-center gap-3 relative z-10">
            <img src="https://storage.googleapis.com/foto1982/logo.jpeg" alt="Logo" className="h-10 w-10 object-cover logo-glow rounded-xl border border-gold-500/20 shadow-lg" />
            <h1 className="text-xl font-headline font-black text-shine tracking-tighter">XXX-Tales</h1>
          </div>
        </div>
        
        <div className="p-4 border-b border-gold-500/20 bg-zinc-950/40 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border border-gold-500/60 object-cover" />
                <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-xs truncate">{user.name}</p>
                    <div className="flex items-center gap-2">
                        <Icons.Sparkles size={8} className="text-gold-500" />
                        <span className="text-gold-500 text-[9px] font-black uppercase tracking-widest">{user.credits} {t.credits}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowLanguages(!showLanguages)} className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-lg hover:border-gold-500 transition-colors">
                      {getLanguageFlag(language)}
                  </button>
                  <button onClick={onLogout} className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-red-900/30 hover:border-red-500/50 transition-colors" title="Log uit">
                      <Icons.LogOut size={14} />
                  </button>
                </div>
            </div>
            {user.isPremium ? (
              <div className="w-full py-2 btn-premium font-black uppercase tracking-widest rounded-xl text-[9px] text-center">
                {t.vip_member}
                {user.vipExpiresAt && (
                  <span className="block text-[7px] text-gold-300/60 mt-0.5 normal-case font-medium">
                    {new Date(user.vipExpiresAt) > new Date() ? `tot ${new Date(user.vipExpiresAt).toLocaleDateString()}` : ''}
                  </span>
                )}
              </div>
            ) : (
              <button onClick={() => { onStartTrial(); onClose(); }} className="w-full py-2 btn-premium font-black uppercase tracking-widest rounded-xl text-[9px]">
                {t.start_trial}
              </button>
            )}
        </div>

        {/* Language Modal */}
        {showLanguages && (
            <div className="p-4 bg-zinc-900 border-b border-gold-500/20 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-3 gap-2">
                    {SUPPORTED_LANGUAGES.map(lang => (
                        <button 
                            key={lang.code}
                            onClick={() => { onSelectLanguage(lang.code); setShowLanguages(false); }}
                            className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${language === lang.code ? 'bg-gold-500/20 border-gold-500' : 'bg-black border-white/5 hover:border-white/20'}`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <span className="text-[8px] font-bold text-zinc-300 uppercase">{lang.code}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar flex flex-col">
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => { onModeChange(AppMode.AUDIO_STORIES); onClose(); }}
              className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${mode === AppMode.AUDIO_STORIES ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:border-gold-500/30'}`}
            >
                <Icons.Mic size={20} />
                <span className="text-[8px] font-black mt-1 uppercase">{t.audio}</span>
            </button>
            <button 
              onClick={() => { onModeChange(AppMode.LIVE); onClose(); }}
              className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${mode === AppMode.LIVE ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:border-gold-500/30'}`}
            >
                <Icons.Video size={20} />
                <span className="text-[8px] font-black mt-1 uppercase">{t.live_call}</span>
            </button>
          </div>
          
          {/* NEW SOLO COACH BUTTON */}
          <button 
              onClick={() => { onModeChange(AppMode.SOLO_COACH); onClose(); }}
              className={`w-full flex items-center justify-center gap-3 p-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] transition-all ${mode === AppMode.SOLO_COACH ? 'bg-purple-900/30 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:border-purple-500/30'}`}
          >
              <Icons.Zap size={16} fill={mode === AppMode.SOLO_COACH ? "currentColor" : "none"} />
              {t.solo_coach}
          </button>

          <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { onModeChange(AppMode.IMAGINE); onClose(); }}
                className={`flex flex-col items-center p-3 rounded-2xl border font-black uppercase tracking-widest text-[8px] transition-all ${mode === AppMode.IMAGINE ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500'}`}
              >
                  <Icons.Sparkles size={18} />
                  {t.visualizer}
              </button>
              <button 
                onClick={() => { onModeChange(AppMode.VIDEOS); onClose(); }}
                className={`flex flex-col items-center p-3 rounded-2xl border font-black uppercase tracking-widest text-[8px] transition-all ${mode === AppMode.VIDEOS ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-zinc-900/60 border-white/5 text-zinc-500'}`}
              >
                  <Icons.Play size={18} />
                  {t.find_video}
              </button>
          </div>

          {/* CHATS SECTION */}
          <div className="space-y-1">
              <span className="px-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.chats}</span>
              <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                  {savedSessions.map(session => (
                      <div key={session.id} className="relative group">
                          <button onClick={() => { onLoadSession(session); onClose(); }} className={`w-full flex items-center gap-2 p-2 rounded-xl border pr-8 ${activeSessionId === session.id ? 'bg-gold-500/10 border-gold-500/40 text-gold-200' : 'bg-zinc-900/40 border-transparent text-zinc-400'}`}>
                              <Icons.MessageSquare size={12} />
                              <p className="text-[10px] font-bold truncate tracking-tight flex-1 text-left">{session.title}</p>
                              <div onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }} className="text-zinc-600 hover:text-red-500 p-1"><Icons.Trash2 size={10} /></div>
                          </button>
                      </div>
                  ))}
                  {savedSessions.length === 0 && <p className="px-2 text-[10px] text-zinc-600 italic">{t.no_chats}</p>}
              </div>
          </div>

          {/* STORIES SECTION */}
          <div className="space-y-1">
              <span className="px-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.stories}</span>
              <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar">
                  {savedStories.map(story => (
                      <div key={story.id} className="relative group">
                          <button onClick={() => { onLoadStory(story); onClose(); }} className={`w-full flex items-center gap-2 p-2 rounded-xl border pr-8 ${activeStoryId === story.id ? 'bg-gold-500/10 border-gold-500/40 text-gold-200' : 'bg-zinc-900/40 border-transparent text-zinc-400'}`}>
                              <Icons.BookOpenCheck size={12} />
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-[10px] font-bold truncate tracking-tight">{story.title || "Naamloos Verhaal"}</p>
                              </div>
                              {onDeleteStory && (
                                <div onClick={(e) => { e.stopPropagation(); onDeleteStory(story.id); }} className="text-zinc-600 hover:text-red-500 p-1">
                                    <Icons.Trash2 size={10} />
                                </div>
                              )}
                          </button>
                      </div>
                  ))}
                  {savedStories.length === 0 && <p className="px-2 text-[10px] text-zinc-600 italic">{t.no_stories}</p>}
              </div>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
               <button onClick={() => { onModeChange(AppMode.GALLERY); onClose(); }} className={`flex items-center justify-center gap-3 p-3 rounded-2xl border font-black uppercase tracking-widest text-[10px] ${mode === AppMode.GALLERY ? 'btn-premium' : 'bg-zinc-900/60 border-white/5 text-zinc-500'}`}>
                  <Icons.Heart size={16} fill={mode === AppMode.GALLERY ? "currentColor" : "none"} />
                  {t.discover}
               </button>
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { onModeChange(AppMode.CHAT); onClose(); }} className={`flex flex-col items-center p-2 rounded-2xl border ${mode === AppMode.CHAT ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-zinc-900/60 text-zinc-500'}`}>
                      <Icons.MessageSquare size={16} />
                      <span className="text-[8px] uppercase font-black mt-1">{t.chat}</span>
                  </button>
                  <button 
                    onClick={() => { 
                        if (onResetActiveStory) onResetActiveStory(); 
                        onModeChange(AppMode.STORY); 
                        onClose(); 
                    }} 
                    className={`flex flex-col items-center p-2 rounded-2xl border ${mode === AppMode.STORY ? 'bg-gold-500/10 border-gold-500 text-gold-400' : 'bg-zinc-900/60 text-zinc-500'}`}
                  >
                      <Icons.BookOpenCheck size={16} />
                      <span className="text-[8px] uppercase font-black mt-1">{t.story}</span>
                  </button>
               </div>
          </div>

          <div className="pt-4 mt-auto space-y-4 border-t border-gold-500/20">
              <span className="px-2 text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t.offers}</span>
              
              {/* Affiliate Banners */}
              <div className="space-y-3 px-1">
                {AFFILIATE_BANNERS.map((banner, i) => (
                  <a key={i} href={banner.link} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border border-gold-500/30 hover:border-gold-500 transition-all shadow-lg active:scale-95">
                    <img src={banner.img} alt="Offer" className="w-full h-auto object-cover" />
                  </a>
                ))}
              </div>

              <div className="space-y-1">
                {affiliateLinks.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block px-3 py-2 bg-zinc-900/40 border border-white/5 rounded-xl text-[10px] font-bold text-gold-500 hover:bg-gold-500/10 hover:border-gold-500/30 transition-all text-center uppercase tracking-wider"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Legal Links Footer */}
              <div className="flex justify-center gap-4 py-2 border-t border-white/5 mt-2">
                 <button onClick={() => { onOpenLegal('privacy'); onClose(); }} className="text-[9px] text-zinc-600 hover:text-gold-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Icons.ShieldCheck size={10} /> Privacy
                 </button>
                 <button onClick={() => { onOpenLegal('terms'); onClose(); }} className="text-[9px] text-zinc-600 hover:text-gold-500 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Icons.Scale size={10} /> Voorwaarden
                 </button>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;