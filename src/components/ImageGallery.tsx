import React, { useMemo } from 'react';
import { ChatSession, Language } from '../types';
import { getTexts } from '../constants';
import Icons from './Icon';

interface ImageGalleryProps {
  sessions: ChatSession[];
  language: Language;
  onToggleSidebar?: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ sessions, language, onToggleSidebar }) => {
  const t = getTexts(language as string);

  const images = useMemo(() => {
    const result: { url: string; characterName: string; timestamp: number; prompt?: string }[] = [];
    for (const session of sessions) {
      for (const msg of session.messages) {
        if (msg.imageUrl && msg.role === 'model') {
          result.push({
            url: msg.imageUrl,
            characterName: session.title || 'Onbekend',
            timestamp: msg.timestamp,
          });
        }
      }
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [sessions]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      <div className="relative z-50 p-6 flex flex-col gap-3 pt-safe">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-black text-shine uppercase tracking-tighter">
              {language === 'nl' ? 'Afbeeldingen' : language === 'de' ? 'Bilder' : language === 'fr' ? 'Images' : language === 'es' ? 'Imágenes' : language === 'it' ? 'Immagini' : 'Images'}
            </h2>
            <p className="text-gold-500/90 text-[10px] uppercase font-black tracking-widest mt-1">
              {images.length} {language === 'nl' ? 'afbeeldingen' : language === 'de' ? 'Bilder' : language === 'fr' ? 'images' : language === 'es' ? 'imágenes' : language === 'it' ? 'immagini' : 'images'}
            </p>
          </div>
          {onToggleSidebar && (
            <button onClick={onToggleSidebar} className="md:hidden p-3 text-gold-500 bg-white/5 rounded-full border border-gold-500/20 active:scale-90 transition-all shadow-lg backdrop-blur-md">
              <Icons.Menu size={24} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-32 relative z-10">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Icons.Images size={48} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm font-bold">
              {language === 'nl' ? 'Nog geen afbeeldingen gegenereerd' : language === 'de' ? 'Noch keine Bilder generiert' : language === 'fr' ? 'Aucune image générée' : language === 'es' ? 'Sin imágenes generadas' : language === 'it' ? 'Nessuna immagine generata' : 'No images generated yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
            {images.map((img, i) => (
              <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 hover:border-gold-500/50 transition-all cursor-pointer" onClick={() => window.open(img.url, '_blank')}>
                <img src={img.url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-[10px] font-bold truncate">{img.characterName}</p>
                    <p className="text-zinc-400 text-[9px]">{new Date(img.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;
