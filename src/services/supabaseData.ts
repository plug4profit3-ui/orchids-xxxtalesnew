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
    trialUsed: profile.trial_used || false,
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
  if (updates.trialUsed !== undefined) profileUpdates.trial_used = updates.trialUsed;
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

export async function uploadImageToStorage(userId: string, base64Data: string): Promise<string> {
  // Convert base64 data URL to blob
  const match = base64Data.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return base64Data; // Not a base64 data URL, return as-is (already a URL)

  const mimeType = match[1];
  const ext = mimeType.split('/')[1] || 'webp';
  const raw = atob(match[2]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });

  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('generated-images').upload(fileName, blob, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    console.error('Storage upload failed:', error);
    return base64Data; // Fallback to base64
  }

  const { data: publicUrl } = supabase.storage.from('generated-images').getPublicUrl(fileName);
  return publicUrl.publicUrl;
}

export async function saveImage(userId: string, image: GeneratedImage) {
  // Upload base64 to Storage first, then save the public URL
  const url = await uploadImageToStorage(userId, image.url);
  await supabase.from('generated_images').insert({
    user_id: userId,
    url,
    prompt: image.prompt,
  });
  return url;
}

// --- AUTH TOKEN ---
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

// --- CHARACTER RELATIONSHIPS ---

export interface CharacterRelationship {
  id?: string;
  userId: string;
  characterId: string;
  affection: number;
  trust: number;
  memories: string[];
  lastInteraction: string;
  totalMessages: number;
  milestonesReached: string[];
}

/** Load all relationships for a user */
export async function loadRelationships(userId: string): Promise<CharacterRelationship[]> {
  const { data } = await supabase
    .from('character_relationships')
    .select('*')
    .eq('user_id', userId)
    .order('last_interaction', { ascending: false });

  return (data || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    characterId: r.character_id,
    affection: r.affection ?? 0,
    trust: r.trust ?? 0,
    memories: r.memories ?? [],
    lastInteraction: r.last_interaction,
    totalMessages: r.total_messages ?? 0,
    milestonesReached: r.milestones_reached ?? [],
  }));
}

/** Upsert affection/trust/memories for a character */
export async function upsertRelationship(rel: CharacterRelationship) {
  // Clamp values 0-100
  const affection = Math.max(0, Math.min(100, rel.affection));
  const trust = Math.max(0, Math.min(100, rel.trust));

  // Check milestone transitions
  const milestones = [...rel.milestonesReached];
  for (const threshold of [25, 50, 75, 100]) {
    const key = `affection_${threshold}`;
    if (affection >= threshold && !milestones.includes(key)) {
      milestones.push(key);
    }
  }

  await supabase.from('character_relationships').upsert({
    user_id: rel.userId,
    character_id: rel.characterId,
    affection,
    trust,
    memories: rel.memories.slice(-50), // Keep last 50 memories
    last_interaction: new Date().toISOString(),
    total_messages: rel.totalMessages,
    milestones_reached: milestones,
  }, { onConflict: 'user_id,character_id' });

  return { ...rel, affection, trust, milestonesReached: milestones };
}

/** Increment message count + affection for a character after a chat message */
export async function recordChatInteraction(
  userId: string,
  characterId: string,
  affectionDelta: number = 1,
  newMemory?: string
) {
  // Load current relationship (or default)
  const { data } = await supabase
    .from('character_relationships')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .single();

  const current = data || { affection: 0, trust: 0, memories: [], total_messages: 0, milestones_reached: [] };
  const memories: string[] = current.memories ?? [];
  if (newMemory) memories.push(newMemory);

  return upsertRelationship({
    userId,
    characterId,
    affection: (current.affection ?? 0) + affectionDelta,
    trust: (current.trust ?? 0) + Math.floor(affectionDelta / 2),
    memories: memories.slice(-50),
    lastInteraction: new Date().toISOString(),
    totalMessages: (current.total_messages ?? 0) + 1,
    milestonesReached: current.milestones_reached ?? [],
  });
}

// --- STORY ARCS ---

export interface StoryArc {
  id?: string;
  userId: string;
  characterId?: string;
  title: string;
  currentChapter: number;
  totalChapters: number;
  arcState: Record<string, any>;
  cliffhanger?: string;
  lastPlayed?: string;
  completedAt?: string;
  createdAt?: string;
}

export async function loadStoryArcs(userId: string): Promise<StoryArc[]> {
  const { data } = await supabase
    .from('story_arcs')
    .select('*')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('last_played', { ascending: false });

  return (data || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    characterId: r.character_id,
    title: r.title,
    currentChapter: r.current_chapter,
    totalChapters: r.total_chapters,
    arcState: r.arc_state ?? {},
    cliffhanger: r.cliffhanger,
    lastPlayed: r.last_played,
    completedAt: r.completed_at,
    createdAt: r.created_at,
  }));
}

export async function saveStoryArc(arc: StoryArc): Promise<StoryArc> {
  const payload: Record<string, any> = {
    user_id: arc.userId,
    character_id: arc.characterId ?? null,
    title: arc.title,
    current_chapter: arc.currentChapter,
    total_chapters: arc.totalChapters,
    arc_state: arc.arcState,
    cliffhanger: arc.cliffhanger ?? null,
    last_played: new Date().toISOString(),
  };
  if (arc.id) payload.id = arc.id;
  if (arc.completedAt) payload.completed_at = arc.completedAt;

  const { data } = await supabase.from('story_arcs').upsert(payload).select().single();
  return { ...arc, id: data?.id ?? arc.id };
}

export async function completeStoryArc(arcId: string) {
  await supabase.from('story_arcs').update({ completed_at: new Date().toISOString() }).eq('id', arcId);
}

export async function getActiveArcForCharacter(userId: string, characterId: string): Promise<StoryArc | null> {
  const { data } = await supabase
    .from('story_arcs')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .is('completed_at', null)
    .order('last_played', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    characterId: data.character_id,
    title: data.title,
    currentChapter: data.current_chapter,
    totalChapters: data.total_chapters,
    arcState: data.arc_state ?? {},
    cliffhanger: data.cliffhanger,
    lastPlayed: data.last_played,
    createdAt: data.created_at,
  };
}
