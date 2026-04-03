
import React, { useState, useRef } from 'react';
import { Character, Language, UserProfile } from '../types';
import Icons from './Icon';
import { geminiService } from '../services/geminiService';
import { getTexts } from '../constants';

interface CharacterCreatorProps {
  onSave: (character: Character) => void;
  language: Language;
  onConsumeCredit: (amount: number) => boolean;
  user: UserProfile;
}

type Step = 'ethnicity' | 'age' | 'hairStyle' | 'hairColor' | 'eyeColor' | 'bodyType' | 'breastSize' | 'personality' | 'name' | 'preview';
const STEPS: Step[] = ['ethnicity', 'age', 'hairStyle', 'hairColor', 'eyeColor', 'bodyType', 'breastSize', 'personality', 'name', 'preview'];

const IMG_BASE = 'https://akpwujpdbppmummswoey.supabase.co/storage/v1/object/public/creator-images';

const ETHNICITIES = [
  { id: 'caucasian', en: 'Caucasian', nl: 'Kaukasisch', gradient: 'from-amber-200 to-rose-300', image: `${IMG_BASE}/ethnicity/caucasian.webp` },
  { id: 'asian', en: 'Asian', nl: 'Aziatisch', gradient: 'from-amber-100 to-yellow-200', image: `${IMG_BASE}/ethnicity/asian.webp` },
  { id: 'black', en: 'Black / Afro', nl: 'Zwart / Afro', gradient: 'from-amber-700 to-amber-900', image: `${IMG_BASE}/ethnicity/black.webp` },
  { id: 'latina', en: 'Latina', nl: 'Latina', gradient: 'from-amber-300 to-orange-400', image: `${IMG_BASE}/ethnicity/latina.webp` },
  { id: 'arab', en: 'Arab', nl: 'Arabisch', gradient: 'from-amber-400 to-amber-600', image: `${IMG_BASE}/ethnicity/arab.webp` },
  { id: 'indian', en: 'Indian', nl: 'Indiaas', gradient: 'from-amber-500 to-amber-700', image: `${IMG_BASE}/ethnicity/indian.webp` },
];
const HAIR_STYLES = [
  { id: 'straight', en: 'Straight', nl: 'Steil', gradient: 'from-stone-400 to-stone-600', image: `${IMG_BASE}/hairstyle/straight.webp` },
  { id: 'bangs', en: 'Bangs', nl: 'Pony', gradient: 'from-stone-500 to-stone-700', image: `${IMG_BASE}/hairstyle/bangs.webp` },
  { id: 'curly', en: 'Curly', nl: 'Krullen', gradient: 'from-amber-600 to-amber-800', image: `${IMG_BASE}/hairstyle/curly.webp` },
  { id: 'bun', en: 'Bun', nl: 'Knot', gradient: 'from-stone-300 to-stone-500', image: `${IMG_BASE}/hairstyle/bun.webp` },
  { id: 'short', en: 'Short', nl: 'Kort', gradient: 'from-zinc-400 to-zinc-600', image: `${IMG_BASE}/hairstyle/short.webp` },
  { id: 'ponytail', en: 'Ponytail', nl: 'Staart', gradient: 'from-stone-400 to-amber-500', image: `${IMG_BASE}/hairstyle/ponytail.webp` },
];
const HAIR_COLORS = [
  { id: 'brunette', en: 'Brunette', nl: 'Brunette', color: '#5C3A1E', gradient: 'from-amber-800 to-amber-950', image: `${IMG_BASE}/haircolor/brunette.webp` },
  { id: 'blonde', en: 'Blonde', nl: 'Blond', color: '#D4A843', gradient: 'from-amber-200 to-amber-400', image: `${IMG_BASE}/haircolor/blonde.webp` },
  { id: 'black', en: 'Black', nl: 'Zwart', color: '#1a1a1a', gradient: 'from-zinc-800 to-zinc-950', image: `${IMG_BASE}/haircolor/black.webp` },
  { id: 'redhead', en: 'Redhead', nl: 'Rood', color: '#8B2500', gradient: 'from-red-700 to-red-900', image: `${IMG_BASE}/haircolor/redhead.webp` },
  { id: 'pink', en: 'Pink', nl: 'Roze', color: '#DB7093', gradient: 'from-pink-300 to-pink-500', image: `${IMG_BASE}/haircolor/pink.webp` },
];
const EYE_COLORS = [
  { id: 'brown', en: 'Brown', nl: 'Bruin', color: '#5C3317', gradient: 'from-amber-700 to-amber-900', image: `${IMG_BASE}/eyecolor/brown.webp` },
  { id: 'blue', en: 'Blue', nl: 'Blauw', color: '#4169E1', gradient: 'from-blue-400 to-blue-600', image: `${IMG_BASE}/eyecolor/blue.webp` },
  { id: 'green', en: 'Green', nl: 'Groen', color: '#2E8B57', gradient: 'from-emerald-400 to-emerald-600', image: `${IMG_BASE}/eyecolor/green.webp` },
];
const BODY_TYPES = [
  { id: 'skinny', en: 'Skinny', nl: 'Slank', gradient: 'from-rose-200 to-rose-400', image: `${IMG_BASE}/bodytype/skinny.webp` },
  { id: 'athletic', en: 'Athletic', nl: 'Atletisch', gradient: 'from-sky-300 to-sky-500', image: `${IMG_BASE}/bodytype/athletic.webp` },
  { id: 'average', en: 'Average', nl: 'Normaal', gradient: 'from-zinc-300 to-zinc-500', image: `${IMG_BASE}/bodytype/average.webp` },
  { id: 'curvy', en: 'Curvy', nl: 'Curvy', gradient: 'from-purple-300 to-purple-500', image: `${IMG_BASE}/bodytype/curvy.webp` },
  { id: 'bbw', en: 'BBW', nl: 'BBW', gradient: 'from-red-300 to-red-500', image: `${IMG_BASE}/bodytype/bbw.webp` },
];
const BREAST_SIZES = [
  { id: 'small', en: 'Small', nl: 'Klein', gradient: 'from-rose-100 to-rose-300', image: `${IMG_BASE}/breastsize/small.webp` },
  { id: 'medium', en: 'Medium', nl: 'Medium', gradient: 'from-rose-200 to-rose-400', image: `${IMG_BASE}/breastsize/medium.webp` },
  { id: 'large', en: 'Large', nl: 'Groot', gradient: 'from-rose-300 to-rose-500', image: `${IMG_BASE}/breastsize/large.webp` },
  { id: 'extra_large', en: 'Extra Large', nl: 'Extra Groot', gradient: 'from-rose-400 to-rose-600', image: `${IMG_BASE}/breastsize/extra_large.webp` },
];
const PERSONALITIES = [
  { id: 'shy', en: 'Shy', nl: 'Verlegen', icon: '🌸', gradient: 'from-pink-300 to-pink-500' },
  { id: 'dominant', en: 'Dominant', nl: 'Dominant', icon: '🔥', gradient: 'from-red-500 to-red-700' },
  { id: 'playful', en: 'Playful', nl: 'Speels', icon: '✨', gradient: 'from-amber-300 to-amber-500' },
  { id: 'romantic', en: 'Romantic', nl: 'Romantisch', icon: '💕', gradient: 'from-rose-400 to-rose-600' },
  { id: 'wild', en: 'Wild', nl: 'Wild', icon: '⚡', gradient: 'from-orange-400 to-orange-600' },
  { id: 'mysterious', en: 'Mysterious', nl: 'Mysterieus', icon: '🌙', gradient: 'from-indigo-400 to-indigo-600' },
  { id: 'submissive', en: 'Submissive', nl: 'Onderdanig', icon: '🎀', gradient: 'from-pink-200 to-pink-400' },
  { id: 'naughty', en: 'Naughty', nl: 'Stout', icon: '😈', gradient: 'from-purple-500 to-purple-700' },
];
const VOICES = ['Zephyr', 'Kore', 'Aoede', 'Leda'];

// ── Live Preview Panel ─────────────────────────────────────────────────────────
interface PreviewPanelProps {
  ethnicity: string;
  age: number;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  bodyType: string;
  breastSize: string;
  personality: string;
  name: string;
  generatedAvatar: string;
  stepIndex: number;
  isNL: boolean;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  ethnicity, age, hairStyle, hairColor, eyeColor, bodyType, personality, name, generatedAvatar, stepIndex, isNL
}) => {
  const ethObj    = ETHNICITIES.find(e => e.id === ethnicity);
  const hcObj     = HAIR_COLORS.find(h => h.id === hairColor);
  const persObj   = PERSONALITIES.find(p => p.id === personality);

  // How complete is the build? (0–9 steps before preview)
  const completionPct = Math.round((stepIndex / (STEPS.length - 1)) * 100);

  // Collect attribute chips for selected values
  const chips: { label: string; color: string }[] = [];
  if (ethnicity)   chips.push({ label: ethObj ? (isNL ? ethObj.nl : ethObj.en) : ethnicity, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' });
  if (age)         chips.push({ label: `${age}y`, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' });
  if (hairStyle) { const h = HAIR_STYLES.find(x => x.id === hairStyle); chips.push({ label: h ? (isNL ? h.nl : h.en) : hairStyle, color: 'bg-stone-500/20 text-stone-300 border-stone-500/30' }); }
  if (hairColor)   chips.push({ label: hcObj ? (isNL ? hcObj.nl : hcObj.en) : hairColor, color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' });
  if (eyeColor)  { const e = EYE_COLORS.find(x => x.id === eyeColor); chips.push({ label: e ? (isNL ? e.nl : e.en) : eyeColor, color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' }); }
  if (bodyType)  { const b = BODY_TYPES.find(x => x.id === bodyType); chips.push({ label: b ? (isNL ? b.nl : b.en) : bodyType, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }); }
  if (personality) chips.push({ label: `${persObj?.icon ?? ''} ${persObj ? (isNL ? persObj.nl : persObj.en) : personality}`, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' });

  return (
    <div className="sticky top-0 h-fit">
      <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-4 backdrop-blur-sm">
        {/* Avatar / silhouette */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-800 mb-3">
          {generatedAvatar ? (
            <img src={generatedAvatar} alt={name || 'preview'} className="w-full h-full object-cover" />
          ) : (
            <>
              {/* Gradient silhouette that gets richer as steps complete */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${ethObj ? `from-zinc-700 via-zinc-800` : 'from-zinc-800 via-zinc-900'} to-black transition-all duration-700`}
              />
              {/* Hair color overlay */}
              {hcObj && (
                <div className="absolute top-0 inset-x-0 h-1/3" style={{ background: `linear-gradient(to bottom, ${hcObj.color}66, transparent)` }} />
              )}
              {/* Eye color dots */}
              {eyeColor && (
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 flex gap-5">
                  {[0,1].map(i => <div key={i} className="w-3 h-3 rounded-full opacity-70" style={{ backgroundColor: EYE_COLORS.find(e => e.id === eyeColor)?.color ?? '#888' }} />)}
                </div>
              )}
              {/* Silhouette icon */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                <div className="text-6xl opacity-30 select-none">👤</div>
              </div>
              {/* Completion overlay */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Name */}
        <p className="text-center font-black text-white text-sm mb-3 min-h-[20px]">
          {name || <span className="text-zinc-600 font-normal text-xs">{isNL ? 'Nog geen naam...' : 'No name yet...'}</span>}
        </p>

        {/* Attribute chips */}
        <div className="flex flex-wrap gap-1.5">
          {chips.length === 0 && (
            <p className="text-[10px] text-zinc-700 italic">{isNL ? 'Kies attributen...' : 'Choose attributes...'}</p>
          )}
          {chips.map((chip, i) => (
            <span key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${chip.color}`}>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, language, onConsumeCredit }) => {
  const [step, setStep]               = useState<Step>('ethnicity');
  const [ethnicity, setEthnicity]     = useState('');
  const [age, setAge]                 = useState(21);
  const [hairStyle, setHairStyle]     = useState('');
  const [hairColor, setHairColor]     = useState('');
  const [eyeColor, setEyeColor]       = useState('');
  const [bodyType, setBodyType]       = useState('');
  const [breastSize, setBreastSize]   = useState('');
  const [personality, setPersonality] = useState('');
  const [name, setName]               = useState('');
  const [voice, setVoice]             = useState('Zephyr');
  const [generatedAvatar, setGeneratedAvatar] = useState('');
  const [isGenerating, setIsGenerating]       = useState(false);
  const [error, setError]             = useState('');
  const isMounted = useRef(true);
  const isNL = language === 'nl';

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const stepIndex = STEPS.indexOf(step);
  const label = (item: { nl: string; en: string }) => isNL ? item.nl : item.en;
  const goNext = () => { if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1]); };
  const goBack = () => { if (stepIndex > 0) setStep(STEPS[stepIndex - 1]); };

  const buildPrompt = () => {
    const eth = ETHNICITIES.find(e => e.id === ethnicity);
    const hs  = HAIR_STYLES.find(h => h.id === hairStyle);
    const hc  = HAIR_COLORS.find(h => h.id === hairColor);
    const ec  = EYE_COLORS.find(e => e.id === eyeColor);
    const bt  = BODY_TYPES.find(b => b.id === bodyType);
    const bs  = BREAST_SIZES.find(b => b.id === breastSize);
    return `beautiful ${eth?.en || 'caucasian'} woman, ${age} years old, ${bt?.en || 'average'} body type, ${bs?.en || 'medium'} breasts, ${hs?.en || 'straight'} ${hc?.en || 'brunette'} hair, ${ec?.en || 'brown'} eyes, portrait photo, looking at camera, seductive smile, soft warm lighting`;
  };

  const buildAppearance = () => {
    const eth = ETHNICITIES.find(e => e.id === ethnicity);
    const hs  = HAIR_STYLES.find(h => h.id === hairStyle);
    const hc  = HAIR_COLORS.find(h => h.id === hairColor);
    const ec  = EYE_COLORS.find(e => e.id === eyeColor);
    const bt  = BODY_TYPES.find(b => b.id === bodyType);
    const bs  = BREAST_SIZES.find(b => b.id === breastSize);
    const p   = PERSONALITIES.find(p => p.id === personality);
    return `${label(eth || ETHNICITIES[0])} ${label(bt || BODY_TYPES[2])} vrouw, ${age} jaar, ${label(hs || HAIR_STYLES[0])} ${label(hc || HAIR_COLORS[0])} haar, ${label(ec || EYE_COLORS[0])} ogen, ${label(bs || BREAST_SIZES[1])} borsten. ${label(p || PERSONALITIES[0])} persoonlijkheid.`;
  };

    const handleGenerate = async () => {
      if (!onConsumeCredit(10)) { setError(isNL ? 'Niet genoeg credits' : 'Not enough credits'); return; }
      setIsGenerating(true);
      setError('');
      try {
        const avatar = await geminiService.generateImage(buildPrompt());
        if (isMounted.current) setGeneratedAvatar(avatar);
      } catch (e: any) {
        console.error('[CharacterCreator] generateImage failed:', e);
        if (isMounted.current) {
          if (e?.message === 'INSUFFICIENT_CREDITS') {
            setError(isNL ? 'Niet genoeg credits' : 'Not enough credits');
          } else if (e?.message === 'UNAUTHORIZED') {
            setError(isNL ? 'Niet ingelogd, herlaad de pagina' : 'Not logged in, reload the page');
          } else {
            setError((isNL ? 'Generatie mislukt: ' : 'Generation failed: ') + (e?.message || 'unknown error'));
          }
        }
      } finally {
        if (isMounted.current) setIsGenerating(false);
      }
    };

  const handleSave = () => {
    const p = PERSONALITIES.find(p => p.id === personality);
    onSave({
      id: `custom_${Date.now()}`,
      name,
      desc: buildAppearance(),
      appearance: buildPrompt(),
      video: '',
      avatar: generatedAvatar || 'https://storage.googleapis.com/foto1982/logo.jpeg',
      voice,
      isCustom: true,
      personality: p ? [p.en.toLowerCase()] : [],
      traits: [ethnicity, hairStyle, hairColor, eyeColor, bodyType, breastSize].filter(Boolean),
    });
  };

  const canProceed = () => {
    switch (step) {
      case 'ethnicity': return !!ethnicity;
      case 'age': return true;
      case 'hairStyle': return !!hairStyle;
      case 'hairColor': return !!hairColor;
      case 'eyeColor': return !!eyeColor;
      case 'bodyType': return !!bodyType;
      case 'breastSize': return !!breastSize;
      case 'personality': return !!personality;
      case 'name': return name.trim().length > 0;
      case 'preview': return !!generatedAvatar;
      default: return false;
    }
  };

  const ImageCard = ({ selected, onClick, label: cardLabel, gradient, icon, image }: {
    selected: boolean; onClick: () => void; label: string; gradient: string; icon?: string; image?: string;
  }) => (
    <button onClick={onClick}
      className={`relative overflow-hidden rounded-2xl transition-all duration-300 group ${selected ? 'ring-[3px] ring-white scale-[1.03] shadow-[0_0_25px_rgba(255,255,255,0.3)]' : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.02]'}`}
      style={{ aspectRatio: '3/4' }}
    >
      {image ? (
        <img src={image} alt={cardLabel} className="absolute inset-0 w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/30" />
        </>
      )}
      {selected && (
        <div className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
          <Icons.Check size={14} className="text-black" />
        </div>
      )}
      {icon && <div className="absolute inset-0 flex items-center justify-center z-10"><span className="text-4xl drop-shadow-lg">{icon}</span></div>}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent z-10">
        <p className="text-white text-xs font-bold text-center drop-shadow-lg">{cardLabel}</p>
      </div>
    </button>
  );

  const SectionTitle = ({ text }: { text: string }) => (
    <h3 className="text-center font-black text-xl md:text-2xl text-white tracking-tight mb-5">
      <span className="relative inline-block">
        {text}
        <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full" />
      </span>
    </h3>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 no-scrollbar safe-pb h-full">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">

        {/* Progress bar */}
        <div className="flex items-center gap-1 mb-8 px-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-gradient-to-r from-rose-500 to-pink-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-white/10'}`} />
          ))}
        </div>

        {/* Two-column layout on desktop: left = step content, right = live preview */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* LEFT: Step content */}
          <div className="flex-1 min-w-0">
            {stepIndex > 0 && (
              <button onClick={goBack} className="flex items-center gap-1.5 text-white/40 text-sm mb-5 hover:text-white/70 transition-colors">
                <Icons.ChevronLeft size={16} /> {isNL ? 'Terug' : 'Back'}
              </button>
            )}

            {step === 'ethnicity' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Etniciteit' : 'Choose Ethnicity'} />
                <div className="grid grid-cols-3 gap-3 md:grid-cols-3">
                  {ETHNICITIES.map(e => <ImageCard key={e.id} selected={ethnicity === e.id} onClick={() => setEthnicity(e.id)} label={label(e)} gradient={e.gradient} image={e.image} />)}
                </div>
              </div>
            )}

            {step === 'age' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Leeftijd' : 'Choose Age'} />
                <div className="bg-zinc-900/80 rounded-3xl border border-white/10 p-6 md:p-8 backdrop-blur-sm">
                  <div className="text-center mb-8">
                    <span className="inline-block px-5 py-2 rounded-xl border-2 border-rose-500/50 bg-rose-500/10 text-rose-400 font-black text-2xl tracking-wide">
                      {age} {isNL ? 'Jaar' : 'Years'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">18</span>
                    <div className="flex-1 relative">
                      <input type="range" min={18} max={55} value={age} onChange={e => setAge(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right, #f43f5e ${((age - 18) / 37) * 100}%, rgba(255,255,255,0.1) ${((age - 18) / 37) * 100}%)` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">55+</span>
                  </div>
                </div>
              </div>
            )}

            {step === 'hairStyle' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Haarstijl' : 'Choose Hair Style'} />
                <div className="grid grid-cols-3 gap-3">
                  {HAIR_STYLES.map(h => <ImageCard key={h.id} selected={hairStyle === h.id} onClick={() => setHairStyle(h.id)} label={label(h)} gradient={h.gradient} image={h.image} />)}
                </div>
              </div>
            )}

            {step === 'hairColor' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Haarkleur' : 'Choose Hair Color'} />
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                  {HAIR_COLORS.map(h => <ImageCard key={h.id} selected={hairColor === h.id} onClick={() => setHairColor(h.id)} label={label(h)} gradient={h.gradient} image={h.image} />)}
                </div>
              </div>
            )}

            {step === 'eyeColor' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Oogkleur' : 'Choose Eye Color'} />
                <div className="grid grid-cols-3 gap-3">
                  {EYE_COLORS.map(e => <ImageCard key={e.id} selected={eyeColor === e.id} onClick={() => setEyeColor(e.id)} label={label(e)} gradient={e.gradient} image={e.image} />)}
                </div>
              </div>
            )}

            {step === 'bodyType' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Lichaamstype' : 'Choose Body Type'} />
                <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
                  {BODY_TYPES.map(b => <ImageCard key={b.id} selected={bodyType === b.id} onClick={() => setBodyType(b.id)} label={label(b)} gradient={b.gradient} image={b.image} />)}
                </div>
              </div>
            )}

            {step === 'breastSize' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Borstgrootte' : 'Choose Breast Size'} />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {BREAST_SIZES.map(b => <ImageCard key={b.id} selected={breastSize === b.id} onClick={() => setBreastSize(b.id)} label={label(b)} gradient={b.gradient} image={b.image} />)}
                </div>
              </div>
            )}

            {step === 'personality' && (
              <div>
                <SectionTitle text={isNL ? 'Kies Persoonlijkheid' : 'Choose Personality'} />
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {PERSONALITIES.map(p => <ImageCard key={p.id} selected={personality === p.id} onClick={() => setPersonality(p.id)} label={label(p)} gradient={p.gradient} icon={p.icon} />)}
                </div>
              </div>
            )}

            {step === 'name' && (
              <div>
                <SectionTitle text={isNL ? 'Geef Haar Een Naam' : 'Give Her A Name'} />
                <div className="bg-zinc-900/80 rounded-3xl border border-white/10 p-6 md:p-8 space-y-6 backdrop-blur-sm">
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder={isNL ? 'Typ een naam...' : 'Type a name...'} maxLength={20}
                    className="w-full bg-transparent border-b-2 border-white/20 text-center text-white font-black text-3xl focus:outline-none focus:border-rose-500 transition-colors pb-3 placeholder-white/20"
                  />
                  <div>
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest block text-center mb-3">{isNL ? 'STEM' : 'VOICE'}</label>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {VOICES.map(v => (
                        <button key={v} onClick={() => setVoice(v)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${voice === v ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-105' : 'bg-white/5 text-white/50 border border-white/10 hover:border-white/30'}`}>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="w-52 h-52 rounded-full overflow-hidden border-4 border-white/20 shadow-[0_0_40px_rgba(244,63,94,0.2)] bg-zinc-900 flex items-center justify-center">
                  {isGenerating ? (
                    <div className="text-center space-y-3 animate-pulse">
                      <Icons.Sparkles className="text-rose-400 mx-auto" size={40} />
                      <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">{isNL ? 'GENEREREN...' : 'GENERATING...'}</p>
                    </div>
                  ) : generatedAvatar ? (
                    <img src={generatedAvatar} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center space-y-3 p-4">
                      <Icons.Sparkles className="text-white/20 mx-auto" size={36} />
                      <p className="text-[10px] text-white/30">{isNL ? 'Genereer avatar' : 'Generate avatar'}</p>
                    </div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-3xl font-black text-white">{name}</h3>
                  <p className="text-white/40 text-xs max-w-sm">{buildAppearance()}</p>
                </div>
                {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                <button onClick={handleGenerate} disabled={isGenerating}
                  className="w-full max-w-sm py-4 rounded-2xl text-sm font-black tracking-widest disabled:opacity-30 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_40px_rgba(244,63,94,0.6)] transition-all duration-300">
                  <Icons.Sparkles size={16} />
                  {generatedAvatar ? (isNL ? 'OPNIEUW GENEREREN (10 CR)' : 'REGENERATE (10 CR)') : (isNL ? 'GENEREER AVATAR (10 CR)' : 'GENERATE AVATAR (10 CR)')}
                </button>
                {generatedAvatar && !isGenerating && (
                  <button onClick={handleSave}
                    className="w-full max-w-sm py-4 rounded-2xl text-sm font-black tracking-widest bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all duration-300">
                    {isNL ? 'OPSLAAN & GEBRUIKEN' : 'SAVE & USE'}
                  </button>
                )}
              </div>
            )}

            {step !== 'preview' && (
              <button onClick={goNext} disabled={!canProceed()}
                className="mt-8 w-full py-4 rounded-2xl text-sm font-black tracking-widest uppercase transition-all duration-300 disabled:opacity-20 disabled:cursor-not-allowed bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600 text-white shadow-[0_0_25px_rgba(244,63,94,0.3)] hover:shadow-[0_0_35px_rgba(244,63,94,0.5)] flex items-center justify-center gap-2">
                {isNL ? 'VOLGENDE' : 'NEXT'} <span className="text-lg">→</span>
              </button>
            )}

            <p className="text-center text-white/20 text-[10px] mt-5 tracking-widest">
              {stepIndex + 1} / {STEPS.length}
            </p>
          </div>

          {/* RIGHT: Live Preview (desktop only — hidden on mobile below step content) */}
          <div className="md:w-56 shrink-0">
            {/* Mobile: compact horizontal strip */}
            <div className="md:hidden mb-6 bg-zinc-900/60 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 shrink-0 relative">
                {generatedAvatar ? (
                  <img src={generatedAvatar} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">👤</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-black truncate">{name || (isNL ? 'Geen naam' : 'No name')}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {[ethnicity, hairColor, personality].filter(Boolean).slice(0, 3).map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded-full text-[8px] text-zinc-300 font-bold">{v}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] text-zinc-500 uppercase font-bold">{stepIndex + 1}/{STEPS.length}</p>
                <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.round((stepIndex / (STEPS.length - 1)) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Desktop: tall preview panel */}
            <div className="hidden md:block">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-3">{isNL ? 'LIVE PREVIEW' : 'LIVE PREVIEW'}</p>
              <PreviewPanel
                ethnicity={ethnicity}
                age={age}
                hairStyle={hairStyle}
                hairColor={hairColor}
                eyeColor={eyeColor}
                bodyType={bodyType}
                breastSize={breastSize}
                personality={personality}
                name={name}
                generatedAvatar={generatedAvatar}
                stepIndex={stepIndex}
                isNL={isNL}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
