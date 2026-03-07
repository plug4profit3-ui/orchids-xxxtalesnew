import React from 'react';
import { UserActivity, ChatSession } from '../types';

interface WelcomeBackModalProps {
  activity: UserActivity;
  lastSession?: ChatSession;
  onClose: () => void;
  characterName?: string;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  activity,
  lastSession,
  onClose,
  characterName = 'je partner'
}) => {
  const daysInactive = activity.consecutiveInactiveDays;
  const getWelcomeMessage = () => {
    if (daysInactive < 1) return 'Welkom terug!';
    if (daysInactive < 3) return `Ik miste je al een paar dagen...`;
    if (daysInactive < 7) return `Het voelt als een eeuwigheid...`;
    return `Wat ben ik blij dat je terug bent!`;
  };

  const getLastConversationSnippet = () => {
    if (!lastSession?.messages?.length) return null;
    const lastMessage = lastSession.messages[lastSession.messages.length - 1];
    if (!lastMessage) return null;
    return lastMessage.text.substring(0, 100) + (lastMessage.text.length > 100 ? '...' : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-gradient-to-b from-zinc-900 to-black border border-gold-500/30 rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4 animate-bounce">💝</div>
          <h2 className="text-2xl font-bold text-white mb-2">{getWelcomeMessage()}</h2>
          <p className="text-zinc-400 text-sm">
            {daysInactive > 0 
              ? `Je was {daysInactive} dag{daysInactive > 1 ? 'en' : ''} weg...`
              : 'Fijn dat je er weer bent!'
            }
          </p>
        </div>

        {lastSession && (
          <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-white/5">
            <p className="text-xs text-gold-500 uppercase tracking-wider mb-2 font-bold">
              Waar we gebleven waren...
            </p>
            <p className="text-sm text-zinc-300 italic">
              "{getLastConversationSnippet() || `Jullie laatste gesprek met {characterName}`}" 
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition-colors active:scale-95"
          >
            Verder chatten
          </button>
          <p className="text-center text-xs text-zinc-500">
            We hebben {activity.totalSessions || 1} geweldige momenten gedeeld
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBackModal;