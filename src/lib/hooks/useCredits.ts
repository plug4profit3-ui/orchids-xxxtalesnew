import { useState, useCallback, useEffect, useRef } from 'react';
import { UserProfile } from '../../types';
import * as db from '../../services/supabaseData';
import * as creditService from '../../services/creditService';

export function useCredits(
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  showPaywall: (reason: string) => void,
  showToast: (title: string, message: string, icon?: string) => void,
) {
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const balanceSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Subscribe to real-time balance updates
  useEffect(() => {
    if (user.id && user.isAuthenticated) {
      // Subscribe to Supabase realtime updates
      const subscription = creditService.subscribeToBalanceChanges(user.id, (balance) => {
        setUser(prev => ({
          ...prev,
          credits: balance.balance,
          dailyMessagesLeft: balance.daily_messages_left,
          isPremium: balance.is_premium || prev.isPremium,
          vipExpiresAt: balance.vip_expires_at || prev.vipExpiresAt,
        }));
      });

      balanceSubscriptionRef.current = subscription;

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user.id, user.isAuthenticated, setUser]);

  // Refresh balance from server
  const refreshBalance = useCallback(async () => {
    if (!user.id) return;
    
    setIsLoadingBalance(true);
    try {
      const balance = await creditService.getCreditBalance();
      setUser(prev => ({
        ...prev,
        credits: balance.balance,
        dailyMessagesLeft: balance.daily_messages_left,
        isPremium: balance.is_premium,
        vipExpiresAt: balance.vip_expires_at || undefined,
        trialUsed: balance.trial_used,
        streak: balance.streak,
        lastLoginDate: balance.last_login_date,
      }));
      
      // Show low balance notification
      if (creditService.isCriticalBalance(balance.balance) && !balance.is_premium) {
        showToast(
          'Laag Credits Saldo',
          `Je hebt nog maar ${balance.balance.toFixed(0)} credits over. Koop meer om door te gaan!`,
          '⚠️'
        );
      }
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [user.id, setUser, showToast]);

  // Consume credits via API (server-side validation)
  const consumeCreditsApi = useCallback(async (params: {
    estimated_input_tokens: number;
    estimated_output_tokens: number;
    message_id?: string;
    intensity?: 'normal' | 'high' | 'extreme';
    service_type?: 'chat' | 'image' | 'tts';
  }): Promise<{ success: boolean; requestId?: string; error?: string }> => {
    try {
      const response = await creditService.consumeCredits(params);
      
      if (response.insufficient_funds) {
        showPaywall(response.message || `Je hebt ${response.consumed_credits} credits nodig.`);
        return { success: false, error: 'Insufficient credits' };
      }

      if (response.success) {
        // Update local state immediately
        setUser(prev => ({
          ...prev,
          credits: response.remaining_balance,
        }));
        setLastRequestId(response.request_id);
        return { success: true, requestId: response.request_id };
      }

      return { success: false, error: response.error };
    } catch (error: any) {
      console.error('Consume credits error:', error);
      showPaywall('Kon credits niet verwerken. Probeer opnieuw.');
      return { success: false, error: error.message };
    }
  }, [setUser, showPaywall]);

  // Adjust credits after actual API usage
  const adjustCreditsApi = useCallback(async (params: {
    request_id: string;
    actual_input_tokens: number;
    actual_output_tokens: number;
    message_id?: string;
    intensity?: 'normal' | 'high' | 'extreme';
  }): Promise<boolean> => {
    try {
      const response = await creditService.adjustCredits(params);
      
      if (response.success) {
        // Update local state
        setUser(prev => ({
          ...prev,
          credits: response.new_balance,
        }));
        
        // Show toast if there was a refund
        if (response.refund_applied && response.adjustment > 0.5) {
          showToast(
            'Credits Gecorrigeerd',
            `${response.adjustment.toFixed(1)} credits teruggestort`,
            '💰'
          );
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Adjust credits error:', error);
      return false;
    }
  }, [setUser, showToast]);

  // Legacy: Consume credit locally (for backward compatibility)
  const onConsumeCredit = useCallback((cost: number): boolean => {
    if (user.isPremium) return true;
    if (user.credits >= cost) {
      setUser(prev => ({ ...prev, credits: prev.credits - cost }));
      return true;
    }
    showPaywall(`Je hebt ${cost} credits nodig.`);
    return false;
  }, [user.isPremium, user.credits, setUser, showPaywall]);

  // Legacy: Consume daily message locally
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
    // Legacy functions (backward compatibility)
    onConsumeCredit,
    onConsumeDailyMessage,
    handleStartTrial,
    handlePurchase,
    claimDailyReward,
    checkTrialExpiry,
    showTrialConfirm,
    // New API-based functions
    refreshBalance,
    consumeCreditsApi,
    adjustCreditsApi,
    isLoadingBalance,
    lastRequestId,
  };
}
