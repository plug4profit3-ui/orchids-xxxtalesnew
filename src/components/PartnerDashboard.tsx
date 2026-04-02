import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Language, AppMode } from '../types';
import Icons from './Icon';

interface PartnerDashboardProps {
  language: Language;
  onNavigate?: (mode: string) => void;
}

interface PartnerStats {
  clicks: number;
  signups: number;
  revenue: number;
  conversionRate: number;
  recentSignups: { name: string; date: string }[];
}

const LABELS: Record<string, any> = {
  nl: {
    title: 'Partner Dashboard',
    subtitle: 'Jouw partnerstatistieken',
    clicks: 'Kliks',
    signups: 'Aanmeldingen',
    revenue: 'Omzet (gesimuleerd)',
    conversion: 'Conversie',
    recent: 'Recente Aanmeldingen',
    no_data: 'Nog geen data beschikbaar',
    code: 'Jouw Partner Code',
    share_link: 'Deel jouw unieke link',
    bonus_earned: 'Bonus verdiend',
    total_earnings: 'Totaal verdiend',
  },
  en: {
    title: 'Partner Dashboard',
    subtitle: 'Your partner statistics',
    clicks: 'Clicks',
    signups: 'Signups',
    revenue: 'Revenue (simulated)',
    conversion: 'Conversion',
    recent: 'Recent Signups',
    no_data: 'No data available yet',
    code: 'Your Partner Code',
    share_link: 'Share your unique link',
    bonus_earned: 'Bonus earned',
    total_earnings: 'Total earnings',
  },
  de: {
    title: 'Partner Dashboard',
    subtitle: 'Deine Partner-Statistiken',
    clicks: 'Klicks',
    signups: 'Anmeldungen',
    revenue: 'Umsatz (simuliert)',
    conversion: 'Konversion',
    recent: 'Neueste Anmeldungen',
    no_data: 'Noch keine Daten verfügbar',
    code: 'Dein Partner-Code',
    share_link: 'Teile deinen einzigartigen Link',
    bonus_earned: 'Bonus verdient',
    total_earnings: 'Gesamtverdienst',
  },
  fr: {
    title: 'Tableau de Bord Partenaire',
    subtitle: 'Vos statistiques partenaire',
    clicks: 'Clics',
    signups: 'Inscriptions',
    revenue: 'Revenus (simulé)',
    conversion: 'Conversion',
    recent: 'Inscriptions Récentes',
    no_data: 'Pas encore de données disponibles',
    code: 'Votre Code Partenaire',
    share_link: 'Partagez votre lien unique',
    bonus_earned: 'Bonus gagné',
    total_earnings: 'Gains totaux',
  },
  es: {
    title: 'Panel de Socios',
    subtitle: 'Tus estadísticas de socio',
    clicks: 'Clics',
    signups: 'Registros',
    revenue: 'Ingresos (simulado)',
    conversion: 'Conversión',
    recent: 'Registros Recientes',
    no_data: 'Sin datos disponibles aún',
    code: 'Tu Código de Socio',
    share_link: 'Comparte tu enlace único',
    bonus_earned: 'Bono ganado',
    total_earnings: 'Ganancias totales',
  },
  it: {
    title: 'Dashboard Partner',
    subtitle: 'Le tue statistiche partner',
    clicks: 'Click',
    signups: 'Iscrizioni',
    revenue: 'Ricavi (simulato)',
    conversion: 'Conversione',
    recent: 'Iscrizioni Recenti',
    no_data: 'Nessun dato disponibile ancora',
    code: 'Il tuo Codice Partner',
    share_link: 'Condividi il tuo link unico',
    bonus_earned: 'Bonus guadagnato',
    total_earnings: 'Guadagni totali',
  },
};

const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ language }) => {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [partnerCode, setPartnerCode] = useState<string>('');
  const t = LABELS[language] || LABELS['en'];

  useEffect(() => {
    const fetchPartnerStats = async () => {
      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        if (!accessToken) return;

        // Get user's partner code from profile
        const res = await fetch('/api/partners?type=code', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPartnerCode(data.code || '');
        }

        // Get partner stats from API (simulated for demo)
        const statsRes = await fetch('/api/partners?type=stats', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        } else {
          // Fallback: simulate data for demo
          setStats({
            clicks: Math.floor(Math.random() * 500) + 50,
            signups: Math.floor(Math.random() * 50) + 5,
            revenue: Math.floor(Math.random() * 200) + 20,
            conversionRate: 0,
            recentSignups: [],
          });
        }
      } catch (e) {
        console.error('Failed to fetch partner stats:', e);
        // Simulate for demo
        setStats({
          clicks: Math.floor(Math.random() * 500) + 50,
          signups: Math.floor(Math.random() * 50) + 5,
          revenue: Math.floor(Math.random() * 200) + 20,
          conversionRate: 0,
          recentSignups: [],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPartnerStats();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Icons.Loader2 size={32} className="text-gold-500 animate-spin" />
      </div>
    );
  }

  const conversionRate = stats && stats.clicks > 0 
    ? Math.round((stats.signups / stats.clicks) * 100 * 10) / 10 
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 space-y-6 pb-32 no-scrollbar safe-pt">
      <div className="text-center pt-4">
        <h1 className="text-3xl font-headline font-black text-shine uppercase tracking-tighter">{t.title}</h1>
        <p className="text-gold-500 text-[11px] uppercase font-black tracking-widest mt-1">{t.subtitle}</p>
      </div>

      {/* Partner Code Section */}
      {partnerCode && (
        <div className="glass-premium rounded-3xl p-6 border-gold-500/30 bg-black/80">
          <div className="text-center mb-4">
            <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-2">{t.code}</p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-2xl font-black text-gold-500">{partnerCode}</p>
              <button 
                onClick={() => copyToClipboard(partnerCode)}
                className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <Icons.Copy size={16} className="text-zinc-400" />
              </button>
            </div>
          </div>
          <div className="bg-zinc-900/50 rounded-xl p-3 text-center">
            <p className="text-zinc-400 text-xs">{t.share_link}</p>
            <p className="text-zinc-600 text-[10px] mt-1">xxx-tales.nl?ref={partnerCode}</p>
          </div>
          {onNavigate && (
            <button 
              onClick={() => onNavigate(AppMode.PARTNERS_LIST)}
              className="w-full mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-400 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              {language === 'nl' ? 'Bekijk Partners' : 'View Partners'}
            </button>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-blue-400">{stats?.clicks || 0}</p>
          <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.clicks}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-green-400">{stats?.signups || 0}</p>
          <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.signups}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-gold-500">€{stats?.revenue || 0}</p>
          <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.revenue}</p>
        </div>
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 text-center">
          <p className="text-3xl font-black text-purple-400">{conversionRate}%</p>
          <p className="text-zinc-500 text-[9px] uppercase font-bold mt-1">{t.conversion}</p>
        </div>
      </div>

      {/* Earnings */}
      <div className="bg-gradient-to-r from-gold-500/20 to-purple-500/20 border border-gold-500/30 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-[10px] uppercase font-bold">{t.total_earnings}</p>
            <p className="text-3xl font-black text-gold-500">€{(stats?.revenue || 0) * 0.1}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400 text-[10px] uppercase font-bold">{t.bonus_earned}</p>
            <p className="text-xl font-black text-green-400">+{stats?.signups || 0} credits</p>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      {stats?.recentSignups && stats.recentSignups.length > 0 && (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5">
          <h3 className="text-[10px] font-black text-gold-500 uppercase tracking-widest mb-4">{t.recent}</h3>
          <div className="space-y-2">
            {stats.recentSignups.map((signup, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-zinc-300">{signup.name}</span>
                <span className="text-[10px] text-zinc-600">{signup.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!stats || (stats.clicks === 0 && stats.signups === 0)) && (
        <div className="text-center py-8">
          <p className="text-zinc-600 text-xs">{t.no_data}</p>
        </div>
      )}
    </div>
  );
};

export default PartnerDashboard;