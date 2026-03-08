import React from 'react';
import { UserCharacterMemory } from '../types';

interface MemoryIndicatorProps {
  memory: UserCharacterMemory | null;
  onClose?: () => void;
  className?: string;
}

export const MemoryIndicator: React.FC<MemoryIndicatorProps> = ({ 
  memory, 
  onClose,
  className = '' 
}) => {
  if (!memory || !memory.keyFacts || memory.keyFacts.length === 0) {
    return null;
  }

  // Select a random memory to display
  const randomFact = memory.keyFacts[Math.floor(Math.random() * memory.keyFacts.length)];

  return (
    <div className={`bg-gradient-to-r from-pink-50 to-purple-50 border-l-4 border-pink-500 p-4 rounded-r-lg shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">💭</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-pink-800 mb-1">
            Herinner je nog...
          </p>
          <p className="text-sm text-gray-700 italic">
            "{randomFact}"
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {memory.totalInteractions} berichten samen
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Sluiten"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default MemoryIndicator;
