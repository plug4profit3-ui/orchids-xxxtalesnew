import React, { useState, useEffect } from 'react';
import Icons from './Icon';
import { Language } from '../types';

interface StoryPreview {
  id: string;
  title: string;
  preview: string;
  imageUrl?: string;
  duration: string;
  tags: string[];
}

interface NextStoryPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStory: (storyId: string) => void;
  currentStoryId: string;
  language?: Language;
  userPreferences?: string[];
}

const LABELS: Record<string, {
  title: string;
  subtitle: string;
  continueReading: string;
  similarStories: string;
  trending: string;
  readNow: string;
  maybeLater: string;
  minutes: string;
}> = {
  nl: {
    title: 'Wil je meer?',
    subtitle: 'Ontdek verhalen die bij jou passen',
    continueReading: 'Verder Lezen',
    similarStories: 'Vergelijkbare Verhalen',
    trending: 'Trending Nu',
    readNow: 'Nu Lezen',
    maybeLater: 'Misschien Later',
    minutes: 'min',
  },
  en: {
    title: 'Want More?',
    subtitle: 'Discover stories that match your taste',
    continueReading: 'Continue Reading',
    similarStories: 'Similar Stories',
    trending: 'Trending Now',
    readNow: 'Read Now',
    maybeLater: 'Maybe Later',
    minutes: 'min',
  },
  de: {
    title: 'Mehr Erleben?',
    subtitle: 'Entdecke Geschichten, die zu dir passen',
    continueReading: 'Weiterlesen',
    similarStories: 'Ähnliche Geschichten',
    trending: 'Jetzt Trending',
    readNow: 'Jetzt Lesen',
    maybeLater: 'Vielleicht Später',
    minutes: 'Min',
  },
  fr: {
    title: 'En Veux-tu Plus?',
    subtitle: 'Découvre des histoires qui te correspondent',
    continueReading: 'Continuer à Lire',
    similarStories: 'Histoires Similaires',
    trending: 'Tendance Actuelle',
    readNow: 'Lire Maintenant',
    maybeLater: 'Peut-être Plus Tard',
    minutes: 'min',
  },
  es: {
    title: '¿Quieres Más?',
    subtitle: 'Descubre historias que se adapten a tu gusto',
    continueReading: 'Continuar Leyendo',
    similarStories: 'Historias Similares',
    trending: 'Tendencia Ahora',
    readNow: 'Leer Ahora',
    maybeLater: 'Quizás Más Tarde',
    minutes: 'min',
  },
  it: {
    title: 'Vuoi di Più?',
    subtitle: 'Scopri storie che si adattano al tuo gusto',
    continueReading: 'Continua a Leggere',
    similarStories: 'Storie Simili',
    trending: 'Tendenza Ora',
    readNow: 'Leggi Ora',
    maybeLater: 'Forse Più Tardi',
    minutes: 'min',
  },
};

const NextStoryPrompt: React.FC<NextStoryPromptProps> = ({
  isOpen,
  onClose,
  onSelectStory,
  currentStoryId,
  language = 'nl',
  userPreferences = [],
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const t = LABELS[language] || LABELS['en'];

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Mock data - in real implementation this would come from API
  const similarStories: StoryPreview[] = [
    {
      id: 'story-1',
      title: 'Verborgen Verlangen',
      preview: 'Een mysterieus avontuur in een donkere nachtclub...',
      duration: '8',
      tags: ['Spannend', 'Mysterie'],
    },
    {
      id: 'story-2',
      title: 'Zomerse Verleiding',
      preview: 'Een erotische reis naar een afgelegen eiland...',
      duration: '12',
      tags: ['Romantisch', 'Avontuur'],
    },
    {
      id: 'story-3',
      title: 'Kantoor Affaire',
      preview: 'Een verboden relatie tussen collega\'s...',
      duration: '6',
      tags: ['Spannend', 'Romantisch'],
    },
  ];

  const trendingStories: StoryPreview[] = [
    {
      id: 'story-4',
      title: 'Midnight Confessions',
      preview: 'Late night secrets revealed in a luxury hotel...',
      duration: '10',
      tags: ['Luxury', 'Secrets'],
    },
    {
      id: 'story-5',
      title: 'Forbidden Desires',
      preview: 'Exploring taboo fantasies in a safe space...',
      duration: '15',
      tags: ['Taboo', 'Fantasy'],
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div 
        className={`relative w-full max-w-2xl bg-gradient-to-b from-zinc-900 to-black border border-gold-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Icons.Heart className="text-black" size={28} />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">{t.title}</h2>
            <p className="text-zinc-400 text-sm">{t.subtitle}</p>
          </div>

          {/* Story Preview */}
          <div className="bg-black/50 rounded-xl p-4 border border-white/10 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1">{t.continueReading}</h3>
                <p className="text-zinc-400 text-sm mb-2">Hoe wil je verdergaan met je verhaal?</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-gold-500/20 text-gold-400 rounded-full">{t.minutes} 8</span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">Romantisch</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Story Sections */}
        <div className="px-6 pb-4 max-h-96 overflow-y-auto">
          {/* Similar Stories */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Icons.Compass className="text-gold-500" size={20} />
              {t.similarStories}
            </h3>
            <div className="space-y-3">
              {similarStories.map((story) => (
                <div 
                  key={story.id}
                  className="bg-black/30 hover:bg-black/50 rounded-xl p-4 border border-white/5 transition-all cursor-pointer active:scale-[0.98]"
                  onClick={() => onSelectStory(story.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm mb-1">{story.title}</h4>
                      <p className="text-zinc-400 text-xs mb-2 line-clamp-2">{story.preview}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded-full">{t.minutes} {story.duration}</span>
                          {story.tags.slice(0, 1).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">{tag}</span>
                          ))}
                        </div>
                        <Icons.ChevronRight className="text-zinc-600" size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Stories */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Icons.TrendingUp className="text-gold-500" size={20} />
              {t.trending}
            </h3>
            <div className="space-y-3">
              {trendingStories.map((story) => (
                <div 
                  key={story.id}
                  className="bg-black/30 hover:bg-black/50 rounded-xl p-4 border border-white/5 transition-all cursor-pointer active:scale-[0.98]"
                  onClick={() => onSelectStory(story.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm mb-1">{story.title}</h4>
                      <p className="text-zinc-400 text-xs mb-2 line-clamp-2">{story.preview}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="px-1.5 py-0.5 bg-gold-500/20 text-gold-400 rounded-full">{t.minutes} {story.duration}</span>
                          {story.tags.slice(0, 1).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">{tag}</span>
                          ))}
                        </div>
                        <Icons.ChevronRight className="text-zinc-600" size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onSelectStory('continue')}
              className="flex-1 py-3 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center gap-2"
            >
              <Icons.Play size={16} />
              {t.readNow}
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-zinc-700"
            >
              {t.maybeLater}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextStoryPrompt;