
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { Character, Language } from '../types';
import Icons from './Icon';
import { getTexts } from '../constants';

interface CharacterSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  selectedCharacterId: string;
  onSelect: (characters: Character | Character[]) => void;
  onToggleSidebar?: () => void;
  language?: Language;
  favoriteIds?: string[];
  onToggleFavorite?: (charId: string) => void;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({ isOpen, onClose, characters, selectedCharacterId, onSelect, onToggleSidebar, language = 'nl', favoriteIds = [], onToggleFavorite }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const t = getTexts(language as string).gallery;
  
  const ambientVideo = useMemo(() => {
    const videoChars = characters.filter(c => c.video);
    return videoChars.length > 0 ? videoChars[Math.floor(Math.random() * videoChars.length)].video : null;
  }, [characters]);

  useEffect(() => {
    if (!isMultiSelect) setSelectedIds([]);
  }, [isMultiSelect]);

  const handleCardClick = (char: Character) => {
    if (isMultiSelect) {
      setSelectedIds(prev => 
        prev.includes(char.id) 
          ? prev.filter(id => id !== char.id) 
          : [...prev, char.id]
      );
    } else {
      onSelect(char);
    }
  };

  const handleStartGroup = () => {
    const selectedChars = characters.filter(c => selectedIds.includes(c.id));
    if (selectedChars.length > 0) {
      onSelect(selectedChars);
      setIsMultiSelect(false);
      setSelectedIds([]);
    }
  };

      if (!isOpen) return null;

      // Sort: favorites first, then filter by search
      const sortedCharacters = useMemo(() => {
        let filtered = characters;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
            filtered = characters.filter(c => 
              c.name.toLowerCase().includes(q) || 
              c.desc?.toLowerCase().includes(q) || 
              (Array.isArray(c.personality) ? c.personality.join(' ').toLowerCase().includes(q) : c.personality?.toLowerCase().includes(q)) ||
              c.voiceStyle?.toLowerCase().includes(q)
            );
        }
        if (favoriteIds.length === 0) return filtered;
        const favs = filtered.filter(c => favoriteIds.includes(c.id));
        const rest = filtered.filter(c => !favoriteIds.includes(c.id));
        return [...favs, ...rest];
      }, [characters, favoriteIds, searchQuery]);

      const isLoading = characters.length === 0;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {ambientVideo && (
        <div className="absolute inset-0 z-0">
            <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        </div>
      )}

      <div className="relative z-50 p-6 flex flex-col gap-3 pt-safe">
          <div className="flex items-center justify-between">
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <h2 className="text-3xl font-headline font-black text-shine uppercase tracking-tighter">{t.title}</h2>
                <p className="text-gold-500/90 text-[10px] uppercase font-black tracking-widest mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => setIsMultiSelect(!isMultiSelect)}
                  className={`p-3 rounded-full border backdrop-blur-md transition-all ${isMultiSelect ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/5 text-zinc-300 border-white/20'}`}
               >
                  {isMultiSelect ? <Icons.Check size={20} /> : <Icons.User size={20} />}
               </button>
               {onToggleSidebar && (
                  <button onClick={onToggleSidebar} className="md:hidden p-3 text-gold-500 bg-white/5 rounded-full border border-gold-500/20 active:scale-90 transition-all shadow-lg backdrop-blur-md">
                      <Icons.Menu size={24} />
                  </button>
               )}
            </div>
          </div>
          <div className="relative">
            <Icons.Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'nl' ? 'Zoek karakter...' : language === 'de' ? 'Charakter suchen...' : language === 'fr' ? 'Chercher...' : language === 'es' ? 'Buscar...' : language === 'it' ? 'Cerca...' : 'Search character...'}
              className="w-full bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white text-sm placeholder-zinc-500 focus:border-gold-500/50 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <Icons.X size={16} />
              </button>
            )}
          </div>
      </div>

      <div ref={containerRef} className="flex-1 scroll-container no-scrollbar h-full z-10 relative">
          <div className="max-w-md mx-auto px-4 space-y-12 py-8 pb-48">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="relative w-full aspect-[3/4] rounded-[3rem] overflow-hidden bg-zinc-900 animate-pulse">
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-800 via-zinc-900 to-zinc-800" />
                      <div className="absolute bottom-8 left-8 right-8 space-y-3">
                        <div className="h-2 w-16 rounded-full bg-zinc-700" />
                        <div className="h-8 w-40 rounded-xl bg-zinc-700" />
                        <div className="h-3 w-full rounded-full bg-zinc-800" />
                        <div className="h-3 w-3/4 rounded-full bg-zinc-800" />
                      </div>
                    </div>
                  ))
                : sortedCharacters.map((char) => (
                    <MemoizedCharacterCard 
                      key={char.id} 
                      char={char} 
                      isSelected={selectedCharacterId === char.id || selectedIds.includes(char.id)} 
                      onSelect={() => handleCardClick(char)}
                      selectionMode={isMultiSelect}
                      connectText={t.connect}
                      onlineText={t.online}
                      ownText={t.own_creation}
                      isFavorite={favoriteIds.includes(char.id)}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))
              }
          </div>
      </div>

      {isMultiSelect && selectedIds.length > 0 && (
        <div className="absolute bottom-10 left-0 right-0 p-6 z-50 animate-in slide-in-from-bottom-10">
            <button 
                onClick={handleStartGroup}
                className="w-full max-w-md mx-auto py-5 btn-premium rounded-[2rem] text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl"
            >
                <Icons.MessageSquare size={20} />
                <span>{t.start_group} ({selectedIds.length})</span>
            </button>
        </div>
      )}
    </div>
  );
};

const CharacterCard: React.FC<{ char: Character; isSelected: boolean; onSelect: () => void; selectionMode: boolean; connectText: string; onlineText: string; ownText: string; isFavorite?: boolean; onToggleFavorite?: (id: string) => void }> = ({ char, isSelected, onSelect, selectionMode, connectText, onlineText, ownText, isFavorite, onToggleFavorite }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVoicePlaying, setIsVoicePlaying] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (videoRef.current) {
                    if (entry.isIntersecting) {
                        videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => setIsVideoPlaying(false));
                    } else {
                        videoRef.current.pause();
                        setIsVideoPlaying(false);
                    }
                }
            });
        }, { threshold: 0.2 });
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    const handleClick = () => {
        setIsAnimating(true); 
        onSelect(); 
        setTimeout(() => setIsAnimating(false), 500);
    }

    return (
        <div ref={cardRef} onClick={handleClick} className={`relative w-full aspect-[3/4] rounded-[3rem] overflow-hidden border-2 transition-all duration-700 active:scale-[0.98] group ${isAnimating ? 'animate-character-select' : ''} ${isSelected ? 'border-gold-500 shadow-[0_0_40px_rgba(255,215,0,0.6)] scale-[1.03]' : 'border-white/10 shadow-2xl hover:border-white/30'}`}>
            <img src={char.avatar} alt={char.name} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${char.video && isVideoPlaying ? 'opacity-0' : 'opacity-100'}`} loading="lazy" />
            {char.video && <video ref={videoRef} src={char.video} muted loop playsInline preload="none" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isVideoPlaying ? 'opacity-100' : 'opacity-0'}`} />}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-60" />
            
            {selectionMode && (
                <div className={`absolute top-6 right-6 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-gold-500 border-gold-500' : 'bg-black/40 border-white/50'}`}>
                    {isSelected && <Icons.Check size={16} className="text-black" strokeWidth={4} />}
                </div>
            )}

            {!selectionMode && onToggleFavorite && (
                <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                  <button
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      if (isVoicePlaying) return;
                      setIsVoicePlaying(true);
                      try {
                        const { speakWithDeepgram, stopSpeaking } = await import('../services/deepgramTTS');
                        stopSpeaking();
                        const previewText = `Hoi, ik ben ${char.name}. Luister naar mijn stem.`;
                        await speakWithDeepgram(previewText, char.id, char.voiceStyle);
                      } catch (err) {
                        console.error('Voice preview failed:', err);
                      } finally {
                        setIsVoicePlaying(false);
                      }
                    }}
                    className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${isVoicePlaying ? 'bg-gold-500/30 border border-gold-500 animate-pulse' : 'bg-black/40 border border-white/20 hover:border-gold-500/50'}`}
                  >
                    <Icons.Volume2 size={16} className={isVoicePlaying ? 'text-gold-500' : 'text-white/60'} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(char.id); }}
                    className={`p-2 rounded-full backdrop-blur-md transition-all active:scale-90 ${isFavorite ? 'bg-gold-500/20 border border-gold-500' : 'bg-black/40 border border-white/20 hover:border-gold-500/50'}`}
                  >
                    <Icons.Star size={18} className={isFavorite ? 'text-gold-500 fill-gold-500' : 'text-white/60'} />
                  </button>
                </div>
            )}

            {isFavorite && (
              <div className="absolute top-6 left-6 z-20 bg-gold-500 text-black px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase">
                FAV
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-8 z-10 pointer-events-none">
                <div className="flex items-center gap-2 mb-3"><div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div><span className="text-[10px] font-black text-white uppercase tracking-widest">{onlineText}</span>{char.isCustom && <div className="bg-gold-500 text-black px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest ml-auto animate-pulse">{ownText}</div>}</div>
                <h3 className="text-4xl font-headline font-black text-white uppercase tracking-tighter leading-none group-hover:text-gold-500 transition-colors drop-shadow-xl">{char.name}</h3>
                <p className="text-zinc-200 text-[12px] italic line-clamp-2 mt-3 leading-relaxed drop-shadow-md">"{char.desc}"</p>
                {!selectionMode && <div className="mt-6 flex items-center gap-2"><button className="flex-1 pointer-events-auto py-3 bg-gold-500 text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl group-hover:bg-white transition-colors">{connectText}</button></div>}
            </div>
        </div>
    );
};

const MemoizedCharacterCard = memo(CharacterCard);
export default CharacterSelector;
