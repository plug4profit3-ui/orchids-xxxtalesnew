import { useState, useCallback, useEffect } from 'react';
import { Language } from '../../types';

interface UseSoftMonetizationProps {
  credits: number;
  dailyMessages: number;
  language: Language;
  onUpgrade: () => void;
  onWatchAd?: () => void;
}

interface UseNextStoryProps {
  language: Language;
  onSelectStory: (storyId: string) => void;
}

export const useSoftMonetization = ({
  credits,
  dailyMessages,
  language,
  onUpgrade,
  onWatchAd,
}: UseSoftMonetizationProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Show soft prompt when credits are low but not depleted
    if ((credits < 20 && credits > 0) || (dailyMessages < 3 && dailyMessages > 0)) {
      if (!hasShown) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
          setHasShown(true);
        }, 2000); // Show after 2 seconds of low credits
        return () => clearTimeout(timer);
      }
    }
  }, [credits, dailyMessages, hasShown]);

  const handleClose = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const handleUpgrade = useCallback(() => {
    setShowPrompt(false);
    onUpgrade();
  }, [onUpgrade]);

  const handleWatchAd = useCallback(() => {
    if (onWatchAd) {
      onWatchAd();
    }
    setShowPrompt(false);
  }, [onWatchAd]);

  const resetPrompt = useCallback(() => {
    setHasShown(false);
  }, []);

  return {
    showPrompt,
    handleClose,
    handleUpgrade,
    handleWatchAd,
    resetPrompt,
    creditsRemaining: credits,
    dailyMessagesRemaining: dailyMessages,
  };
};

export const useNextStoryFlow = ({
  language,
  onSelectStory,
}: UseNextStoryProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentStoryId, setCurrentStoryId] = useState<string>('');

  const triggerNextStory = useCallback((storyId: string) => {
    setCurrentStoryId(storyId);
    setShowPrompt(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowPrompt(false);
  }, []);

  const handleSelectStory = useCallback((selectedStoryId: string) => {
    setShowPrompt(false);
    onSelectStory(selectedStoryId);
  }, [onSelectStory]);

  return {
    showPrompt,
    currentStoryId,
    triggerNextStory,
    handleClose,
    handleSelectStory,
  };
};

// Hook for tracking user engagement metrics
export const useEngagementTracking = () => {
  const [sessionStartTime] = useState(() => Date.now());
  const [pageViews, setPageViews] = useState(0);
  const [interactions, setInteractions] = useState(0);

  const trackPageView = useCallback(() => {
    setPageViews(prev => prev + 1);
  }, []);

  const trackInteraction = useCallback(() => {
    setInteractions(prev => prev + 1);
  }, []);

  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  }, [sessionStartTime]);

  const getEngagementScore = useCallback(() => {
    const duration = getSessionDuration();
    return {
      duration,
      pageViews,
      interactions,
      score: (duration * 0.5) + (pageViews * 10) + (interactions * 5),
    };
  }, [getSessionDuration, pageViews, interactions]);

  return {
    trackPageView,
    trackInteraction,
    getSessionDuration,
    getEngagementScore,
  };
};

export default useSoftMonetization;