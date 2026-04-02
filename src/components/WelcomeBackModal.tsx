import React from 'react';
import { UserActivity, ChatSession } from '../types';

interface WelcomeBackModalProps {
  activity: UserActivity;
  lastSession?: ChatSession;
  onClose: () => void;
  characterName?: string;
  language?: string;
}

const LABELS: Record<string, { 
  messages: string[]; daysAway: (n: number) => string; 
  welcomeBack: string; whereWeLeft: string; 
  continueChat: string; shared: (n: number) => string;
  partner: string;
}> = {
  nl: {
    messages: ['Welkom terug!', 'Ik miste je al een paar dagen...', 'Het voelt als een eeuwigheid...', 'Wat ben ik blij dat je terug bent!'],
    daysAway: (n) => `Je was ${n} dag${n > 1 ? 'en' : ''} weg...`,
    welcomeBack: 'Fijn dat je er weer bent!',
    whereWeLeft: 'Waar we gebleven waren...',
    continueChat: 'Verder chatten',
    shared: (n) => `We hebben ${n} geweldige momenten gedeeld`,
    partner: 'je partner',
  },
  en: {
    messages: ['Welcome back!', "I've missed you for a few days...", 'It feels like forever...', "I'm so glad you're back!"],
    daysAway: (n) => `You were away for ${n} day${n > 1 ? 's' : ''}...`,
    welcomeBack: "Glad you're back!",
    whereWeLeft: 'Where we left off...',
    continueChat: 'Continue chatting',
    shared: (n) => `We've shared ${n} amazing moments`,
    partner: 'your partner',
  },
  de: {
    messages: ['Willkommen zurück!', 'Ich hab dich ein paar Tage vermisst...', 'Es fühlt sich wie eine Ewigkeit an...', 'Ich bin so froh, dass du zurück bist!'],
    daysAway: (n) => `Du warst ${n} Tag${n > 1 ? 'e' : ''} weg...`,
    welcomeBack: 'Schön, dass du wieder da bist!',
    whereWeLeft: 'Wo wir aufgehört haben...',
    continueChat: 'Weiter chatten',
    shared: (n) => `Wir haben ${n} wundervolle Momente geteilt`,
    partner: 'dein Partner',
  },
  fr: {
    messages: ['Bon retour!', 'Tu m\'as manqué quelques jours...', 'Ça semble une éternité...', 'Tellement content que tu sois revenu!'],
    daysAway: (n) => `Tu étais parti ${n} jour${n > 1 ? 's' : ''}...`,
    welcomeBack: 'Content que tu sois là!',
    whereWeLeft: 'Où nous en étions...',
    continueChat: 'Continuer à chatter',
    shared: (n) => `Nous avons partagé ${n} moments incroyables`,
    partner: 'ton partenaire',
  },
  es: {
    messages: ['¡Bienvenido de nuevo!', 'Te he extrañado unos días...', 'Parece una eternidad...', '¡Qué alegría que vuelvas!'],
    daysAway: (n) => `Estuviste ${n} día${n > 1 ? 's' : ''} fuera...`,
    welcomeBack: '¡Me alegra que estés aquí!',
    whereWeLeft: 'Donde lo dejamos...',
    continueChat: 'Seguir chateando',
    shared: (n) => `Hemos compartido ${n} momentos increíbles`,
    partner: 'tu pareja',
  },
  it: {
    messages: ['Bentornato!', 'Mi sei mancato per qualche giorno...', 'Sembra un\'eternità...', 'Sono così felice che sei tornato!'],
    daysAway: (n) => `Sei stato via ${n} giorn${n > 1 ? 'i' : 'a'}...`,
    welcomeBack: 'Felice che sei qui!',
    whereWeLeft: 'Dove eravamo rimasti...',
    continueChat: 'Continua a chattare',
    shared: (n) => `Abbiamo condiviso ${n} momenti meravigliosi`,
    partner: 'il tuo partner',
  },
};

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  activity,
  lastSession,
  onClose,
  characterName,
  language = 'nl',
}) => {
  const daysInactive = activity.consecutiveInactiveDays;
  const t = LABELS[language] || LABELS['en'];
  const partnerName = characterName || t.partner;

  const getWelcomeMessage = () => {
    if (daysInactive < 1) return t.messages[0];
    if (daysInactive < 3) return t.messages[1];
    if (daysInactive < 7) return t.messages[2];
    return t.messages[3];
  };

  const getLastConversationSnippet = () => {
    if (!lastSession?.messages?.length) return null;
    const lastMessage = lastSession.messages[lastSession.messages.length - 1];
    if (!lastMessage) return null;
    return lastMessage.text.substring(0, 100) + (lastMessage.text.length > 100 ? '...' : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-zinc-900 to-black border border-gold-500/30 rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4 animate-bounce">💝</div>
          <h2 className="text-2xl font-bold text-white mb-2">{getWelcomeMessage()}</h2>
          <p className="text-zinc-400 text-sm">
            {daysInactive > 0 
              ? t.daysAway(daysInactive)
              : t.welcomeBack
            }
          </p>
        </div>

        {lastSession && (
          <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-white/5">
            <p className="text-xs text-gold-500 uppercase tracking-wider mb-2 font-bold">
              {t.whereWeLeft}
            </p>
            <p className="text-sm text-zinc-300 italic">
              "{getLastConversationSnippet() || `${t.shared(1)} ${partnerName}`}" 
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition-colors active:scale-95"
          >
            {t.continueChat}
          </button>
          <p className="text-center text-xs text-zinc-500">
            {t.shared(activity.totalSessions || 1)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackModal;