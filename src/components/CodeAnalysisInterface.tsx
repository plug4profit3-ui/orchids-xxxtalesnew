import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { ELITE_FULLSTACK_ARCHITECT_PROMPT } from '../constants';
import { geminiService } from '../services/geminiService';
import Icons from './Icon';

interface CodeAnalysisInterfaceProps {
  language: Language;
}

const CodeAnalysisInterface: React.FC<CodeAnalysisInterfaceProps> = ({ language }) => {
  const [projectName, setProjectName] = useState('');
  const [contextFiles, setContextFiles] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const abortRef = useRef<(() => void) | null>(null);

  const handleAnalyze = async () => {
    if (!projectName.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysis('');

    const fullPrompt = `${ELITE_FULLSTACK_ARCHITECT_PROMPT.replace('[naam van je app/project]', projectName)}

**Context:**
${contextFiles || 'Geen specifieke bestanden opgegeven. Analyseer de algemene architectuur.'}`;

    try {
      const response = await geminiService.analyzeCode(fullPrompt, (chunk) => {
        setAnalysis(prev => prev + chunk);
      });
      
      if (!response && !analysis) {
        setAnalysis('Er is een fout opgetreden bij de analyse. Probeer het opnieuw.');
      }
    } catch (error) {
      setAnalysis('Er is een fout opgetreden bij de analyse. Probeer het opnieuw.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStop = () => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setIsAnalyzing(false);
  };

  const getTexts = () => {
    const texts: Record<string, any> = {
      nl: {
        title: 'ELITE FULL-STACK ARCHITECT',
        subtitle: 'Diepgaande Code Analyse',
        projectLabel: 'Project Naam',
        projectPlaceholder: 'Bijv. MyAwesomeApp',
        contextLabel: 'Context (optioneel)',
        contextPlaceholder: 'Noem specifieke bestanden of componenten die cruciaal zijn...',
        analyzeBtn: 'START ANALYSE',
        analyzing: 'BEZIG MET ANALYSEREN...',
        stopBtn: 'STOP',
        tipsTitle: 'Tips voor het beste resultaat:',
        tips: [
          'Geef context: Noem specifieke bestanden die cruciaal zijn.',
          'Vraag om een Code Audit voor regel-voor-regel verbeteringen.',
          'Gebruik een iteratieve aanpak: analyse eerst, implementeer dan.'
        ]
      },
      en: {
        title: 'ELITE FULL-STACK ARCHITECT',
        subtitle: 'Deep Code Analysis',
        projectLabel: 'Project Name',
        projectPlaceholder: 'E.g. MyAwesomeApp',
        contextLabel: 'Context (optional)',
        contextPlaceholder: 'Mention specific files or components that are crucial...',
        analyzeBtn: 'START ANALYSIS',
        analyzing: 'ANALYZING...',
        stopBtn: 'STOP',
        tipsTitle: 'Tips for best results:',
        tips: [
          'Give context: Mention specific files that are crucial.',
          'Ask for a Code Audit for line-by-line improvements.',
          'Use an iterative approach: analyze first, then implement.'
        ]
      },
      de: {
        title: 'ELITE FULL-STACK ARCHITECT',
        subtitle: 'Tiefgehende Code-Analyse',
        projectLabel: 'Projektname',
        projectPlaceholder: 'Z.B. MyAwesomeApp',
        contextLabel: 'Kontext (optional)',
        contextPlaceholder: 'Erwähnen Sie wichtige Dateien oder Komponenten...',
        analyzeBtn: 'ANALYSE STARTEN',
        analyzing: 'ANALYSE LÄUFT...',
        stopBtn: 'STOPP',
        tipsTitle: 'Tipps für beste Ergebnisse:',
        tips: [
          'Geben Sie Kontext: Erwähnen Sie wichtige Dateien.',
          'Fordern Sie ein Code Audit für zeilenweise Verbesserungen an.',
          'Verwenden Sie einen iterativen Ansatz: zuerst analysieren, dann implementieren.'
        ]
      },
      fr: {
        title: 'ELITE FULL-STACK ARCHITECT',
        subtitle: 'Analyse de Code Profonde',
        projectLabel: 'Nom du Projet',
        projectPlaceholder: 'Ex. MyAwesomeApp',
        contextLabel: 'Contexte (optionnel)',
        contextPlaceholder: 'Mentionnez les fichiers ou composants cruciaux...',
        analyzeBtn: 'DÉMARRER L\'ANALYSE',
        analyzing: 'ANALYSE EN COURS...',
        stopBtn: 'ARRÊT',
        tipsTitle: 'Conseils pour de meilleurs résultats:',
        tips: [
          'Donnez du contexte: Mentionnez les fichiers importants.',
          'Demandez un Code Audit pour des améliorations ligne par ligne.',
          'Utilisez une approche itérative: analysez d\'abord, puis implémentez.'
        ]
      },
      it: {
        title: 'ELITE FULL-STACK ARCHITECT',
        subtitle: 'Analisi del Codice Approfondita',
        projectLabel: 'Nome Progetto',
        projectPlaceholder: 'Es. MyAwesomeApp',
        contextLabel: 'Contesto (opzionale)',
        contextPlaceholder: 'Menziona file o componenti cruciali...',
        analyzeBtn: 'AVVIA ANALISI',
        analyzing: 'ANALISI IN CORSO...',
        stopBtn: 'FERMA',
        tipsTitle: 'Consigli per i migliori risultati:',
        tips: [
          'Fornisci contesto: Menziona i file importanti.',
          'Chiedi un Code Audit per miglioramenti riga per riga.',
          'Usa un approccio iterativo: analizza prima, poi implementa.'
        ]
      },
      es: {
        title: 'ELITE FULL-STACK ARCHITECT',
        subtitle: 'Análisis de Código Profundo',
        projectLabel: 'Nombre del Proyecto',
        projectPlaceholder: 'Ej. MyAwesomeApp',
        contextLabel: 'Contexto (opcional)',
        contextPlaceholder: 'Menciona archivos o componentes cruciales...',
        analyzeBtn: 'INICIAR ANÁLISIS',
        analyzing: 'ANALIZANDO...',
        stopBtn: 'DETENER',
        tipsTitle: 'Consejos para mejores resultados:',
        tips: [
          'Proporciona contexto: Menciona archivos importantes.',
          'Solicita un Code Audit para mejoras línea por línea.',
          'Usa un enfoque iterativo: analiza primero, luego implementa.'
        ]
      }
    };
    return texts[language.split('-')[0]] || texts['en'];
  };

  const t = getTexts();

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Icons.Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{t.title}</h2>
            <p className="text-sm text-white/60">{t.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">{t.projectLabel}</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t.projectPlaceholder}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">{t.contextLabel}</label>
          <textarea
            value={contextFiles}
            onChange={(e) => setContextFiles(e.target.value)}
            placeholder={t.contextPlaceholder}
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
          />
        </div>

        <button
          onClick={isAnalyzing ? handleStop : handleAnalyze}
          disabled={!projectName.trim() && !isAnalyzing}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
            isAnalyzing
              ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center gap-2">
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              {t.analyzing}
            </span>
          ) : (
            t.analyzeBtn
          )}
        </button>
      </div>

      {/* Analysis Output */}
      {analysis && (
        <div className="flex-1 min-h-0 bg-white/5 border border-white/10 rounded-xl p-4 overflow-auto">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-mono text-sm text-white/90 leading-relaxed">
              {analysis}
            </pre>
          </div>
        </div>
      )}

      {/* Tips Section */}
      {!analysis && !isAnalyzing && (
        <div className="mt-auto pt-4 border-t border-white/10">
          <h3 className="text-sm font-semibold text-white/80 mb-3">{t.tipsTitle}</h3>
          <ul className="space-y-2">
            {t.tips.map((tip: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/60">
                <span className="text-purple-400 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CodeAnalysisInterface;