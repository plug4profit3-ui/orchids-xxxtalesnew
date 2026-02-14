
import React, { useState, useMemo } from 'react';
import Icons from './Icon';
import { getCharacters, getTexts, getVideoSearchLinks } from '../constants';
import { Language } from '../types';

const VideoFinder: React.FC<{ language?: Language }> = ({ language = 'nl' }) => {
  const t = getTexts(language as string).video; 
  const searchLinks = getVideoSearchLinks(language as string);
  
  const [keywords, setKeywords] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const ambientVideo = useMemo(() => {
    const chars = getCharacters(language as Language).filter(c => c.video);
    return chars.length > 0 ? chars[Math.floor(Math.random() * chars.length)].video : null;
  }, [language]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywords.trim()) setHasSearched(true);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 md:p-12 no-scrollbar safe-pb relative h-full">
        <div className="absolute inset-0 z-0 pointer-events-none">
            {ambientVideo && <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10 pt-4">
            <div className="text-center mb-10">
                <h2 className="text-4xl md:text-5xl font-headline font-black text-shine uppercase tracking-tighter mb-2">{t.title}</h2>
                <p className="text-gold-500 text-[10px] tracking-[0.4em] uppercase font-black">{t.subtitle}</p>
            </div>

            <div className="glass-premium rounded-[2.5rem] p-6 md:p-10 border-gold-500/30 shadow-2xl backdrop-blur-3xl bg-black/60">
                <form onSubmit={handleSearch} className="space-y-6">
                    <div className="relative group">
                        <Icons.Sparkles className="absolute left-5 top-1/2 -translate-y-1/2 text-gold-500/40" size={20} />
                        <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder={t.placeholder} className="w-full bg-black/80 border-2 border-gold-500/30 focus:border-gold-500 rounded-2xl py-5 pl-14 pr-6 text-white text-lg outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full py-5 btn-premium rounded-2xl text-sm font-black uppercase tracking-[0.3em] active:scale-95">{t.search_btn}</button>
                </form>

                {hasSearched && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 animate-in fade-in slide-in-from-bottom-8">
                          {searchLinks.map(link => (
                                <a key={link.id} href={link.url(keywords)} target="_blank" rel="noopener noreferrer" className={`group block relative bg-zinc-900/50 border-2 ${link.color} rounded-[2rem] overflow-hidden transition-all hover:scale-105 text-left w-full cursor-pointer no-underline`}>
                                    <div className="aspect-video bg-black flex flex-col items-center justify-center p-6 text-center"><span className="text-4xl">{link.icon}</span><h4 className="text-white font-black uppercase text-[10px] tracking-widest mt-2">{link.name}</h4></div>
                                    <div className="p-4 bg-black/90 border-t border-white/5 text-center"><p className="text-gold-500 text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{link.label}</p></div>
                                </a>
                            ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default VideoFinder;
