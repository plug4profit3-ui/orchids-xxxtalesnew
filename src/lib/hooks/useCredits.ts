import { useState, useCallback, useEffect } from 'react';
import { UserProfile } from '../../types';
import * as db from '../../services/supabaseData';
import { fetchCreditBalance, consumeCredits, estimateCreditCost, CreditTransaction } from '../../services/creditService';
import { supabase } from '../../services/supabase';

export function useCredits(
  user: UserProfile,
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>,
  showPaywall: (reason: string) => void,
  showToast: (title: string, message: string, icon?: string) => void,
) {
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  // Sync balance from server on mount and when user authenticates
  useEffect(() => {
    if (!user.id || !user.isAuthenticated) return;

    let cancelled = false;
    fetchCreditBalance()
      .then(data => {
        if (cancelled || !data) return;
        setUser(prev => ({ ...prev, credits: data.balance, dailyMessagesLeft: data.daily_messages_left }));
        setTransactions(data.transactions || []);
      })
      .catch(err => {
        if (!cancelled) console.error('Failed to fetch credit balance:', err);
      });

    return () => { cancelled = true; };
  }, [user.id, user.isAuthenticated]);

  // Subscribe to real-time credit_accounts changes via Supabase
  useEffect(() => {
    if (!user.id || !user.isAuthenticated) return;

    const channel = supabase
      .channel(`credits:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'credit_accounts',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const newBalance = Number((payload.new as any)?.balance ?? 0);
          setUser(prev => ({ ...prev, credits: newBalance }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, user.isAuthenticated]);

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

  /**
   * Server-side credit consumption for chat messages.
   * Returns true if credits were successfully deducted, false if insufficient.
   */
  const onConsumeCreditServer = useCallback(async (
    messageText: string,
    intensity: 'normal' | 'high' | 'extreme' = 'normal',
    messageId?: string
  ): Promise<boolean> => {
    if (user.isPremium) return true;

    const { cost, estimated_input_tokens, estimated_output_tokens } = estimateCreditCost(messageText, intensity);

    // Optimistic local check before hitting server
    if (user.credits < cost) {
      showPaywall(`Je hebt ${cost} credits nodig voor dit bericht.`);
      return false;
    }

    const idempotency_key = messageId ? `chat_${messageId}` : `chat_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const result = await consumeCredits({
      estimated_input_tokens,
      estimated_output_tokens,
      message_id: messageId,
      idempotency_key,
      intensity,
    });

    if (!result.success) {
      // Update local balance from server response
      setUser(prev => ({ ...prev, credits: result.remaining_balance }));
      if (result.insufficient_funds) {
        showPaywall(`Je hebt onvoldoende credits. Huidig saldo: ${result.remaining_balance.toFixed(0)} credits.`);
      } else {
        showToast('Fout', result.error || 'Credits konden niet worden afgeschreven.', '⚠️');
      }
      return false;
    }

    // Update local balance optimistically
    setUser(prev => ({ ...prev, credits: result.remaining_balance }));
    return true;
  }, [user.isPremium, user.credits, setUser, showPaywall, showToast]);

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
    // Refresh balance from server after purchase
    fetchCreditBalance().then(data => {
      if (data) setUser(prev => ({ ...prev, credits: data.balance }));
    });
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

  // Refresh balance from server
  const refreshBalance = useCallback(async () => {
    const data = await fetchCreditBalance();
    if (data) {
      setUser(prev => ({ ...prev, credits: data.balance, dailyMessagesLeft: data.daily_messages_left }));
      setTransactions(data.transactions || []);
    }
  }, [setUser]);

  return {
    onConsumeCredit,
    onConsumeDailyMessage,
    onConsumeCreditServer,
    handleStartTrial,
    handlePurchase,
    claimDailyReward,
    checkTrialExpiry,
    showTrialConfirm,
    transactions,
    refreshBalance,
  };
}
