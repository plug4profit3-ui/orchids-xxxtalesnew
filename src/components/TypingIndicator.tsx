import React, { useEffect, useState } from 'react';
import { TypingIndicatorConfig, TypingIndicatorState } from '../types';
import { feedbackService } from '../services/memoryService';

interface TypingIndicatorProps {
  state: TypingIndicatorState;
  characterName?: string;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  state, 
  characterName,
  className = '' 
}) => {
  const [config, setConfig] = useState<TypingIndicatorConfig | null>(null);

  useEffect(() => {
    const indicatorConfig = feedbackService.getTypingIndicator(state, {});
    setConfig(indicatorConfig);
  }, [state]);

  if (!config) return null;

  const getAnimationClass = () => {
    switch (config.animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'breathe':
        return 'animate-breathe';
      case 'heartbeat':
        return 'animate-heartbeat';
      case 'shake':
        return 'animate-shake';
      default:
        return 'animate-pulse';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm ${className}`}>
      <div className={`flex gap-1 ${getAnimationClass()}`}>
        <span className="w-2 h-2 bg-pink-500 rounded-full animate-dot-1" />
        <span className="w-2 h-2 bg-pink-500 rounded-full animate-dot-2" />
        <span className="w-2 h-2 bg-pink-500 rounded-full animate-dot-3" />
      </div>
      <span className="text-sm text-gray-600 italic">
        {characterName ? `${characterName} ${config.message}` : config.message}
      </span>
    </div>
  );
};

export default TypingIndicator;
