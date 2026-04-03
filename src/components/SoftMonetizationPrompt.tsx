import React, { useState, useEffect } from 'react';
import Icons from './Icon';
import { Language } from '../types';

interface SoftMonetizationPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onWatchAd?: () => void;
  creditsRemaining: number;
  dailyMessagesRemaining: number;
  language?: Language;
  context?: 'chat' | 'story' | 'image';
}

const LABELS: Record<string, {
  title: string;
  subtitle: string;
  lowCredits: string;
  noDaily: string;
  upgradeBtn: string;
  watchAdBtn: string;
  maybeLater: string;
  benefits: string[];
}> = {
  nl: {
    title: 'Bijna op?',
    subtitle: 'Je hebt nog maar een paar credits over',
    lowCredits: 'credits resterend',
    noDaily: 'dagelijkse berichten resterend',
    upgradeBtn: 'Upgrade Nu',
    watchAdBtn: 'Bekijk Ad (+10 Credits)',
    maybeLater: 'Misschien Later',
    benefits: ['Onbeperkte berichten', 'Exclusieve karakters', 'Geen onderbrekingen'],
  },
  en: {
    title: 'Running Low?',
    subtitle: 'You only have a few credits left',
    lowCredits: 'credits remaining',
    noDaily: 'daily messages remaining',
    upgradeBtn: 'Upgrade Now',
    watchAdBtn: 'Watch Ad (+10 Credits)',
    maybeLater: 'Maybe Later',
    benefits: ['Unlimited messages', 'Exclusive characters', 'No interruptions'],
  },
  de: {
    title: 'Fast Leer?',
    subtitle: 'Du hast nur noch wenige Credits übrig',
    lowCredits: 'Credits verbleibend',
    noDaily: 'tägliche Nachrichten verbleibend',
    upgradeBtn: 'Jetzt Upgraden',
    watchAdBtn: 'Werbung Ansehen (+10 Credits)',
    maybeLater: 'Später Vielleicht',
    benefits: ['Unbegrenzte Nachrichten', 'Exklusive Charaktere', 'Keine Unterbrechungen'],
  },
  fr: {
    title: 'Presque Vide?',
    subtitle: 'Il ne vous reste que quelques crédits',
    lowCredits: 'crédits restants',
    noDaily: 'messages quotidiens restants',
    upgradeBtn: 'Mettre à Niveau',
    watchAdBtn: 'Regarder Pub (+10 Crédits)',
    maybeLater: 'Peut-être Plus Tard',
    benefits: ['Messages illimités', 'Personnages exclusifs', 'Pas d\'interruptions'],
  },
  es: {
    title: '¿Casi Vacío?',
    subtitle: 'Solo te quedan unos pocos créditos',
    lowCredits: 'créditos restantes',
    noDaily: 'mensajes diarios restantes',
    upgradeBtn: 'Actualizar Ahora',
    watchAdBtn: 'Ver Anuncio (+10 Créditos)',
    maybeLater: 'Quizás Más Tarde',
    benefits: ['Mensajes ilimitados', 'Personajes exclusivos', 'Sin interrupciones'],
  },
  it: {
    title: 'Quasi Vuoto?',
    subtitle: 'Ti rimangono solo pochi crediti',
    lowCredits: 'crediti rimanenti',
    noDaily: 'messaggi giornalieri rimanenti',
    upgradeBtn: 'Aggiorna Ora',
    watchAdBtn: 'Guarda Pubblicità (+10 Crediti)',
    maybeLater: 'Forse Più Tardi',
    benefits: ['Messaggi illimitati', 'Personaggi esclusivi', 'Nessuna interruzione'],
  },
};

const SoftMonetizationPrompt: React.FC<SoftMonetizationPromptProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  onWatchAd,
  creditsRemaining,
  dailyMessagesRemaining,
  language = 'nl',
  context = 'chat',
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

  const isLowCredits = creditsRemaining < 20;
  const isLowDaily = dailyMessagesRemaining < 3;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      <div 
        className={`relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-black border border-gold-500/30 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        {/* Header */}
        <div className="relative p-6 pb-4">
          <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Icons.Sparkles className="text-black" size={28} />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">{t.title}</h2>
            <p className="text-zinc-400 text-sm">{t.subtitle}</p>
          </div>
        </div>

        {/* Credits Status */}
        <div className="px-6 pb-4">
          <div className="bg-black/50 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icons.Coins className="text-gold-500" size={18} />
                <span className="text-zinc-400 text-sm">Credits</span>
              </div>
              <span className={`font-bold ${isLowCredits ? 'text-red-400' : 'text-white'}`}>
                {creditsRemaining} {t.lowCredits}
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isLowCredits ? 'bg-red-500' : 'bg-gold-500'}`}
                style={{ width: `${Math.min((creditsRemaining / 100) * 100, 100)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Icons.MessageCircle className="text-blue-400" size={18} />
                <span className="text-zinc-400 text-sm">Daily</span>
              </div>
              <span className={`font-bold ${isLowDaily ? 'text-red-400' : 'text-white'}`}>
                {dailyMessagesRemaining} {t.noDaily}
              </span>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-4">
          <div className="space-y-2">
            {t.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Icons.Check className="text-emerald-400" size={12} />
                </div>
                <span className="text-zinc-300">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 space-y-3">
          <button
            onClick={onUpgrade}
            className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-400 hover:from-gold-400 hover:to-gold-300 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center gap-2"
          >
            <Icons.Crown size={18} />
            {t.upgradeBtn}
          </button>

          {onWatchAd && (
            <button
              onClick={onWatchAd}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 border border-zinc-700"
            >
              <Icons.Play size={16} />
              {t.watchAdBtn}
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 text-zinc-500 hover:text-zinc-300 font-medium text-sm transition-colors"
          >
            {t.maybeLater}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SoftMonetizationPrompt;