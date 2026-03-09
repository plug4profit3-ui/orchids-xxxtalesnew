
import React, { useMemo } from 'react';
import { GeneratedImage, Language } from '../types';
import Icons from './Icon';
import { getCharacters, getTexts } from '../constants';

interface ImagineInterfaceProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: (e: React.FormEvent) => void;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  language?: Language;
}

const ImagineInterface: React.FC<ImagineInterfaceProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  isGenerating,
  generatedImages,
  language = 'nl'
}) => {
  const t = getTexts(language as string).imagine;

  const promptTemplates: Record<string, { icon: string; label: string; prompt: string }[]> = {
    nl: [
      { icon: '🏨', label: 'Hotelkamer', prompt: 'Mooie vrouw in lingerie in een luxe hotelkamer, zacht licht, romantisch' },
      { icon: '🏖️', label: 'Strand', prompt: 'Vrouw in bikini op een tropisch strand bij zonsondergang, warm licht' },
      { icon: '🛁', label: 'Bad', prompt: 'Vrouw in een bubbelbad met kaarslicht, sensueel en mysterieus' },
      { icon: '🛏️', label: 'Slaapkamer', prompt: 'Vrouw op zijden lakens in slaapkamer, zachte verlichting, intiem' },
      { icon: '👙', label: 'Lingerie', prompt: 'Close-up vrouw in zwarte kant lingerie, donkere achtergrond, elegant' },
      { icon: '🌙', label: 'Nacht', prompt: 'Vrouw bij maanlicht op balkon, romantisch, silhouet' },
    ],
    en: [
      { icon: '🏨', label: 'Hotel Room', prompt: 'Beautiful woman in lingerie in a luxury hotel room, soft lighting, romantic' },
      { icon: '🏖️', label: 'Beach', prompt: 'Woman in bikini on a tropical beach at sunset, warm light' },
      { icon: '🛁', label: 'Bath', prompt: 'Woman in a bubble bath with candlelight, sensual and mysterious' },
      { icon: '🛏️', label: 'Bedroom', prompt: 'Woman on silk sheets in bedroom, soft lighting, intimate' },
      { icon: '👙', label: 'Lingerie', prompt: 'Close-up woman in black lace lingerie, dark background, elegant' },
      { icon: '🌙', label: 'Night', prompt: 'Woman in moonlight on balcony, romantic, silhouette' },
    ],
  };
  const templates = promptTemplates[language] || promptTemplates['en'];

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `xxx-tales-image-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ambientVideo = useMemo(() => {
    const chars = getCharacters(language as Language).filter(c => c.video);
    if (chars.length === 0) return "https://storage.googleapis.com/foto1982/claudia.mp4";
    return chars[Math.floor(Math.random() * chars.length)].video;
  }, [language]);

  return (
    <div className="flex flex-col h-full bg-black overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <video src={ambientVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-100 scale-100" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 z-10 no-scrollbar relative">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-4 pt-10">
            <h2 className="text-5xl md:text-7xl font-headline font-black text-shine uppercase tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,1)]">{t.title}</h2>
            <p className="text-zinc-200 text-[11px] tracking-[0.5em] uppercase font-black drop-shadow-lg">{t.subtitle}</p>
          </div>

          <div className="glass-premium p-3 rounded-[2.5rem] border-gold-500/30 shadow-2xl backdrop-blur-2xl bg-black/70">
              <form onSubmit={onGenerate} className="flex flex-col md:flex-row gap-3">
                <input type="text" value={prompt} onChange={(e) => onPromptChange(e.target.value)} placeholder={t.placeholder} className="flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus:ring-0 px-8 py-5 text-lg font-body" disabled={isGenerating} />
                <button type="submit" disabled={!prompt.trim() || isGenerating} className="btn-premium px-12 py-5 rounded-[1.5rem] flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 transition-all shadow-xl">
                  {isGenerating ? (<Icons.RefreshCw className="animate-spin" size={24} />) : (<div className="flex items-center gap-3"><Icons.Sparkles size={24} /><span className="text-[12px] font-black uppercase tracking-widest">{t.generate}</span></div>)}
                </button>
              </form>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {templates.map((tmpl, i) => (
                <button key={i} onClick={() => onPromptChange(tmpl.prompt)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-zinc-300 text-xs font-bold hover:border-gold-500/50 hover:text-gold-500 transition-all active:scale-95 whitespace-nowrap">
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.label}</span>
                </button>
              ))}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
            {generatedImages.length === 0 && !isGenerating ? (
               <div className="col-span-full text-center py-32 border-2 border-dashed border-white/10 rounded-[4rem] bg-black/60 backdrop-blur-md">
                  <Icons.Image size={64} className="mx-auto text-zinc-800 mb-8 opacity-50" />
                  <p className="text-zinc-500 uppercase text-[12px] font-black tracking-[0.4em]">{t.no_images}</p>
               </div>
            ) : (
              generatedImages.slice().reverse().map((img, idx) => (
                <div key={idx} className="group relative aspect-square bg-zinc-900 rounded-[3.5rem] overflow-hidden border-2 border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-700">
                  <img
                    src={img.url}
                    alt={img.prompt}
                    className="w-full h-full object-cover transition-transform group-hover:scale-115"
                    style={{ transitionDuration: '3s' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-10">
                    <p className="text-white text-base font-body italic mb-8 line-clamp-3 drop-shadow-xl leading-relaxed">"{img.prompt}"</p>
                    <button onClick={() => handleDownload(img.url, idx)} className="self-end p-5 bg-gold-500 text-black rounded-full hover:scale-110 transition-transform shadow-2xl active:scale-90"><Icons.Download size={24} /></button>
                  </div>
                </div>
              ))
            )}
            
            {isGenerating && (
               <div className="aspect-square bg-black/60 backdrop-blur-3xl rounded-[3.5rem] border-2 border-gold-500/40 flex flex-col items-center justify-center animate-pulse shadow-2xl">
                  <div className="relative mb-8">
                      <div className="absolute inset-0 bg-gold-500 rounded-full animate-ping opacity-20"></div>
                      <Icons.Sparkles className="text-gold-500 relative z-10" size={64} />
                  </div>
                  <span className="text-gold-500 text-[12px] font-black uppercase tracking-[0.6em]">{t.visualizing}</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagineInterface;
