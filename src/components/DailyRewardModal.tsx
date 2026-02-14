
import React from 'react';
import Icons from './Icon';

interface DailyRewardModalProps {
  isOpen: boolean;
  onClaim: () => void;
  streak: number;
  amount: number;
}

const DailyRewardModal: React.FC<DailyRewardModalProps> = ({ isOpen, onClaim, streak, amount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      
      <div className="relative w-full max-w-sm bg-[#111] border border-gold-500/50 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.3)] p-8 text-center">
         
         <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-gold-500/20 to-transparent pointer-events-none"></div>

         <div className="relative z-10">
             <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 rotate-3">
                 <Icons.Sparkles size={40} className="text-black" />
             </div>
             
             <h2 className="text-2xl font-headline font-bold text-white mb-2">Dagelijkse Bonus</h2>
             <p className="text-zinc-400 text-sm mb-6">Je bent terug! Hier zijn je gratis credits voor vandaag.</p>
             
             <div className="bg-black/50 rounded-xl p-4 border border-white/10 mb-6 flex items-center justify-between">
                 <div className="text-left">
                     <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Huidige Streak</div>
                     <div className="text-white font-bold text-xl">{streak} Dagen 🔥</div>
                 </div>
                 <div className="text-right">
                     <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Beloning</div>
                     <div className="text-gold-400 font-bold text-xl">+{amount} Credits</div>
                 </div>
             </div>

             <button 
                onClick={onClaim}
                className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
             >
                 Claim Beloning
             </button>
         </div>
      </div>
    </div>
  );
};

export default DailyRewardModal;
