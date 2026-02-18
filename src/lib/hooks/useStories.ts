import { useState, useRef, useCallback } from 'react';
import { SavedStory } from '../../types';
import * as db from '../../services/supabaseData';

export function useStories(userId: string) {
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [activeStory, setActiveStory] = useState<SavedStory | undefined>(undefined);
  const saveTimer = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleSaveStory = useCallback((story: SavedStory) => {
    setSavedStories(prev => {
      const idx = prev.findIndex(s => s.id === story.id);
      if (idx >= 0) { const copy = [...prev]; copy[idx] = story; return copy; }
      return [story, ...prev];
    });
    setActiveStory(story);
    if (userId) {
      clearTimeout(saveTimer.current[`story_${story.id}`]);
      saveTimer.current[`story_${story.id}`] = setTimeout(() => {
        db.saveStory(userId, story).catch(() => {});
      }, 1500);
    }
  }, [userId]);

  const handleLoadStory = useCallback((story: SavedStory) => {
    setActiveStory(story);
  }, []);

  const handleDeleteStory = useCallback((id: string) => {
    setSavedStories(prev => prev.filter(s => s.id !== id));
    setActiveStory(prev => prev?.id === id ? undefined : prev);
    if (userId) db.deleteStory(userId, id).catch(() => {});
  }, [userId]);

  return {
    savedStories, setSavedStories,
    activeStory, setActiveStory,
    handleSaveStory,
    handleLoadStory,
    handleDeleteStory,
  };
}
