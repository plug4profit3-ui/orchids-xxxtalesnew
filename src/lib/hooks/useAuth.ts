import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../../types';
import { supabase } from '../../services/supabase';
import * as db from '../../services/supabaseData';

const DEFAULT_USER: UserProfile = {
  id: '', name: '', email: '', picture: 'https://storage.googleapis.com/foto1982/logo.jpeg',
  isPremium: false, credits: 50, dailyMessagesLeft: 10, isAuthenticated: false, isVerified: false,
  streak: 0, lastLoginDate: undefined, customCharacters: []
};

export function useAuth() {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [authScreen, setAuthScreen] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAgeAccepted, setIsAgeAccepted] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authInitDone, setAuthInitDone] = useState(false);

  // Supabase auth listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(prev => {
          if (prev.isAuthenticated && prev.id === session.user.id) return prev;
          return {
            ...prev,
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || prev.name,
            email: session.user.email || prev.email,
            picture: session.user.user_metadata?.avatar_url || prev.picture,
            isAuthenticated: true,
            isVerified: true,
          };
        });
      }
      setAuthInitDone(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (authScreen === 'register') {
        if (!isAgeAccepted) { setAuthLoading(false); return; }
        try {
          const resp = await fetch('/api/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword, name: authName, action: 'register' }),
          });
          const text = await resp.text();
          let data: any;
          try { data = JSON.parse(text); } catch { throw new Error('API niet beschikbaar'); }
          if (!resp.ok) throw new Error(data.error || 'Registratie mislukt');
          if (data.session?.access_token) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }
        } catch (apiErr: any) {
          const { error } = await supabase.auth.signUp({
            email: authEmail,
            password: authPassword,
            options: { data: { name: authName } },
          });
          if (error) throw error;
        }
      } else {
        try {
          const resp = await fetch('/api/confirm-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authEmail, password: authPassword, action: 'login' }),
          });
          const text = await resp.text();
          let data: any;
          try { data = JSON.parse(text); } catch { throw new Error('API niet beschikbaar'); }
          if (!resp.ok) throw new Error(data.error || 'Login mislukt');
          if (data.session?.access_token) {
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          }
        } catch (apiErr: any) {
          const { error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });
          if (error) throw error;
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setAuthError(error.message);
  };

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(DEFAULT_USER);
  }, []);

  return {
    user, setUser,
    authScreen, setAuthScreen,
    authName, setAuthName,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    isAgeAccepted, setIsAgeAccepted,
    authLoading, authError,
    authInitDone,
    handleAuthSubmit,
    handleGoogleLogin,
    handleLogout,
    DEFAULT_USER,
  };
}
