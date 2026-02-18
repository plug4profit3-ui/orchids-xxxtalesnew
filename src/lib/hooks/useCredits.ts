import { useState, useCallback } from 'react';
import { UserProfile } from '../../types';
import * as db from '../../services/supabaseData';

export function useCredits(
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  showPaywall: (reason: string) => void,
  showToast: (title: string, message: string, icon?: string) => void,
) {
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);

  const onConsumeCredit = useCallback((cost: number): boolean => {
    if (user.isPremium) return true;
    if (user.credits >= cost) {
      setUser(prev => ({ ...prev, credits: prev.credits - cost }));
      return true;
    }
    showPaywall(`Je hebt ${cost} credits nodig.`);
    return false;
  }, [user.isPremium, user.credits, setUser, showPaywall]);

  const onConsumeDailyMessage = useCallback((): boolean => {
    if (user.isPremium) return true;
    if (user.dailyMessagesLeft > 0) {
      setUser(prev => ({ ...prev, dailyMessagesLeft: prev.dailyMessagesLeft - 1 }));
      return true;
    }
    showPaywall('Je dagelijkse berichten zijn op.');
    return false;
  }, [user.isPremium, user.dailyMessagesLeft, setUser, showPaywall]);

  const handleStartTrial = useCallback(() => {
    if (user.trialUsed) {
      showPaywall('');
      return;
    }
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3);
    setUser(prev => ({
      ...prev,
      isPremium: true,
      vipExpiresAt: expiresAt.toISOString(),
      trialUsed: true,
      credits: prev.credits + 100,
    }));
    setShowTrialConfirm(true);
    setTimeout(() => setShowTrialConfirm(false), 3500);
  }, [user.trialUsed, setUser, showPaywall]);

  const handlePurchase = (amount: number, isSub: boolean) => {
    if (isSub) {
      setUser(prev => ({ ...prev, isPremium: true, credits: prev.credits + amount }));
    } else {
      setUser(prev => ({ ...prev, credits: prev.credits + amount }));
    }
    showToast('Aankoop Geslaagd', `+${amount} credits toegevoegd!`, '✨');
  };

  const claimDailyReward = (amount: number) => {
    const today = new Date().toDateString();
    const newStreak = user.lastLoginDate ? (user.streak || 0) + 1 : 1;
    setUser(prev => ({
      ...prev,
      credits: prev.credits + amount,
      lastLoginDate: today,
      streak: newStreak,
      dailyMessagesLeft: 10
    }));
  };

  const checkTrialExpiry = useCallback(() => {
    if (user.isPremium && user.vipExpiresAt) {
      const expires = new Date(user.vipExpiresAt);
      if (expires <= new Date()) {
        setUser(prev => ({ ...prev, isPremium: false, vipExpiresAt: undefined }));
        if (user.id) {
          db.saveProfile(user.id, { isPremium: false, vipExpiresAt: undefined }).catch(() => {});
        }
        showToast('VIP Verlopen', 'Je trial is verlopen. Upgrade voor onbeperkt toegang.', '⏰');
      }
    }
  }, [user.isPremium, user.vipExpiresAt, user.id, setUser, showToast]);

  return {
    onConsumeCredit,
    onConsumeDailyMessage,
    handleStartTrial,
    handlePurchase,
    claimDailyReward,
    checkTrialExpiry,
    showTrialConfirm,
  };
}
