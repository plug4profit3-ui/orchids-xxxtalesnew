
import React, { useState, useEffect } from 'react';
import Icons from './Icon';
import { getLegalTexts } from '../constants';
import { LegalSection, Language } from '../types';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'privacy' | 'terms';
  language?: Language;
}

const SectionRenderer: React.FC<{ section: LegalSection }> = ({ section }) => {
  return (
    <div>
      <h3 className="text-xl text-white font-headline font-bold mb-2">{section.title}</h3>
      {Array.isArray(section.content) ? (
        section.content.map((p, i) => <p key={i} className="mb-2">{p}</p>)
      ) : (
        <p className="mb-2">{section.content}</p>
      )}
      
      {section.list && (
        <ul className="list-disc pl-5 space-y-1 mb-4">
          {section.list.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}

      {section.subSections && section.subSections.map((sub, i) => (
        <div key={i} className="mt-4">
          {sub.title && <h4 className="text-white font-bold mb-1">{sub.title}</h4>}
          {sub.content && <p className="mb-1">{sub.content}</p>}
          {sub.list && (
            <ul className="list-disc pl-5 space-y-1">
              {sub.list.map((item, j) => {
                 if (typeof item === 'string') return <li key={j}>{item}</li>;
                 return <li key={j}><strong>{item.label}</strong> {item.text}</li>;
              })}
            </ul>
          )}
        </div>
      ))}

      {section.warningText && (
        <p className="mt-2 text-red-400 font-bold">{section.warningText}</p>
      )}
    </div>
  );
};

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, initialTab, language = 'nl' }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(initialTab);
  const legalData = getLegalTexts(language as string);
  const labels = legalData.labels;

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />
        
        <div className="relative w-full max-w-3xl bg-[#0a0a0a] border border-gold-500/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gold-500/10 rounded-lg border border-gold-500/20 text-gold-500">
                        {activeTab === 'privacy' ? <Icons.ShieldCheck size={24} /> : <Icons.Scale size={24} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-headline font-black text-white uppercase tracking-wider">
                           {activeTab === 'privacy' ? labels.privacy_title : labels.terms_title}
                        </h2>
                        <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{labels.last_updated}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
                    <Icons.X size={20} />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button 
                    onClick={() => setActiveTab('privacy')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'privacy' ? 'bg-gold-500/10 text-gold-500 border-b-2 border-gold-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                    {labels.privacy_title}
                </button>
                <button 
                    onClick={() => setActiveTab('terms')}
                    className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'terms' ? 'bg-gold-500/10 text-gold-500 border-b-2 border-gold-500' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
                >
                    {labels.terms_title}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-black/50">
                <div className="space-y-6 text-sm text-zinc-300 leading-relaxed font-body">
                    {activeTab === 'privacy' 
                       ? legalData.privacy.map((section, idx) => <SectionRenderer key={idx} section={section} />)
                       : legalData.terms.map((section, idx) => <SectionRenderer key={idx} section={section} />)
                    }
                    <div className="pt-4 border-t border-white/10">
                        <p className="font-bold text-white">{labels.contact}</p>
                        <p>E-mail: <a href="mailto:contact@xxx-tales.nl" className="text-gold-500 hover:underline">contact@xxx-tales.nl</a></p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end">
                <button onClick={onClose} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                    {labels.close}
                </button>
            </div>
        </div>
    </div>
  );
};

export default LegalModal;
