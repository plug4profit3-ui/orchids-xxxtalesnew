import React from 'react';
import Icons from './Icon';
import { Language } from '../types';

interface ProgressIndicatorProps {
  progress: number;
  status: 'generating' | 'processing' | 'completed' | 'error';
  language?: Language;
  onCancel?: () => void;
  estimatedTime?: string;
}

const LABELS: Record<string, {
  generating: string;
  processing: string;
  completed: string;
  error: string;
  cancel: string;
  eta: string;
}> = {
  nl: {
    generating: 'Genereren...',
    processing: 'Verwerken...',
    completed: 'Voltooid!',
    error: 'Fout opgetreden',
    cancel: 'Annuleren',
    eta: 'Geschatte tijd',
  },
  en: {
    generating: 'Generating...',
    processing: 'Processing...',
    completed: 'Completed!',
    error: 'Error occurred',
    cancel: 'Cancel',
    eta: 'Estimated time',
  },
  de: {
    generating: 'Generieren...',
    processing: 'Verarbeiten...',
    completed: 'Abgeschlossen!',
    error: 'Fehler aufgetreten',
    cancel: 'Abbrechen',
    eta: 'Geschätzte Zeit',
  },
  fr: {
    generating: 'Génération...',
    processing: 'Traitement...',
    completed: 'Terminé!',
    error: 'Erreur survenue',
    cancel: 'Annuler',
    eta: 'Temps estimé',
  },
  es: {
    generating: 'Generando...',
    processing: 'Procesando...',
    completed: '¡Completado!',
    error: 'Ocurrió un error',
    cancel: 'Cancelar',
    eta: 'Tiempo estimado',
  },
  it: {
    generating: 'Generazione...',
    processing: 'Elaborazione...',
    completed: 'Completato!',
    error: 'Si è verificato un errore',
    cancel: 'Annulla',
    eta: 'Tempo stimato',
  },
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  status,
  language = 'nl',
  onCancel,
  estimatedTime,
}) => {
  const t = LABELS[language] || LABELS['en'];
  
  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Icons.Sparkles className="text-gold-500" size={24} />;
      case 'processing':
        return <Icons.Settings className="text-blue-500 animate-spin" size={24} />;
      case 'completed':
        return <Icons.Check className="text-emerald-500" size={24} />;
      case 'error':
        return <Icons.AlertCircle className="text-red-500" size={24} />;
      default:
        return <Icons.Sparkles className="text-gold-500" size={24} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'generating': return t.generating;
      case 'processing': return t.processing;
      case 'completed': return t.completed;
      case 'error': return t.error;
      default: return t.generating;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'generating': return 'from-gold-500 to-yellow-500';
      case 'processing': return 'from-blue-500 to-cyan-500';
      case 'completed': return 'from-emerald-500 to-green-500';
      case 'error': return 'from-red-500 to-orange-500';
      default: return 'from-gold-500 to-yellow-500';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-bold text-white">{getStatusText()}</h3>
            <p className="text-xs text-zinc-500">{progress}% {t.completed.toLowerCase()}</p>
          </div>
        </div>
        
        {status !== 'completed' && status !== 'error' && onCancel && (
          <button 
            onClick={onCancel}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-lg hover:bg-zinc-800"
          >
            <Icons.X size={20} />
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500">{t.eta}:</span>
        <span className="font-medium text-white">{estimatedTime || '--'}</span>
      </div>

      {status === 'error' && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">Probeer het later opnieuw of neem contact op met support.</p>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;