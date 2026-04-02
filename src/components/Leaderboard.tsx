import React, { useState, useEffect } from 'react';
import Icons from './Icon';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  language: string;
}

const LABELS: Record<string, { title: string; stories: string; credits_spent: string; streak: string; rank: string; user: string; empty: string }> = {
  nl: { title: 'Leaderboard', stories: 'Verhalen', credits_spent: 'Credits', streak: 'Streak', rank: '#', user: 'Gebruiker', empty: 'Nog geen data' },
  en: { title: 'Leaderboard', stories: 'Stories', credits_spent: 'Credits', streak: 'Streak', rank: '#', user: 'User', empty: 'No data yet' },
  de: { title: 'Bestenliste', stories: 'Geschichten', credits_spent: 'Credits', streak: 'Serie', rank: '#', user: 'Benutzer', empty: 'Noch keine Daten' },
  fr: { title: 'Classement', stories: 'Histoires', credits_spent: 'Crédits', streak: 'Série', rank: '#', user: 'Utilisateur', empty: 'Pas de données' },
  es: { title: 'Clasificación', stories: 'Historias', credits_spent: 'Créditos', streak: 'Racha', rank: '#', user: 'Usuario', empty: 'Sin datos' },
  it: { title: 'Classifica', stories: 'Storie', credits_spent: 'Crediti', streak: 'Serie', rank: '#', user: 'Utente', empty: 'Nessun dato' },
};

const MOCK_DATA: LeaderboardEntry[] = [
  { order: 1, username: 'PassionFan_42', storiesCreated: 127, creditsSpent: 4500, streakDays: 45 },
  { order: 2, username: 'LustKing', storiesCreated: 98, creditsSpent: 3200, streakDays: 30 },
  { order: 3, username: 'DreamerXX', storiesCreated: 76, creditsSpent: 2800, streakDays: 22 },
  { order: 4, username: 'NaughtyOwl', storiesCreated: 65, creditsSpent: 2100, streakDays: 18 },
  { order: 5, username: 'SecretDesire', storiesCreated: 54, creditsSpent: 1900, streakDays: 15 },
  { order: 6, username: 'MidnightVixen', storiesCreated: 43, creditsSpent: 1600, streakDays: 12 },
  { order: 7, username: 'FantasyBuilder', storiesCreated: 38, creditsSpent: 1400, streakDays: 10 },
  { order: 8, username: 'WildCard', storiesCreated: 32, creditsSpent: 1100, streakDays: 8 },
  { order: 9, username: 'CuriousSoul', storiesCreated: 28, creditsSpent: 900, streakDays: 7 },
  { order: 10, username: 'PlayfulPanda', storiesCreated: 25, creditsSpent: 750, streakDays: 5 },
];

const Leaderboard: React.FC<LeaderboardProps> = ({ language = 'nl' }) => {
  const t = LABELS[language] || LABELS['nl'];
  const [activeTab, setActiveTab] = useState<'stories' | 'credits' | 'streak'>('stories');
  const [data, setData] = useState<LeaderboardEntry[]>(MOCK_DATA);

  useEffect(() => {
    // Sort data based on active tab
    const sorted = [...MOCK_DATA].sort((a, b) => {
      if (activeTab === 'stories') return b.storiesCreated - a.storiesCreated;
      if (activeTab === 'credits') return b.creditsSpent - a.creditsSpent;
      return b.streakDays - a.streakDays;
    }).map((entry, idx) => ({ ...entry, order: idx + 1 }));
    setData(sorted);
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2 bg-gradient-to-b from-[#111] to-black">
        <h1 className="text-2xl font-headline font-bold text-gold-400 flex items-center gap-2">
          <Icons.Trophy className="text-gold-400" size={28} />
          {t.title}
        </h1>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex gap-1 px-4 pb-2 bg-[#111]">
        {(['stories', 'credits', 'streak'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'bg-gold-500 text-black'
                : 'bg-white/10 text-zinc-400 hover:bg-white/20'
            }`}
          >
            {t[tab as keyof typeof t]}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Icons.Trophy size={48} className="mb-4 opacity-50" />
            <p>{t.empty}</p>
          </div>
        ) : (
          data.map((entry) => (
            <div
              key={entry.order}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                entry.order <= 3
                  ? entry.order === 1
                    ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50'
                    : entry.order === 2
                    ? 'bg-gradient-to-r from-zinc-400/20 to-zinc-500/10 border-zinc-400/50'
                    : 'bg-gradient-to-r from-orange-600/20 to-orange-700/10 border-orange-600/50'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-lg ${
                entry.order === 1
                  ? 'bg-yellow-500 text-black'
                  : entry.order === 2
                  ? 'bg-zinc-400 text-black'
                  : entry.order === 3
                  ? 'bg-orange-600 text-white'
                  : 'bg-white/10 text-zinc-400'
              }`}>
                {entry.order}
              </div>

              {/* Username */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold truncate">{entry.username}</p>
              </div>

              {/* Stats */}
              <div className="text-right">
                <p className="text-gold-400 font-bold">
                  {activeTab === 'stories' && entry.storiesCreated}
                  {activeTab === 'credits' && entry.creditsSpent}
                  {activeTab === 'streak' && entry.streakDays}
                  <span className="text-xs text-zinc-500 ml-1">
                    {activeTab === 'stories' ? t.stories : activeTab === 'credits' ? 'CR' : t.streak}
                  </span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
