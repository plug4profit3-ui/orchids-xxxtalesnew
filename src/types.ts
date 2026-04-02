
export type Role = 'user' | 'model';
export type Language = string; // Changed from 'nl' | 'en' to string to support all languages
export type VoiceStyle = 
  | 'whisper' 
  | 'seductive' 
  | 'nasty' 
  | 'normal' 
  | 'breathless' 
  | 'soft_aggressive' 
  | 'helpless_pleading' 
  | 'cold_distant' 
  | 'raspy' 
  | 'mature'
  | 'moaning_orgasmic'
  | 'teasing_playful'
  | 'sultry_purring'
  | 'nervous'
  | 'slow';

export type IntensityLevel = 'normal' | 'high' | 'extreme';
export type UserMood = 'horny' | 'stressed' | 'happy' | 'lonely' | 'casual' | 'angry' | 'curious';

export enum AppMode {
  STORY = 'story',
  CHAT = 'chat',
  GALLERY = 'gallery', 
  LIVE = 'live',
  CREATOR = 'creator',
  VIDEOS = 'videos',
  AUDIO_STORIES = 'audio_stories',
  IMAGINE = 'imagine',
  SOLO_COACH = 'solo_coach',
  PAYMENT_SUCCESS = 'payment_success',
  IMAGE_GALLERY = 'image_gallery',
  USAGE_DASHBOARD = 'usage_dashboard',
}

export type CharacterStance = 'neutral' | 'loving' | 'submissive' | 'dominant' | 'nasty';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
  isPremium: boolean;
  vipExpiresAt?: string;
  trialUsed?: boolean;
  credits: number;
  dailyMessagesLeft: number;
  lastLoginDate?: string; 
  streak?: number;
  isAuthenticated: boolean;
  isVerified: boolean;
  customCharacters?: Character[];
  unlockedTraits?: string[]; 
  unlockedAppearances?: string[]; 
  totalMessagesSent?: number;
  highestLevelReached?: number;
  favoriteCharacterIds?: string[];
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isError?: boolean;
  imageUrl?: string; 
  isGift?: boolean; 
  characterId?: string; // ID of the specific character speaking in a group
}

export interface RoleplayResponse {
  text: string;
  arousal: number;
  suggestions: string[];
  status: string;
  moodDetected?: UserMood;
  xpGained?: number;
  unlockedTrait?: string;
  imageUrl?: string;
  characterId?: string; // ID of the character who spoke
  new_memories?: string[]; // New: Extracted facts from the current interaction
  affection_change?: number; // Added: Change in affection level (-5 to +5)
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ModelConfig {
  modelName: string;
  category: string;
  temperature: number;
  topK: number;
  topP: number;
  systemInstruction: string;
}

export type RelationshipPhase = 'meeting' | 'acquaintance' | 'flirt' | 'intimate' | 'deep_trust';

export type VisualTheme = 'casual' | 'intimate' | 'dominant' | 'romantic' | 'playful';

export type TypingIndicatorState = 
  | 'thinking' 
  | 'biting_lip' 
  | 'typing_fast' 
  | 'hesitating' 
  | 'excited' 
  | 'blushing' 
  | 'breathing_heavy';

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  characterId: string; // Primary character (for backward compat)
  characterIds?: string[]; // List of all characters in the chat
  arousal: number;
  affection: number; 
  trust: number;     
  intimacy: number;  
  level: number;
  experience: number;
  stance?: CharacterStance;
  intensity?: IntensityLevel;
  voiceStyle?: VoiceStyle; // Added persistence for voice style
  speechSpeed?: number; // Added persistence for speech speed
  speechPitch?: number; // Added persistence for speech pitch
  unlockedTraits?: string[];
  messagesSinceLastImage?: number;
  memories?: string[]; // Moved: Stores facts specific to THIS conversation
  currentMood?: UserMood; // New: Tracks the detected mood of the user in this session
  relationshipPhase?: RelationshipPhase; // New: Current relationship phase with character
  interactionCount?: number; // New: Total message count for phase progression
  visualTheme?: VisualTheme; // New: Current visual theme based on sentiment/phase
}

// Feature 1: Persistent Memory per user+character
export interface UserCharacterMemory {
  id: string;
  userId: string;
  characterId: string;
  summary: string; // Condensed conversation summary (max ~500 tokens)
  keyFacts: string[]; // Extracted key facts about user
  userPreferences: string[]; // What the user likes/dislikes
  sharedExperiences: string[]; // Memorable moments from conversations
  lastInteractionAt: string;
  totalInteractions: number;
  affectionLevel: number; // 0-100 relationship strength
}

// Feature 2: Character Evolution
export interface PhaseConfig {
  phase: RelationshipPhase;
  minInteractions: number;
  toneDescription: string;
  vocabularyLevel: 'formal' | 'casual' | 'playful' | 'intimate' | 'explicit';
  intimacyLevel: number; // 0-100
  visualTheme: VisualTheme;
  systemPromptModifier: string;
}

// Feature 3: Real-time feedback
export interface TypingIndicatorConfig {
  state: TypingIndicatorState;
  message: string;
  animation: 'pulse' | 'bounce' | 'breathe' | 'heartbeat' | 'shake';
  durationMs: number;
}

// Feature 4: Exit-intent & Retention
export interface UserActivity {
  userId: string;
  lastActiveAt: string;
  lastSessionId?: string;
  lastCharacterId?: string;
  consecutiveInactiveDays: number;
  totalSessions: number;
  retentionStatus: 'active' | 'at_risk' | 'inactive' | 'churned';
}

// Feature 5: A/B Testing
export interface Experiment {
  id: string;
  name: string;
  featureFlag: string;
  variants: ExperimentVariant[];
  startDate: string;
  endDate?: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
}

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-1, must sum to 1 across variants
  config: Record<string, any>;
}

export interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

export interface ExperimentMetrics {
  experimentId: string;
  variantId: string;
  userId: string;
  sessionDuration: number;
  messageLength: number;
  convertedToPaid: boolean;
  churned7Day: boolean;
  recordedAt: string;
}

// Feature 7: Visual Theming
export interface CharacterTheme {
  id: string;
  characterId: string;
  theme: VisualTheme;
  cssVariables: {
    '--chat-bg': string;
    '--chat-bubble-user': string;
    '--chat-bubble-ai': string;
    '--accent-color': string;
    '--gradient-start': string;
    '--gradient-end': string;
  };
  avatarModifiers?: {
    outfit?: string;
    expression?: string;
    background?: string;
  };
}

export interface Character {
  id: string;
  name: string;
  desc: string;
  appearance: string; 
  video: string;
  avatar: string;
  voice: string; 
  voiceStyle?: VoiceStyle;
  backgroundImage?: string;
  isDoll?: boolean;
  isCustom?: boolean;
  personality?: string | string[];
  traits?: string[];
  phaseConfigs?: Record<RelationshipPhase, PhaseConfig>; // New: Per-phase configuration
  availableThemes?: VisualTheme[]; // New: Available visual themes for this character
}

export interface StoryConfig {
  category?: string;
  prompt?: string;
  characters: string[]; 
  toys: string[];
  keywords: string[];
  customKeywords?: string; 
  location: string;
  extremeness: number; 
  length: number; 
  voiceStyle?: VoiceStyle;
  intensity?: IntensityLevel;
}

export interface StoryTurn {
  text: string;
  choices: string[];
  title?: string;
}

export interface SavedStory {
  id: string;
  title: string;
  turns: StoryTurn[];
  config: StoryConfig;
  timestamp: number;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  cost: number;
  affectionBoost: number;
  description: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface EntitlementData {
  vipActive: boolean;
  plan: string;
  expiresAt?: string;
}

// Legal Types
export interface LegalSection {
  title: string;
  content: string | string[]; // Can be a single paragraph or multiple
  list?: string[];
  subSections?: {
    title?: string;
    content?: string;
    list?: { label: string; text: string }[] | string[];
  }[];
  warningText?: string;
  footer?: string;
}

export interface LegalContent {
  privacy: LegalSection[];
  terms: LegalSection[];
  labels: {
    privacy_title: string;
    terms_title: string;
    last_updated: string;
    close: string;
    contact: string;
  };
}