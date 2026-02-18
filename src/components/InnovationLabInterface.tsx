import React, { useMemo, useState } from 'react';
import Icons from './Icon';
import type { ChatSession, UserProfile } from '../types';

interface InnovationLabProps {
  user: UserProfile;
  activeSession: ChatSession | null;
  onOpenPaywall: (reason: string) => void;
  onApplyScene: (prompt: string) => void;
}

const voicePacks = [
  { id: 'velvet-midnight', label: 'Velvet Midnight', tier: 'Premium creator', price: '€4.99' },
  { id: 'dominant-ice', label: 'Dominant Ice', tier: 'Premium creator', price: '€6.99' },
  { id: 'warm-confession', label: 'Warm Confession', tier: 'Community pack', price: 'Free' },
];

const cardClass = 'rounded-2xl border border-white/10 bg-zinc-950/80 p-4 md:p-5';

const InnovationLabInterface: React.FC<InnovationLabProps> = ({
  user,
  activeSession,
  onOpenPaywall,
  onApplyScene,
}) => {
  const [newMemory, setNewMemory] = useState('');
  const [tone, setTone] = useState(55);
  const [pace, setPace] = useState(60);
  const [taboo, setTaboo] = useState(35);
  const [duration, setDuration] = useState(12);
  const [pov, setPov] = useState<'first-person' | 'third-person'>('first-person');
  const [selectedVoicePack, setSelectedVoicePack] = useState<string | null>(null);
  const [consentPersonalization, setConsentPersonalization] = useState(true);
  const [consentAnalytics, setConsentAnalytics] = useState(true);

  const sessionMemories = activeSession?.memories || [];
  const memoryTimeline = useMemo(() => {
    const milestones = sessionMemories.slice(-4).map((memory, index) => ({
      id: `${memory}-${index}`,
      title: `Moment ${index + 1}`,
      memory,
      replayHint: activeSession?.messages?.[Math.max(0, (activeSession.messages.length || 1) - 1 - index)]?.text?.slice(0, 80) || '',
    }));

    return milestones;
  }, [sessionMemories, activeSession]);

  const scenePrompt = `Tone: ${tone}/100 · Pace: ${pace}/100 · Taboo: ${taboo}/100 · POV: ${pov} · Duration: ${duration} min`;

  const engagementScore = useMemo(() => {
    const messages = user.totalMessagesSent || 0;
    const streak = user.streak || 0;
    const score = Math.min(100, Math.round(messages * 0.06 + streak * 4 + (user.isPremium ? 25 : 0)));
    return score;
  }, [user]);

  const exportPrivacyData = () => {
    const payload = {
      profile: {
        name: user.name,
        email: user.email,
        credits: user.credits,
      },
      consents: { consentPersonalization, consentAnalytics },
      selectedVoicePack,
      sceneComposer: { tone, pace, taboo, duration, pov },
      memoryTimeline,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'privacy-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full overflow-y-auto no-scrollbar px-4 md:px-8 py-4 md:py-6 text-zinc-100">
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-5 pb-24">
        <div className="rounded-2xl border border-gold-500/25 bg-gradient-to-r from-gold-500/10 to-purple-500/10 p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold-400 font-black">Innovation lab</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1">Killer features roadmap – interactieve preview</h2>
          <p className="text-sm text-zinc-300 mt-1">Hier kun je alle 5 gevraagde features direct simuleren en testen in de app-flow.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Quote size={16} className="text-gold-400" />
              <h3 className="font-bold">1) Relationship Memory Timeline</h3>
            </div>
            {memoryTimeline.length === 0 ? (
              <p className="text-sm text-zinc-400">Nog geen memories gevonden in deze sessie. Start een chat en sla key moments op.</p>
            ) : (
              <ol className="space-y-2">
                {memoryTimeline.map((item) => (
                  <li key={item.id} className="rounded-xl bg-black/35 border border-white/10 p-3">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">{item.title}</p>
                    <p className="text-sm font-medium">{item.memory}</p>
                    {item.replayHint && <p className="text-xs text-zinc-500 mt-1">Replay snippet: “{item.replayHint}...”</p>}
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-3 flex gap-2">
              <input
                value={newMemory}
                onChange={(e) => setNewMemory(e.target.value)}
                placeholder="Voeg memory-label toe..."
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm"
              />
              <button
                onClick={() => {
                  if (!newMemory.trim()) return;
                  onApplyScene(`Use this memory in next reply: ${newMemory.trim()}`);
                  setNewMemory('');
                }}
                className="px-3 py-2 rounded-xl bg-gold-500 text-black font-bold text-xs"
              >
                Pin
              </button>
            </div>
          </section>

          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Dices size={16} className="text-gold-400" />
              <h3 className="font-bold">2) Scene Composer (no-code)</h3>
            </div>
            <div className="space-y-2 text-sm">
              <label className="block">Tone: {tone}<input type="range" min={0} max={100} value={tone} onChange={(e) => setTone(Number(e.target.value))} className="w-full" /></label>
              <label className="block">Pace: {pace}<input type="range" min={0} max={100} value={pace} onChange={(e) => setPace(Number(e.target.value))} className="w-full" /></label>
              <label className="block">Taboo-level: {taboo}<input type="range" min={0} max={100} value={taboo} onChange={(e) => setTaboo(Number(e.target.value))} className="w-full" /></label>
              <label className="block">Duration (min)
                <input type="number" min={5} max={45} value={duration} onChange={(e) => setDuration(Number(e.target.value || 5))} className="w-full mt-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5" />
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setPov('first-person')} className={`px-2 py-1 rounded-lg text-xs ${pov === 'first-person' ? 'bg-gold-500 text-black font-bold' : 'bg-zinc-900 text-zinc-300'}`}>First-person</button>
                <button onClick={() => setPov('third-person')} className={`px-2 py-1 rounded-lg text-xs ${pov === 'third-person' ? 'bg-gold-500 text-black font-bold' : 'bg-zinc-900 text-zinc-300'}`}>Third-person</button>
              </div>
              <p className="text-xs text-zinc-400 border border-white/10 rounded-xl p-2">Prompt preview: {scenePrompt}</p>
            </div>
            <button onClick={() => onApplyScene(scenePrompt)} className="mt-3 w-full py-2 rounded-xl bg-gold-500 text-black font-bold text-sm">Apply to Story</button>
          </section>

          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Volume2 size={16} className="text-gold-400" />
              <h3 className="font-bold">3) Voice Personas Marketplace</h3>
            </div>
            <div className="space-y-2">
              {voicePacks.map((pack) => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedVoicePack(pack.id)}
                  className={`w-full text-left rounded-xl border px-3 py-2 transition ${selectedVoicePack === pack.id ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 bg-zinc-900/70 hover:border-gold-500/40'}`}
                >
                  <p className="font-semibold text-sm">{pack.label}</p>
                  <p className="text-xs text-zinc-400">{pack.tier} · {pack.price}</p>
                </button>
              ))}
            </div>
            <button
              onClick={() => onOpenPaywall('Unlock premium voice persona packs')}
              className="mt-3 w-full py-2 rounded-xl bg-purple-500/90 text-white font-bold text-sm"
            >
              Unlock marketplace
            </button>
          </section>

          <section className={cardClass}>
            <div className="flex items-center gap-2 mb-3">
              <Icons.Zap size={16} className="text-gold-400" />
              <h3 className="font-bold">4) Adaptive Subscription Intelligence</h3>
            </div>
            <p className="text-sm text-zinc-400">Engagement score bepaalt wanneer een zachte of agressieve paywall getoond wordt.</p>
            <div className="mt-3 rounded-xl border border-white/10 p-3 bg-black/30">
              <p className="text-xs text-zinc-400 uppercase">Current score</p>
              <p className="text-3xl font-black">{engagementScore}<span className="text-sm text-zinc-400">/100</span></p>
              <p className="text-xs text-zinc-500 mt-1">
                {engagementScore >= 75 ? 'High intent: show annual plan + one-click checkout.' : engagementScore >= 45 ? 'Mid intent: show social proof + free-trial upsell.' : 'Low intent: keep user in value loop, delay paywall.'}
              </p>
            </div>
            <button
              onClick={() => onOpenPaywall(`Adaptive paywall trigger at score ${engagementScore}`)}
              className="mt-3 w-full py-2 rounded-xl bg-zinc-100 text-black font-bold text-sm"
            >
              Trigger recommended paywall
            </button>
          </section>

          <section className={`${cardClass} md:col-span-2`}>
            <div className="flex items-center gap-2 mb-3">
              <Icons.ShieldCheck size={16} className="text-gold-400" />
              <h3 className="font-bold">5) Safety + Trust Layer</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                <label className="flex items-center justify-between">
                  <span>Consent: personalization</span>
                  <input type="checkbox" checked={consentPersonalization} onChange={(e) => setConsentPersonalization(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between">
                  <span>Consent: product analytics</span>
                  <input type="checkbox" checked={consentAnalytics} onChange={(e) => setConsentAnalytics(e.target.checked)} />
                </label>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
                <button onClick={exportPrivacyData} className="w-full py-2 rounded-lg bg-zinc-100 text-black font-semibold">Export my data</button>
                <button onClick={() => localStorage.clear()} className="w-full py-2 rounded-lg bg-red-500/90 text-white font-semibold">One-click local wipe</button>
                <p className="text-xs text-zinc-500">Deze controls zijn client-side demo’s voor privacy dashboard + consent rails.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InnovationLabInterface;
