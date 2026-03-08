import React from 'react';
import { CreditTransaction } from '../services/creditService';
import Icons from './Icon';

interface CreditDisplayProps {
  credits: number;
  isPremium?: boolean;
  onOpenPaywall?: () => void;
  transactions?: CreditTransaction[];
  showHistory?: boolean;
  compact?: boolean;
}

const CreditDisplay: React.FC<CreditDisplayProps> = ({
  credits,
  isPremium = false,
  onOpenPaywall,
  transactions = [],
  showHistory = false,
  compact = false,
}) => {
  const isLow = !isPremium && credits < 10;
  const isCritical = !isPremium && credits < 5;

  if (compact) {
    return (
      <button
        onClick={onOpenPaywall}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
          isCritical
            ? 'bg-red-500/20 border-red-500/40 text-red-300 animate-pulse'
            : isLow
            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
            : isPremium
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-gold-500/10 border-gold-500/20 text-gold-200'
        }`}
      >
        <span className="text-xs">{isPremium ? '♾️' : '💎'}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isPremium ? 'VIP' : `${Math.floor(credits)} CR`}
        </span>
        {isCritical && <span className="text-[10px]">⚠️</span>}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Balance Card */}
      <div
        className={`rounded-2xl border p-4 transition-all ${
          isCritical
            ? 'bg-red-950/40 border-red-500/40'
            : isLow
            ? 'bg-amber-950/40 border-amber-500/30'
            : 'bg-zinc-900/60 border-zinc-700/40'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
              Credit Saldo
            </p>
            <div className="flex items-baseline gap-2">
              {isPremium ? (
                <span className="text-2xl font-black text-emerald-400">♾️ VIP</span>
              ) : (
                <>
                  <span
                    className={`text-3xl font-black ${
                      isCritical ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'
                    }`}
                  >
                    {Math.floor(credits)}
                  </span>
                  <span className="text-sm text-zinc-400 font-medium">credits</span>
                </>
              )}
            </div>
          </div>
          {!isPremium && (
            <button
              onClick={onOpenPaywall}
              className="bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 text-gold-300 text-xs font-black uppercase tracking-wider px-3 py-2 rounded-xl transition-all"
            >
              + Kopen
            </button>
          )}
        </div>

        {/* Low balance warnings */}
        {isCritical && (
          <div className="mt-3 flex items-center gap-2 text-red-300 text-xs">
            <span>⚠️</span>
            <span>Kritiek laag saldo! Koop meer credits om te blijven chatten.</span>
          </div>
        )}
        {isLow && !isCritical && (
          <div className="mt-3 flex items-center gap-2 text-amber-300 text-xs">
            <span>⚡</span>
            <span>Laag saldo – minder dan 10 credits over.</span>
          </div>
        )}

        {/* Credit cost guide */}
        {!isPremium && (
          <div className="mt-3 pt-3 border-t border-zinc-700/40 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-zinc-500">Normaal</p>
              <p className="text-xs font-black text-zinc-300">1 CR</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Intensief</p>
              <p className="text-xs font-black text-amber-300">5 CR</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Extreem</p>
              <p className="text-xs font-black text-red-300">10 CR</p>
            </div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      {showHistory && transactions.length > 0 && (
        <div className="rounded-2xl border border-zinc-700/40 bg-zinc-900/60 overflow-hidden">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 pt-3 pb-2">
            Transactiegeschiedenis
          </p>
          <div className="divide-y divide-zinc-800/60">
            {transactions.slice(0, 10).map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {t.type === 'purchase' ? '💳'
                      : t.type === 'bonus' ? '🎁'
                      : t.type === 'refund' ? '↩️'
                      : t.type === 'expiry' ? '⏰'
                      : '💬'}
                  </span>
                  <p className="text-xs text-zinc-300 truncate">
                    {t.description || (t.type === 'purchase' ? 'Credits gekocht' : 'Chat bericht')}
                  </p>
                </div>
                <span
                  className={`text-xs font-black shrink-0 ml-2 ${
                    t.amount > 0 ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {t.amount > 0 ? '+' : ''}{t.amount.toFixed(0)} CR
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditDisplay;
