
import React from 'react';
import Icons from './Icon';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClaim: () => void;
  streak: number;
  amount: number;
  language?: string;
}

const LABELS: Record<string, { title: string; desc: string; streak: string; reward: string; claim: string; days: string }> = {
  nl: { title: 'Dagelijkse Bonus', desc: 'Je bent terug! Hier zijn je gratis credits voor vandaag.', streak: 'Huidige Streak', reward: 'Beloning', claim: 'Claim Beloning', days: 'Dagen' },
  en: { title: 'Daily Bonus', desc: "You're back! Here are your free credits for today.", streak: 'Current Streak', reward: 'Reward', claim: 'Claim Reward', days: 'Days' },
  de: { title: 'Täglicher Bonus', desc: 'Du bist zurück! Hier sind deine gratis Credits für heute.', streak: 'Aktuelle Serie', reward: 'Belohnung', claim: 'Belohnung Abholen', days: 'Tage' },
  fr: { title: 'Bonus Quotidien', desc: 'Vous êtes de retour! Voici vos crédits gratuits du jour.', streak: 'Série Actuelle', reward: 'Récompense', claim: 'Réclamer', days: 'Jours' },
  es: { title: 'Bonus Diario', desc: '¡Has vuelto! Aquí están tus créditos gratis de hoy.', streak: 'Racha Actual', reward: 'Recompensa', claim: 'Reclamar', days: 'Días' },
  it: { title: 'Bonus Giornaliero', desc: 'Sei tornato! Ecco i tuoi crediti gratuiti di oggi.', streak: 'Serie Attuale', reward: 'Ricompensa', claim: 'Riscatta', days: 'Giorni' },
};

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClaim, streak, amount, language = 'nl' }) => {
  if (!isOpen) return null;
  const t = LABELS[language] || LABELS['en'];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      
      <div className="relative w-full max-w-sm bg-[#111] border border-gold-500/50 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.3)] p-8 text-center">
         
         <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold-500/20 to-transparent pointer-events-none"></div>

         <div className="relative z-10">
             <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 rotate-3">
                 <Icons.Sparkles size={40} className="text-black" />
             </div>
             
             <h2 className="text-2xl font-headline font-bold text-white mb-2">{t.title}</h2>
             <p className="text-zinc-400 text-sm mb-6">{t.desc}</p>
             
             <div className="bg-black/50 rounded-xl p-4 border border-white/10 mb-6 flex items-center justify-between">
                 <div className="text-left">
                     <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{t.streak}</div>
                     <div className="text-white font-bold text-xl">{streak} {t.days} 🔥</div>
                 </div>
                 <div className="text-right">
                     <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{t.reward}</div>
                     <div className="text-gold-400 font-bold text-xl">+{amount} Credits</div>
                 </div>
             </div>

             <button 
                onClick={onClaim}
                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
             >
                 {t.claim}
             </button>
         </div>
      </div>
    </div>
  );
};

export default DailyRewardModal;
