
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Character, Language, VoiceStyle, UserProfile } from '../types';
import Icons from './Icon';
import { geminiService } from '../services/geminiService';
import { getCharacters, getTexts } from '../constants';

interface CharacterCreatorProps {
  onSave: (character: Character) => void;
  language: Language;
  onConsumeCredit: (amount: number) => boolean;
  user: UserProfile;
}

type CreatorStep = 'identity' | 'physical' | 'soul' | 'manifest';

const ASSET_TEMPLATES = [
  { name: "Eva", video: "https://storage.googleapis.com/foto1982/eva2.mp4", avatar: "https://storage.googleapis.com/foto1982/eva.png", desc: "Mysterieuze verschijning", voice: "Kore" },
  { name: "Staysy", video: "https://storage.googleapis.com/foto1982/staysiy2.mp4", avatar: "https://storage.googleapis.com/foto1982/staysy.png", desc: "Verleidelijk en speels", voice: "Zephyr" },
  { name: "Anette", video: "https://storage.googleapis.com/foto1982/annette2.mp4", avatar: "https://storage.googleapis.com/foto1982/anette.png", desc: "Club partner.", voice: "Zephyr" }
];

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, language, onConsumeCredit, user }) => {
  const [step, setStep] = useState<CreatorStep>('identity');
  const [name, setName] = useState('');
  const [voice, setVoice] = useState('Zephyr');
  const [videoUrl, setVideoUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [lore, setLore] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isMounted = useRef(true);
  const t = getTexts(language as string).creator;

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const ambientVideo = useMemo(() => {
    const chars = getCharacters('nl').filter(c => c.video);
    return chars.length > 0 ? chars[Math.floor(Math.random() * chars.length)].video : null;
  }, []);

  const handleGenerate = async () => {
    if (!name || !lore) return;
    setIsGenerating(true);
    setStep('manifest');
    try {
      const newChar: Character = {
        id: `custom_${Date.now()}`,
        name,
        desc: lore,
        appearance: lore,
        video: videoUrl.trim(),
        avatar: avatarUrl || 'https://storage.googleapis.com/foto1982/logo.jpeg',
        voice: voice,
        isCustom: true
      };
      setTimeout(() => { if (isMounted.current) onSave(newChar); }, 3000);
    } catch (e) { setStep('soul'); }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-black p-4 md:p-12 no-scrollbar safe-pb relative h-full">
      <div className="absolute inset-0 z-0 pointer-events-none">
          {ambientVideo && <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 pt-4">
        <div className="text-center mb-10">
          <h2 className="text-5xl font-headline font-black text-shine uppercase tracking-tighter mb-2">{t.title}</h2>
          <p className="text-gold-500 text-[9px] tracking-[0.5em] uppercase font-black">{t.subtitle}</p>
        </div>

        <div className="glass-premium rounded-[2.5rem] p-6 md:p-12 border-gold-500/30 shadow-2xl backdrop-blur-3xl bg-black/60 min-h-[500px]">
          {step === 'identity' && (
            <div className="space-y-8 flex-1 flex flex-col">
              <div className="space-y-4 text-center">
                <label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block">{t.name_label}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={t.name_placeholder} className="w-full bg-transparent border-b border-white/20 text-center text-white font-headline text-3xl focus:outline-none" />
              </div>
              <button onClick={() => setStep('physical')} disabled={!name} className="mt-auto w-full py-5 btn-premium rounded-2xl text-sm font-black tracking-widest disabled:opacity-30">{t.continue}</button>
            </div>
          )}
          {step === 'physical' && (
            <div className="space-y-6 flex-1 flex flex-col">
              <label className="text-[11px] font-black text-gold-500 uppercase tracking-widest block text-center">{t.base_label}</label>
              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                {ASSET_TEMPLATES.map(tpl => (
                  <button key={tpl.name} onClick={() => { setVideoUrl(tpl.video); setAvatarUrl(tpl.avatar); setSelectedTemplate(tpl.name); }} className={`relative w-24 h-32 shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${selectedTemplate === tpl.name ? 'border-gold-500 scale-105 shadow-xl' : 'border-white/5 opacity-50'}`}>
                    <img src={tpl.avatar} className="w-full h-full object-cover" alt={tpl.name} />
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('soul')} className="mt-auto w-full py-5 btn-premium rounded-2xl text-sm font-black tracking-widest">{t.continue}</button>
            </div>
          )}
          {step === 'soul' && (
            <div className="space-y-6 flex-1 flex flex-col">
              <textarea value={lore} onChange={e => setLore(e.target.value)} placeholder={t.desc_placeholder} className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 text-white focus:outline-none min-h-[150px] resize-none" />
              <button onClick={handleGenerate} className="mt-auto w-full py-5 btn-premium rounded-2xl text-sm font-black tracking-widest shadow-2xl">{t.manifest}</button>
            </div>
          )}
          {step === 'manifest' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-10">
               <div className="text-center space-y-6 animate-pulse">
                  <Icons.Sparkles className="text-gold-500 mx-auto" size={80} />
                  <h3 className="text-3xl font-headline font-black text-white uppercase tracking-tighter">{t.synthesizing}</h3>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
