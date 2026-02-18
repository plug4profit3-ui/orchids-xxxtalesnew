import { useState, useRef, useCallback } from 'react';
import { ChatSession, Character, Language } from '../../types';
import * as db from '../../services/supabaseData';
import { scheduleCharacterNotification } from '../../services/notifications';

export function useSessions(userId: string, allCharacters: Character[], language: Language) {
  const [savedSessions, setSavedSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleSaveSession = useCallback((session: ChatSession) => {
    setSavedSessions(prev => {
      const idx = prev.findIndex(s => s.id === session.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = session; return copy; }
      return [session, ...prev];
    });
    setActiveSession(session);
    if (userId) {
      clearTimeout(saveTimer.current[`session_${session.id}`]);
      saveTimer.current[`session_${session.id}`] = setTimeout(() => {
        db.saveSession(userId, session).catch(() => {});
      }, 1500);
    }
    if (session.messages.length > 2) {
      const charName = allCharacters.find(c => c.id === session.characterId)?.name;
      if (charName) scheduleCharacterNotification(charName, language);
    }
  }, [userId, allCharacters, language]);

  const handleLoadSession = useCallback((session: ChatSession) => {
    setActiveSession(session);
  }, []);

  const handleDeleteSession = useCallback((id: string) => {
    setSavedSessions(prev => prev.filter(s => s.id !== id));
    setActiveSession(prev => prev?.id === id ? null : prev);
    if (userId) db.deleteSession(userId, id).catch(() => {});
  }, [userId]);

  const handleCharacterSelect = useCallback((selected: Character | Character[]) => {
    const chars = Array.isArray(selected) ? selected : [selected];
    const primaryChar = chars[0];
    const existingSession = savedSessions.find(s =>
      chars.length === 1 ? s.characterId === primaryChar.id : false
    );

    if (existingSession) {
      setActiveSession(existingSession);
    } else {
      const newSession: ChatSession = {
        id: `chat_${Date.now()}`,
        title: chars.length > 1 ? `Groep: ${chars.map(c => c.name).join(', ')}` : primaryChar.name,
        messages: [],
        lastUpdated: Date.now(),
        characterId: primaryChar.id,
        characterIds: chars.map(c => c.id),
        arousal: 0, affection: 0, trust: 0, intimacy: 0,
        level: 1, experience: 0, memories: []
      };
      setActiveSession(newSession);
    }
  }, [savedSessions]);

  return {
    savedSessions, setSavedSessions,
    activeSession, setActiveSession,
    handleSaveSession,
    handleLoadSession,
    handleDeleteSession,
    handleCharacterSelect,
  };
}
