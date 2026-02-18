import React, { useState } from 'react';
import { Character, Language } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageFlag } from '../constants';
import Icons from './Icon';

interface OnboardingWizardProps {
  characters: Character[];
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  onComplete: (selectedChar?: Character) => void;
}

const OB_TEXTS: Record<string, {
  welcome: string;
  choose_lang: string;
  continue: string;
  pick_partner: string;
  pick_partner_sub: string;
  back: string;
  ready: string;
  ready_sub: string;
  feat_chat: string;
  feat_story: string;
  feat_image: string;
  start_chat: string;
  skip: string;
}> = {
  nl: {
    welcome: 'Welkom',
    choose_lang: 'Kies je taal om te beginnen',
    continue: 'Doorgaan',
    pick_partner: 'Kies je eerste partner',
    pick_partner_sub: 'Tik op degene die je aanspreekt',
    back: 'Terug',
    ready: 'Klaar om te beginnen!',
    ready_sub: 'wacht op je. Stuur je eerste bericht en ontdek waar het gesprek naartoe gaat...',
    feat_chat: 'Onbeperkte AI chat gesprekken',
    feat_story: 'Interactieve verhalen schrijven',
    feat_image: 'AI beelden genereren',
    start_chat: 'Start Chat',
    skip: 'Sla over en verken zelf',
  },
  en: {
    welcome: 'Welcome',
    choose_lang: 'Choose your language to get started',
    continue: 'Continue',
    pick_partner: 'Pick your first partner',
    pick_partner_sub: 'Tap the one that catches your eye',
    back: 'Back',
    ready: 'Ready to begin!',
    ready_sub: 'is waiting for you. Send your first message and see where it goes...',
    feat_chat: 'Unlimited AI chat conversations',
    feat_story: 'Write interactive stories',
    feat_image: 'Generate AI images',
    start_chat: 'Start Chat',
    skip: 'Skip and explore yourself',
  },
  de: {
    welcome: 'Willkommen',
    choose_lang: 'Wähle deine Sprache',
    continue: 'Weiter',
    pick_partner: 'Wähle deine erste Partnerin',
    pick_partner_sub: 'Tippe auf die, die dich anspricht',
    back: 'Zurück',
    ready: 'Bereit loszulegen!',
    ready_sub: 'wartet auf dich. Schreib deine erste Nachricht...',
    feat_chat: 'Unbegrenzte KI-Chats',
    feat_story: 'Interaktive Geschichten schreiben',
    feat_image: 'KI-Bilder generieren',
    start_chat: 'Chat Starten',
    skip: 'Überspringen und selbst erkunden',
  },
  fr: {
    welcome: 'Bienvenue',
    choose_lang: 'Choisissez votre langue',
    continue: 'Continuer',
    pick_partner: 'Choisissez votre première partenaire',
    pick_partner_sub: 'Appuyez sur celle qui vous attire',
    back: 'Retour',
    ready: 'Prêt à commencer !',
    ready_sub: 'vous attend. Envoyez votre premier message...',
    feat_chat: 'Chats IA illimités',
    feat_story: 'Écrire des histoires interactives',
    feat_image: 'Générer des images IA',
    start_chat: 'Démarrer le Chat',
    skip: 'Passer et explorer soi-même',
  },
  es: {
    welcome: 'Bienvenido',
    choose_lang: 'Elige tu idioma para empezar',
    continue: 'Continuar',
    pick_partner: 'Elige tu primera pareja',
    pick_partner_sub: 'Toca la que te llame la atención',
    back: 'Atrás',
    ready: '¡Listo para empezar!',
    ready_sub: 'te está esperando. Envía tu primer mensaje...',
    feat_chat: 'Chats de IA ilimitados',
    feat_story: 'Escribir historias interactivas',
    feat_image: 'Generar imágenes con IA',
    start_chat: 'Iniciar Chat',
    skip: 'Omitir y explorar solo',
  },
  it: {
    welcome: 'Benvenuto',
    choose_lang: 'Scegli la tua lingua per iniziare',
    continue: 'Continua',
    pick_partner: 'Scegli la tua prima partner',
    pick_partner_sub: 'Tocca quella che ti attrae',
    back: 'Indietro',
    ready: 'Pronto per iniziare!',
    ready_sub: 'ti sta aspettando. Invia il tuo primo messaggio...',
    feat_chat: 'Chat AI illimitate',
    feat_story: 'Scrivi storie interattive',
    feat_image: 'Genera immagini AI',
    start_chat: 'Inizia Chat',
    skip: 'Salta ed esplora da solo',
  },
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ characters, language, onSelectLanguage, onComplete }) => {
  const [step, setStep] = useState(0);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);

  const t = OB_TEXTS[language] ?? OB_TEXTS['en'];
  const nonCustomChars = characters.filter(c => !c.isCustom).slice(0, 12);

  return (
    <div className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center overflow-y-auto">
      {/* Progress dots */}
      <div className="absolute top-8 flex gap-2 z-10">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-gold-500 w-6' : i < step ? 'bg-gold-500/60 w-2' : 'bg-zinc-700 w-2'}`} />
        ))}
      </div>

      {/* Step 0: Language */}
      {step === 0 && (
        <div className="flex flex-col items-center gap-8 px-6 animate-in fade-in duration-500 max-w-sm w-full">
          <div className="text-center">
            <img src="https://storage.googleapis.com/foto1982/logo.jpeg" alt="Logo" className="w-20 h-20 rounded-2xl mx-auto mb-4 border border-gold-500/30" />
            <h1 className="text-3xl font-black text-white mb-2">{t.welcome}</h1>
            <p className="text-zinc-400 text-sm">{t.choose_lang}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code as Language)}
                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${language === lang.code ? 'bg-gold-500/20 border-gold-500 scale-105' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-[10px] font-bold text-zinc-300 uppercase">{lang.name}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="w-full py-4 btn-premium rounded-2xl font-black uppercase tracking-widest text-sm">
            {t.continue}
          </button>
        </div>
      )}

      {/* Step 1: Pick character */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-6 px-6 animate-in fade-in duration-500 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-black text-white mb-2">{t.pick_partner}</h1>
            <p className="text-zinc-400 text-sm">{t.pick_partner_sub}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-h-[60vh] overflow-y-auto no-scrollbar">
            {nonCustomChars.map(char => (
              <button
                key={char.id}
                onClick={() => setSelectedChar(char)}
                className={`relative rounded-2xl border overflow-hidden aspect-[3/4] transition-all ${selectedChar?.id === char.id ? 'border-gold-500 ring-2 ring-gold-500/50 scale-[1.03]' : 'border-zinc-800 hover:border-zinc-600'}`}
              >
                <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2">
                  <p className="text-white text-[11px] font-black truncate">{char.name}</p>
                </div>
                {selectedChar?.id === char.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                    <Icons.Check size={14} className="text-black" />
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => setStep(0)} className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 font-bold text-sm">
              {t.back}
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedChar}
              className={`flex-1 py-3 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${selectedChar ? 'btn-premium' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
            >
              {t.continue}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Ready */}
      {step === 2 && selectedChar && (
        <div className="flex flex-col items-center gap-8 px-6 animate-in fade-in duration-500 max-w-sm w-full text-center">
          <div className="relative">
            <img src={selectedChar.avatar} alt={selectedChar.name} className="w-32 h-32 rounded-full object-cover border-4 border-gold-500/50" />
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-black">
              <Icons.Check size={18} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white mb-2">{t.ready}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              <span className="text-gold-400 font-bold">{selectedChar.name}</span> {t.ready_sub}
            </p>
          </div>
          <div className="space-y-3 w-full text-left bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
            {[
              { icon: Icons.MessageSquare, text: t.feat_chat },
              { icon: Icons.BookOpenCheck, text: t.feat_story },
              { icon: Icons.Sparkles, text: t.feat_image },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-gold-500" />
                </div>
                <span className="text-zinc-300 text-xs">{text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 w-full">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-2xl border border-zinc-700 text-zinc-400 font-bold text-sm">
              {t.back}
            </button>
            <button onClick={() => onComplete(selectedChar)} className="flex-1 py-4 btn-premium rounded-2xl font-black uppercase tracking-widest text-sm">
              {t.start_chat}
            </button>
          </div>
          <button onClick={() => onComplete()} className="text-zinc-600 text-xs underline hover:text-zinc-400 transition-colors">
            {t.skip}
          </button>
        </div>
      )}
    </div>
  );
};

export default OnboardingWizard;
