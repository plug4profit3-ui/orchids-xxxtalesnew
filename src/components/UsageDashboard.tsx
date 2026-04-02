import React, { useState, useEffect } from 'react';
import { Language, UserProfile } from '../types';
import { supabase } from '../services/supabase';
import Icons from './Icon';

interface UsageDashboardProps {
  user: UserProfile;
  language: Language;
  onOpenPaywall: () => void;
}

interface UsageData {
  summary: {
    current_balance: number;
    daily_messages_left: number;
    total_spent: number;
    total_purchased: number;
    total_refunded: number;
    period_days: number;
    api_cost_usd: number;
  };
  // Business analytics fields
  business?: {
    total_users: number;
    active_daily: number;
    active_weekly: number;
    active_monthly: number;
    revenue: number;
    top_features: string[];
    avg_session_minutes: number;
  };
  cost_breakdown: {
    chat: number;
    image: number;
    tts: number;
    story: number;
    gift: number;
  };
  daily_usage: { date: string; credits_spent: number; api_calls: number }[];
  recent_transactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    created_at: string;
  }[];
}

const LABELS: Record<string, any> = {
  nl: {
    title: 'Jouw Verbruik',
    subtitle: 'Overzicht van je credits en activiteit',
    balance: 'Huidige Saldo',
    spent: 'Verbruikt',
    purchased: 'Gekocht',
    refunded: 'Teruggekregen',
    breakdown: 'Verdeling',
    chat: 'Chat',
    image: 'Afbeeldingen',
    tts: 'Spraak',
    story: 'Verhalen',
    gift: 'Cadeaus',
    recent: 'Recente Transacties',
    no_data: 'Nog geen data',
    buy_credits: 'Koop Credits',
    per_day: 'per dag',
    credits: 'credits',
    daily_free: 'Dagelijks gratis',
  },
  en: {
    title: 'Your Usage',
    subtitle: 'Overview of your credits and activity',
    balance: 'Current Balance',
    spent: 'Spent',
    purchased: 'Purchased',
    refunded: 'Refunded',
    breakdown: 'Breakdown',
    chat: 'Chat',
    image: 'Images',
    tts: 'Voice',
    story: 'Stories',
    gift: 'Gifts',
    recent: 'Recent Transactions',
    no_data: 'No data yet',
    buy_credits: 'Buy Credits',
    per_day: 'per day',
    credits: 'credits',
    daily_free: 'Daily free',
  },
  de: {
    title: 'Dein Verbrauch',
    subtitle: 'Übersicht deiner Credits und Aktivität',
    balance: 'Aktuelles Guthaben',
    spent: 'Verbraucht',
    purchased: 'Gekauft',
    refunded: 'Erstattet',
    breakdown: 'Aufteilung',
    chat: 'Chat',
    image: 'Bilder',
    tts: 'Stimme',
    story: 'Geschichten',
    gift: 'Geschenke',
    recent: 'Letzte Transaktionen',
    no_data: 'Noch keine Daten',
    buy_credits: 'Credits Kaufen',
    per_day: 'pro Tag',
    credits: 'Credits',
    daily_free: 'Tägliche Gratis',
  },
  fr: {
    title: 'Votre Utilisation',
    subtitle: 'Aperçu de vos crédits et activités',
    balance: 'Solde Actuel',
    spent: 'Dépensé',
    purchased: 'Acheté',
    refunded: 'Remboursé',
    breakdown: 'Répartition',
    chat: 'Chat',
    image: 'Images',
    tts: 'Voix',
    story: 'Histoires',
    gift: 'Cadeaux',
    recent: 'Transactions Récentes',
    no_data: 'Pas encore de données',
    buy_credits: 'Acheter Crédits',
    per_day: 'par jour',
    credits: 'crédits',
    daily_free: 'Gratuit quotidien',
  },
  es: {
    title: 'Tu Uso',
    subtitle: 'Resumen de tus créditos y actividad',
    balance: 'Saldo Actual',
    spent: 'Gastado',
    purchased: 'Comprado',
    refunded: 'Reembolsado',
    breakdown: 'Desglose',
    chat: 'Chat',
    image: 'Imágenes',
    tts: 'Voz',
    story: 'Historias',
    gift: 'Regalos',
    recent: 'Transacciones Recientes',
    no_data: 'Sin datos aún',
    buy_credits: 'Comprar Créditos',
    per_day: 'por día',
    credits: 'créditos',
    daily_free: 'Gratis diario',
  },
  it: {
    title: 'Il Tuo Uso',
    subtitle: 'Panoramica dei tuoi crediti e attività',
    balance: 'Saldo Attuale',
    spent: 'Speso',
    purchased: 'Acquistato',
    refunded: 'Rimborsato',
    breakdown: 'Ripartizione',
    chat: 'Chat',
    image: 'Immagini',
    tts: 'Voce',
    story: 'Storie',
    gift: 'Regali',
    recent: 'Transazioni Recenti',
    no_data: 'Nessun dato ancora',
    buy_credits: 'Compra Crediti',
    per_day: 'al giorno',
    credits: 'crediti',
    daily_free: 'Gratis giornaliero',
  },
};

const UsageDashboard: React.FC<UsageDashboardProps> = ({ user, language, onOpenPaywall }) => {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = LABELS[language] || LABELS['en'];

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        if (!accessToken) return;

        const res = await fetch('/api/credits?action=usage&days=30', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch usage:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, []);

  const txTypeColors: Record<string, string> = {
    consumption: 'text-red-400',
    purchase: 'text-green-400',
    refund: 'text-blue-400',
    adjustment: 'text-yellow-400',
    daily_reward: 'text-purple-400',
    vip_monthly: 'text-gold-500',
  };

  const txTypeIcons: Record<string, string> = {
    consumption: '−',
    purchase: '+',
    refund: '↩',
    adjustment: '~',
    daily_reward: '🎁',
    vip_monthly: '⭐',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.Loader2 size={32} className="text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 space-y-6 pb-32 no-scrollbar safe-pt">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-headline font-black text-shine uppercase tracking-tighter">{t.title}</h1>
        <p className="text-gold-500 text-[11px] uppercase font-black tracking-widest mt-1">{t.subtitle}</p>
      </div>

      {/* Balance Card */}
      <div className="glass-premium rounded-3xl p-6 border-gold-500/30 bg-black/80">
        <div className="text-center mb-4">
          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{t.balance}</p>
          <p className="text-5xl font-black text-gold-500 mt-2">{data?.summary.current_balance ?? user.credits}</p>
          <p className="text-zinc-500 text-xs mt-1">{t.credits}</p>
          {data && data.summary.daily_messages_left > 0 && (
            <p className="text-green-400 text-[10px] mt-2 font-bold">{data.summary.daily_messages_left} {t.daily_free}</p>
          )}
        </div>
        <button onClick={onOpenPaywall} className="w-full py-3 btn-premium rounded-2xl text-sm font-black uppercase tracking-widest">
          {t.buy_credits}
        </button>
      </div>

      {/* Stats Grid */}
      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-red-400 text-xl font-black">{data.summary.total_spent}</p>
              <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.spent}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-green-400 text-xl font-black">{data.summary.total_purchased}</p>
              <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.purchased}</p>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-blue-400 text-xl font-black">{data.summary.total_refunded}</p>
              <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.refunded}</p>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <h3 className="text-[10px] font-black text-gold-500 uppercase tracking-widest mb-4">{t.breakdown}</h3>
            <div className="space-y-3">
              {[
                { key: 'chat', label: t.chat, icon: '💬', color: 'bg-blue-500' },
                { key: 'image', label: t.image, icon: '🖼️', color: 'bg-pink-500' },
                { key: 'story', label: t.story, icon: '📖', color: 'bg-purple-500' },
                { key: 'tts', label: t.tts, icon: '🔊', color: 'bg-green-500' },
                { key: 'gift', label: t.gift, icon: '🎁', color: 'bg-yellow-500' },
              ].map(item => {
                const value = data.cost_breakdown[item.key as keyof typeof data.cost_breakdown] || 0;
                const total = Object.values(data.cost_breakdown).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((value / total) * 100);
                return (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 font-bold">{item.label}</span>
                        <span className="text-zinc-500">{value} {t.credits} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
            <h3 className="text-[10px] font-black text-gold-500 uppercase tracking-widest mb-4">{t.recent}</h3>
            {(() => {
              const HIDDEN_TYPES = ['signup_bonus', 'api_call', 'adjustment'];
              const visible = data.recent_transactions.filter(tx => !HIDDEN_TYPES.includes(tx.type));
              return visible.length === 0 ? (
              <p className="text-zinc-600 text-xs text-center py-4">{t.no_data}</p>
            ) : (
              <div className="space-y-2">
                {visible.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-mono ${txTypeColors[tx.type] || 'text-zinc-400'}`}>
                        {txTypeIcons[tx.type] || '•'}
                      </span>
                      <div>
                        <p className="text-xs text-zinc-300 font-bold">{tx.description || tx.type}</p>
                        <p className="text-[10px] text-zinc-600">{new Date(tx.created_at).toLocaleDateString(language)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-black ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )})()}
          </div>

          {/* API Cost info */}
          {data.summary.api_cost_usd > 0 && (
            <div className="text-center text-[10px] text-zinc-600 py-2">
              API kost: ${data.summary.api_cost_usd} ({data.summary.period_days} dagen)
            </div>
          )}

          {/* Business Analytics (Admin view) */}
          {data?.business && (
            <div className="bg-zinc-900/50 border border-purple-500/30 rounded-2xl p-5">
              <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-4">
                {language === 'nl' ? 'Analytics voor Business' : 'Business Analytics'}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/40 rounded-xl p-3 text-center">
                  <p className="text-white text-lg font-black">{data.business.total_users}</p>
                  <p className="text-zinc-500 text-[8px] uppercase">{language === 'nl' ? 'Totaal gebruikers' : 'Total Users'}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-3 text-center">
                  <p className="text-green-400 text-lg font-black">{data.business.active_daily}</p>
                  <p className="text-zinc-500 text-[8px] uppercase">{language === 'nl' ? 'Dagelijks actief' : 'Daily Active'}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-3 text-center">
                  <p className="text-blue-400 text-lg font-black">{data.business.active_weekly}</p>
                  <p className="text-zinc-500 text-[8px] uppercase">{language === 'nl' ? 'Wekelijks actief' : 'Weekly Active'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/40 rounded-xl p-3 text-center">
                  <p className="text-gold-500 text-lg font-black">€{data.business.revenue}</p>
                  <p className="text-zinc-500 text-[8px] uppercase">{language === 'nl' ? 'Omzet (gesimuleerd)' : 'Revenue (sim)'}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-3 text-center">
                  <p className="text-purple-400 text-lg font-black">{data.business.avg_session_minutes} min</p>
                  <p className="text-zinc-500 text-[8px] uppercase">{language === 'nl' ? 'Gem. sessie' : 'Avg Session'}</p>
                </div>
              </div>
              {data.business.top_features && data.business.top_features.length > 0 && (
                <div className="bg-black/40 rounded-xl p-3">
                  <p className="text-zinc-500 text-[8px] uppercase mb-2">{language === 'nl' ? 'Meest gebruikt' : 'Top Features'}</p>
                  <div className="flex flex-wrap gap-2">
                    {data.business.top_features.map((feature, i) => (
                      <span key={i} className="px-2 py-1 bg-zinc-800 rounded-lg text-zinc-300 text-[10px]">{feature}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsageDashboard;
