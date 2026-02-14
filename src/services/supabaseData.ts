// Supabase data service - replaces localStorage for all user data
import { supabase } from './supabase';
import type { ChatSession, SavedStory, GeneratedImage, UserProfile } from '../types';

// --- PROFILE ---
export async function loadProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const [{ data: profile }, { data: account }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('credit_accounts').select('*').eq('user_id', userId).single(),
  ]);

  if (!profile) return null;

  return {
    id: userId,
    name: profile.name || '',
    email: profile.email || '',
    picture: profile.picture || 'https://storage.googleapis.com/foto1982/logo.jpeg',
    isPremium: profile.is_premium || false,
    vipExpiresAt: profile.vip_expires_at || undefined,
    streak: profile.streak || 0,
    lastLoginDate: profile.last_login_date || undefined,
    customCharacters: profile.custom_characters || [],
    favoriteCharacterIds: profile.favorite_character_ids || [],
    credits: account?.balance ?? 50,
    dailyMessagesLeft: account?.daily_messages_left ?? 10,
    isAuthenticated: true,
    isVerified: true,
  };
}

export async function saveProfile(userId: string, updates: Partial<UserProfile>) {
  const profileUpdates: Record<string, any> = {};
  if (updates.name !== undefined) profileUpdates.name = updates.name;
  if (updates.email !== undefined) profileUpdates.email = updates.email;
  if (updates.picture !== undefined) profileUpdates.picture = updates.picture;
  if (updates.isPremium !== undefined) profileUpdates.is_premium = updates.isPremium;
  if (updates.vipExpiresAt !== undefined) profileUpdates.vip_expires_at = updates.vipExpiresAt || null;
  if (updates.streak !== undefined) profileUpdates.streak = updates.streak;
  if (updates.lastLoginDate !== undefined) profileUpdates.last_login_date = updates.lastLoginDate;
  if (updates.customCharacters !== undefined) profileUpdates.custom_characters = updates.customCharacters;
  if (updates.favoriteCharacterIds !== undefined) profileUpdates.favorite_character_ids = updates.favoriteCharacterIds;

  if (Object.keys(profileUpdates).length > 0) {
    await supabase.from('profiles').update(profileUpdates).eq('id', userId);
  }

  // Update credits in credit_accounts
  const creditUpdates: Record<string, any> = {};
  if (updates.credits !== undefined) creditUpdates.balance = updates.credits;
  if (updates.dailyMessagesLeft !== undefined) creditUpdates.daily_messages_left = updates.dailyMessagesLeft;

  if (Object.keys(creditUpdates).length > 0) {
    creditUpdates.updated_at = new Date().toISOString();
    await supabase.from('credit_accounts').update(creditUpdates).eq('user_id', userId);
  }
}

// --- CHAT SESSIONS ---
export async function loadSessions(userId: string): Promise<ChatSession[]> {
  const { data } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return (data || []).map(row => ({
    id: row.id,
    title: row.title || '',
    messages: row.messages || [],
    lastUpdated: new Date(row.updated_at).getTime(),
    characterId: row.character_id || '',
    characterIds: row.character_ids || [],
    arousal: row.arousal || 0,
    affection: row.affection || 0,
    trust: row.trust || 0,
    intimacy: row.intimacy || 0,
    level: row.level || 1,
    experience: row.experience || 0,
    memories: row.memories || [],
    stance: row.stance,
    intensity: row.intensity,
    voiceStyle: row.voice_style,
    speechSpeed: row.speech_speed,
    speechPitch: row.speech_pitch,
  }));
}

export async function saveSession(userId: string, session: ChatSession) {
  await supabase.from('chat_sessions').upsert({
    id: session.id,
    user_id: userId,
    title: session.title,
    character_id: session.characterId,
    character_ids: session.characterIds || [session.characterId],
    messages: session.messages,
    arousal: session.arousal,
    affection: session.affection,
    trust: session.trust,
    intimacy: session.intimacy,
    level: session.level,
    experience: session.experience,
    memories: session.memories || [],
    stance: session.stance,
    intensity: session.intensity,
    voice_style: session.voiceStyle,
    speech_speed: session.speechSpeed,
    speech_pitch: session.speechPitch,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteSession(userId: string, sessionId: string) {
  await supabase.from('chat_sessions').delete().eq('id', sessionId).eq('user_id', userId);
}

// --- STORIES ---
export async function loadStories(userId: string): Promise<SavedStory[]> {
  const { data } = await supabase
    .from('saved_stories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map(row => ({
    id: row.id,
    title: row.title || '',
    turns: row.turns || [],
    config: row.config || {},
    timestamp: new Date(row.created_at).getTime(),
  }));
}

export async function saveStory(userId: string, story: SavedStory) {
  await supabase.from('saved_stories').upsert({
    id: story.id,
    user_id: userId,
    title: story.title,
    turns: story.turns,
    config: story.config,
    created_at: new Date(story.timestamp).toISOString(),
  });
}

export async function deleteStory(userId: string, storyId: string) {
  await supabase.from('saved_stories').delete().eq('id', storyId).eq('user_id', userId);
}

// --- IMAGES ---
export async function loadImages(userId: string): Promise<GeneratedImage[]> {
  const { data } = await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []).map(row => ({
    url: row.url,
    prompt: row.prompt || '',
  }));
}

export async function saveImage(userId: string, image: GeneratedImage) {
  await supabase.from('generated_images').insert({
    user_id: userId,
    url: image.url,
    prompt: image.prompt,
  });
}

// --- AUTH TOKEN ---
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
