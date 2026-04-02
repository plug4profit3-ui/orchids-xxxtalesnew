import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { supabase } from '../services/supabase';
import Icons from './Icon';

interface Partner {
  id: string;
  name: string;
  code: string;
  reward_percentage: number;
  logo_url: string;
  description: string;
}

interface PartnersListProps {
  language: Language;
  onClaimCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  onClose?: () => void;
}

const LABELS: Record<string, any> = {
  nl: {
    title: 'Onze Partners',
    subtitle: 'Kies een partner en ontvang bonus credits',
    your_code: 'Jouw partner code',
    placeholder: 'Voer partner code in',
    claim: 'Claim',
    claiming: 'Bezig...',
    bonus: 'Bonus',
    join: 'Word Partner',
    success: 'Success! Je hebt bonus credits ontvangen',
    error: 'Ongeldige code',
  },
  en: {
    title: 'Our Partners',
    subtitle: 'Choose a partner and receive bonus credits',
    your_code: 'Your partner code',
    placeholder: 'Enter partner code',
    claim: 'Claim',
    claiming: 'Claiming...',
    bonus: 'Bonus',
    join: 'Become a Partner',
    success: 'Success! You received bonus credits',
    error: 'Invalid code',
  },
  de: {
    title: 'Unsere Partner',
    subtitle: 'Wähle einen Partner und erhalte Bonus-Credits',
    your_code: 'Dein Partner-Code',
    placeholder: 'Partner-Code eingeben',
    claim: 'Einlösen',
    claiming: 'Wird eingelöst...',
    bonus: 'Bonus',
    join: 'Partner werden',
    success: 'Erfolg! Du hast Bonus-Credits erhalten',
    error: 'Ungültiger Code',
  },
  fr: {
    title: 'Nos Partenaires',
    subtitle: 'Choisissez un partenaire et recevez des crédits bonus',
    your_code: 'Votre code partenaire',
    placeholder: 'Entrer le code partenaire',
    claim: 'Réclamer',
    claiming: 'En cours...',
    bonus: 'Bonus',
    join: 'Devenir Partenaire',
    success: 'Succès! Vous avez reçu des crédits bonus',
    error: 'Code invalide',
  },
  es: {
    title: 'Nuestros Socios',
    subtitle: 'Elige un socio y recibe créditos de bonificación',
    your_code: 'Tu código de socio',
    placeholder: 'Ingresa el código de socio',
    claim: 'Reclamar',
    claiming: 'Reclamando...',
    bonus: 'Bono',
    join: 'Hacerse Socio',
    success: '¡Éxito! Recibiste créditos de bonificación',
    error: 'Código inválido',
  },
  it: {
    title: 'I Nostri Partner',
    subtitle: 'Scegli un partner e ricevi crediti bonus',
    your_code: 'Il tuo codice partner',
    placeholder: 'Inserisci il codice partner',
    claim: 'Richiedi',
    claiming: 'In corso...',
    bonus: 'Bonus',
    join: 'Diventa Partner',
    success: 'Successo! Hai ricevuto crediti bonus',
    error: 'Codice non valido',
  },
};

const PartnersList: React.FC<PartnersListProps> = ({ language, onClaimCode, onClose }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerCode, setPartnerCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const t = LABELS[language] || LABELS['en'];

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch('/api/partners/list');
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners || []);
        }
      } catch (e) {
        console.error('Failed to fetch partners:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPartners();
  }, []);

  const handleClaim = async () => {
    if (!partnerCode.trim()) return;
    setClaiming(true);
    setMessage(null);
    
    const result = await onClaimCode(partnerCode.trim());
    
    if (result.success) {
      setMessage({ type: 'success', text: t.success });
      setPartnerCode('');
    } else {
      setMessage({ type: 'error', text: result.error || t.error });
    }
    
    setClaiming(false);
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

      {/* Partner Code Input */}
      <div className="glass-premium rounded-3xl p-5 border-gold-500/30 bg-black/80">
        <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-3">{t.your_code}</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
            placeholder={t.placeholder}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-gold-500"
          />
          <button
            onClick={handleClaim}
            disabled={claiming || !partnerCode.trim()}
            className="px-6 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all"
          >
            {claiming ? t.claiming : t.claim}
          </button>
        </div>
        {message && (
          <div className={`mt-3 p-3 rounded-xl text-xs font-bold ${message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-2 gap-4">
        {partners.map((partner) => (
          <div key={partner.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 hover:border-gold-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <img 
                src={partner.logo_url || 'https://storage.googleapis.com/foto1982/logo.jpeg'} 
                alt={partner.name}
                className="w-12 h-12 rounded-xl object-cover border border-gold-500/20"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-sm truncate">{partner.name}</h3>
                <p className="text-gold-500 text-[10px] font-black uppercase">{partner.reward_percentage}% {t.bonus}</p>
              </div>
            </div>
            <p className="text-zinc-500 text-[10px] line-clamp-2">{partner.description}</p>
            <div className="mt-3 py-1.5 bg-zinc-800 rounded-lg text-center">
              <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">{partner.code}</span>
            </div>
          </div>
        ))}
      </div>

      {partners.length === 0 && (
        <div className="text-center py-8">
          <p className="text-zinc-600 text-xs">{language === 'nl' ? 'Geen partners beschikbaar' : 'No partners available'}</p>
        </div>
      )}
    </div>
  );
};

export default PartnersList;