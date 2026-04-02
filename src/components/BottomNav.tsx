import React from 'react';
import { AppMode } from '../types';
import Icons from './Icon';

interface BottomNavProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  credits: number;
}

const LABELS: Record<string, string[]> = {
  nl: ['Ontdek', 'Verhaal', 'Imagine', 'Creëer', 'Video'],
  en: ['Discover', 'Story', 'Imagine', 'Create', 'Video'],
  de: ['Entdecken', 'Geschichte', 'Imagine', 'Erstellen', 'Video'],
  fr: ['Découvrir', 'Histoire', 'Imagine', 'Créer', 'Vidéo'],
  es: ['Descubrir', 'Historia', 'Imagine', 'Crear', 'Video'],
  it: ['Scoprire', 'Storia', 'Imagine', 'Crea', 'Video'],
};

const BottomNav: React.FC<BottomNavProps> = ({ mode, onModeChange, credits }) => {
  // Detect language from localStorage or default to nl
  const lang = (() => {
    try { return JSON.parse(localStorage.getItem('language') || '"nl"'); } catch { return 'nl'; }
  })();
  const labels = LABELS[lang] || LABELS['en'];

  const tabs = [
    { id: AppMode.GALLERY, label: labels[0], icon: Icons.Heart },
    { id: AppMode.STORY, label: labels[1], icon: Icons.BookOpenCheck },
    { id: AppMode.IMAGINE, label: labels[2], icon: Icons.Sparkles },
    { id: AppMode.CREATOR, label: labels[3], icon: Icons.Star },
    { id: AppMode.VIDEOS, label: labels[4], icon: Icons.Play },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-black/95 backdrop-blur-xl border-t border-gold-500/20 pb-safe">
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => {
          const isActive = mode === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive ? 'text-gold-500' : 'text-zinc-600'
              }`}
            >
              <IconComponent size={20} fill={isActive ? 'currentColor' : 'none'} />
              <span className="text-[9px] font-black mt-0.5 uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
