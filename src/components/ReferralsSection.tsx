import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Language } from '../types';
import Icons from './Icon';

interface ReferralsSectionProps {
  userId: string;
  language: Language;
}

interface ReferralData {
  code: string;
  referralCount: number;
  referredBy?: string;
}

const LABELS: Record<string, any> = {
  nl: {
    title: 'Jouw Referrals',
    subtitle: 'Deel je code en verdien credits',
    your_code: 'Jouw unieke code',
    copy: 'Kopieer',
    copied: 'Gekopieerd!',
    referred: 'Keer verwezen',
    enter_code: 'Heb je een referral code?',
    placeholder: 'Voer code in',
    apply: 'Toepassen',
    applying: 'Bezig...',
    bonus_received: 'Je hebt 25 bonus credits ontvangen!',
    error_invalid: 'Ongeldige referral code',
    error_self: 'Je kunt niet je eigen code gebruiken',
    error_used: 'Je hebt al een referral code gebruikt',
    share: 'Deel je link',
    instructions: 'Deel je unieke code met vrienden. Jij krijgt 50 credits per referral, zij krijgen 25 welcome bonus!',
  },
  en: {
    title: 'Your Referrals',
    subtitle: 'Share your code and earn credits',
    your_code: 'Your unique code',
    copy: 'Copy',
    copied: 'Copied!',
    referred: 'times referred',
    enter_code: 'Have a referral code?',
    placeholder: 'Enter code',
    apply: 'Apply',
    applying: 'Applying...',
    bonus_received: 'You received 25 bonus credits!',
    error_invalid: 'Invalid referral code',
    error_self: 'Cannot use your own code',
    error_used: 'You have already used a referral code',
    share: 'Share your link',
    instructions: 'Share your unique code with friends. You get 50 credits per referral, they get 25 welcome bonus!',
  },
  de: {
    title: 'Deine Empfehlungen',
    subtitle: 'Teile deinen Code und verdiene Credits',
    your_code: 'Dein einzigartiger Code',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    referred: 'mal empfohlen',
    enter_code: 'Hast du einen Empfehlungscode?',
    placeholder: 'Code eingeben',
    apply: 'Anwenden',
    applying: 'Wird angewendet...',
    bonus_received: 'Du hast 25 Bonus-Credits erhalten!',
    error_invalid: 'Ungültiger Empfehlungscode',
    error_self: 'Kannst nicht deinen eigenen Code verwenden',
    error_used: 'Du hast bereits einen Empfehlungscode verwendet',
    share: 'Teilen',
    instructions: 'Teile deinen Code mit Freunden. Du bekommst 50 Credits pro Empfehlung, sie bekommen 25 Bonus!',
  },
  fr: {
    title: 'Vos Parrainages',
    subtitle: 'Partagez votre code et gagnez des crédits',
    your_code: 'Votre code unique',
    copy: 'Copier',
    copied: 'Copié!',
    referred: 'parrainages',
    enter_code: 'Avez-vous un code de parrainage?',
    placeholder: 'Entrer le code',
    apply: 'Appliquer',
    applying: 'Application...',
    bonus_received: 'Vous avez reçu 25 crédits bonus!',
    error_invalid: 'Code de parrainage invalide',
    error_self: 'Impossible d\'utiliser votre propre code',
    error_used: 'Vous avez déjà utilisé un code de parrainage',
    share: 'Partager',
    instructions: 'Partagez votre code avec vos amis. Vous gagnez 50 crédits par parrainage, eux reçoivent 25 bonus!',
  },
  es: {
    title: 'Tus Referencias',
    subtitle: 'Comparte tu código y gana créditos',
    your_code: 'Tu código único',
    copy: 'Copiar',
    copied: '¡Copiado!',
    referred: 'veces referido',
    enter_code: '¿Tienes un código de referencia?',
    placeholder: 'Ingresa el código',
    apply: 'Aplicar',
    applying: 'Aplicando...',
    bonus_received: '¡Recibiste 25 créditos de bonificación!',
    error_invalid: 'Código de referencia inválido',
    error_self: 'No puedes usar tu propio código',
    error_used: 'Ya has usado un código de referencia',
    share: 'Compartir',
    instructions: 'Comparte tu código con amigos. Ganas 50 créditos por referencia, ellos reciben 25 de bonificación!',
  },
  it: {
    title: 'I Tuoi Riferimenti',
    subtitle: 'Condividi il tuo codice e guadagna crediti',
    your_code: 'Il tuo codice unico',
    copy: 'Copia',
    copied: 'Copiato!',
    referred: 'volte segnalato',
    enter_code: 'Hai un codice di riferimento?',
    placeholder: 'Inserisci il codice',
    apply: 'Applica',
    applying: 'Applicando...',
    bonus_received: 'Hai ricevuto 25 crediti bonus!',
    error_invalid: 'Codice di riferimento non valido',
    error_self: 'Non puoi usare il tuo stesso codice',
    error_used: 'Hai già usato un codice di riferimento',
    share: 'Condividi',
    instructions: 'Condividi il tuo codice con gli amici. Ricevi 50 crediti per ogni referral, loro ricevono 25 bonus!',
  },
};

const ReferralsSection: React.FC<ReferralsSectionProps> = ({ userId, language }) => {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const t = LABELS[language] || LABELS['en'];

  useEffect(() => {
    const fetchReferralData = async () => {
      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        if (!accessToken) return;

        const res = await fetch('/api/referrals', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error('Failed to fetch referral data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReferralData();
  }, [userId]);

  const handleCopy = async () => {
    if (data?.code) {
      await navigator.clipboard.writeText(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) return;
    setApplying(true);
    setMessage(null);

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) return;

      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setMessage({ type: 'success', text: t.bonus_received });
        setReferralCode('');
        // Refresh data
        const res = await fetch('/api/referrals', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } else {
        let errorMsg = result.error || t.error_invalid;
        if (errorMsg.includes('own')) errorMsg = t.error_self;
        if (errorMsg.includes('already')) errorMsg = t.error_used;
        setMessage({ type: 'error', text: errorMsg });
      }
    } catch (e) {
      setMessage({ type: 'error', text: t.error_invalid });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icons.Loader2 size={24} className="text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Your Referral Code */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-3">{t.your_code}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3">
            <span className="text-xl font-black text-gold-500 tracking-wider">{data?.code || '---'}</span>
          </div>
          <button
            onClick={handleCopy}
            className="p-3 bg-gold-500 hover:bg-gold-400 rounded-xl transition-colors"
          >
            {copied ? <Icons.Check size={20} className="text-black" /> : <Icons.Copy size={20} className="text-black" />}
          </button>
        </div>
        
        {copied && (
          <p className="text-green-400 text-xs mt-2 font-bold">{t.copied}</p>
        )}

        {data?.referralCount !== undefined && data.referralCount > 0 && (
          <p className="text-zinc-500 text-[10px] mt-3">
            {data.referralCount} {t.referred}
          </p>
        )}

        <p className="text-zinc-600 text-[10px] mt-3 italic">
          xxx-tales.nl?ref={data?.code}
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-gold-500/10 border border-gold-500/20 rounded-2xl p-4">
        <p className="text-zinc-400 text-xs leading-relaxed">{t.instructions}</p>
      </div>

      {/* Apply Referral Code (if not already used) */}
      {!data?.referredBy && (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
          <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-3">{t.enter_code}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              placeholder={t.placeholder}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-gold-500"
            />
            <button
              onClick={handleApplyReferral}
              disabled={applying || !referralCode.trim()}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all"
            >
              {applying ? t.applying : t.apply}
            </button>
          </div>
          {message && (
            <div className={`mt-3 p-2 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferralsSection;