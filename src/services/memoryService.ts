import { supabase } from './supabase';
import { UserCharacterMemory, RelationshipPhase, VisualTheme, TypingIndicatorConfig, TypingIndicatorState, PhaseConfig, Character, ChatSession, UserProfile } from '../types';

// Feature 1: Persistent Memory Service
export class MemoryService {
  private tableName = 'user_character_memories';

  // Get memory for user + character pair
  async getMemory(userId: string, characterId: string): Promise<UserCharacterMemory | null> {
    const { data, error } = await supabase
      .from(this.tableName)
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .single();

    if (error) {
      console.error('Error fetching memory:', error);
      return null;
    }

    return data;
  }

  // Save memory for user + character pair
  async saveMemory(userId: string, characterId: string, memory: Partial<UserCharacterMemory>): Promise<UserCharacterMemory | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert({
        user_id: userId,
        character_id: characterId,
        summary: memory.summary || '',
        key_facts: memory.keyFacts || [],
        user_preferences: memory.userPreferences || [],
      }, { onConflict: 'user_id,character_id' });

    if (error) {
      console.error('Error saving memory:', error);
      return null;
    }

    return data;
  }

  // Extract and summarize memories from conversation
  async extractMemories(messages: any[], user: UserProfile): Promise<string[]> {
    // Extract key facts from conversation
    const facts: string[] = [];

    // Analyze conversation for important information
    for (const message of messages) {
      if (message.role === 'user') {
        // Extract named entities, preferences, important details
        // This is a simplified version - in production, use NLP for entity extraction
        const text = message.text.toLowerCase();
        
        // Example: "I love chocolate" -> "User loves chocolate"
        if (text.includes('i love')) {
          const match = text.match(/i love (.*?)\b/);
          if (match) facts.push(`User loves ${match[1]}`);
        }
      }
    }

    return facts;
  }

  // Update memory with new conversation
  async updateMemory(userId: string, characterId: string, newMessages: any[]): Promise<void> {
    const existingMemory = await this.getMemory(userId, characterId);
    
    const facts = await this.extractMemories(newMessages, { id: userId } as UserProfile);
    
    const updatedMemory: Partial<UserCharacterMemory> = {
      summary: this.summarizeConversation(newMessages),
      keyFacts: facts,
      userPreferences: facts,
    };

    await this.saveMemory(userId, characterId, updatedMemory);
  }

  // Summarize conversation (keep under 2000 tokens)
  private summarizeConversation(messages: any[]): string {
    // Simple summarization - in production, use LLM for better summarization
    const summary = messages
      .slice(-10) // Last 10 messages
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text.substring(0, 100)}...`)
      .join('\n');
    
    return summary;
  }
}

// Feature 3: Real-time Feedback Service
export class FeedbackService {
  // Get typing indicator based on context
  getTypingIndicator(state: TypingIndicatorState, context: any): TypingIndicatorConfig {
    const indicators: Record<TypingIndicatorState, TypingIndicatorConfig> = {
      thinking: {
        state: 'thinking',
        message: 'ze denkt na...',
        animation: 'pulse',
    durationMs: 2000,
  },
  biting_lip: {
    state: 'biting_lip',
    message: 'ze bijt op haar lip...',
    animation: 'pulse',
    durationMs: 1500,
  },
  typing_fast: {
    state: 'typing_fast',
    message: 'ze typt snel...',
    animation: 'pulse',
    durationMs: 1000,
  },
  hesitating: {
    state: 'hesitating',
    message: 'ze aarzelt even...',
    animation: 'pulse',
    durationMs: 1500,
  },
  excited: {
    state: 'excited',
    message: 'ze is opgewonden!',
    animation: 'bounce',
    durationMs: 1000,
  },
  blushing: {
    state: 'blushing',
    message: 'ze wordt rood...',
    animation: 'pulse',
    durationMs: 1500,
  },
  breathing_heavy: {
    state: 'breathing_heavy',
    message: 'ze ademt zwaar...',
    animation: 'breathe',
    durationMs: 2000,
  },
};

return indicators[state] || indicators.thinking;
}

// Get emotional typing message based on sentiment
getEmotionalTypingMessage(sentiment: 'positive' | 'neutral' | 'negative'): string {
const messages: Record<string, string> = {
positive: 'ze glimlacht...',
neutral: 'ze kijkt neutraal...',
negative: 'ze zucht...',
};

return messages[sentiment] || messages.neutral;
}
}

// Feature 2: Character Evolution Service
export class EvolutionService {
  // Get phase config for current phase
  getPhaseConfig(phase: RelationshipPhase): PhaseConfig {
    const phases: Record<RelationshipPhase, PhaseConfig> = {
  meeting: {
    phase: 'meeting',
    minInteractions: 0,
    toneDescription: 'Friendly, polite, getting to know you',
    vocabularyLevel: 'formal',
    intimacyLevel: 10,
    visualTheme: 'casual',
    systemPromptModifier: 'Be friendly and polite, getting to know the user.',
},
acquaintance: {
  phase: 'acquaintance',
  minInteractions: 10,
  toneDescription: 'Comfortable, friendly, building connection',
  vocabularyLevel: 'casual',
  intimacyLevel: 20,
  visualTheme: 'casual',
  systemPromptModifier: 'Be comfortable and friendly, building connection with user.',
},
flirt: {
  phase: 'flirt',
  minInteractions: 30,
  toneDescription: 'Playful, teasing, romantic',
  vocabularyLevel: 'casual',
  intimacyLevel: 40,
  visualTheme: 'intimate',
  systemPromptModifier: 'Be playful and teasing, showing romantic interest in user.',
},
intimate: {
  phase: 'intimate',
  minInteractions: 50,
  toneDescription: 'Passionate, romantic, deeply connected',
  vocabularyLevel: 'casual',
  intimacyLevel: 60,
  visualTheme: 'intimate',
  systemPromptModifier: 'Be passionate and romantic, deeply connected to user.',
},
  deep_trust: {
    phase: 'deep_trust',
    minInteractions: 100,
    toneDescription: 'Deeply connected, passionate, soulful',
    vocabularyLevel: 'casual',
    intimacyLevel: 80,
    visualTheme: 'romantic',
    systemPromptModifier: 'Be deeply connected and passionate, soulful connection with user.',
  },
};

return phases[phase] || phases.meeting;
}

// Get next phase based on interaction count
getNextPhase(currentPhase: RelationshipPhase, interactionCount: number): RelationshipPhase {
const phases: RelationshipPhase[] = ['meeting', 'acquaintance', 'flirt', 'intimate', 'deep_trust'];
const currentIndex = phases.indexOf(currentPhase);

if (currentIndex === phases.length - 1) return currentPhase;

const nextIndex = currentIndex + 1;
return phases[nextIndex];
}

// Check if phase transition should occur
shouldTransition(currentPhase: RelationshipPhase, interactionCount: number): boolean {
const phaseConfig = this.getPhaseConfig(currentPhase);
return interactionCount >= phaseConfig.minInteractions;
}

// Get visual theme based on sentiment and phase
getVisualTheme(sentiment: 'positive' | 'neutral' | 'negative', currentPhase: RelationshipPhase): VisualTheme {
const themes: Record<string, VisualTheme> = {
positive: 'intimate',
neutral: 'casual',
negative: 'playful',
};

return themes[sentiment] || themes.neutral;
}
}

// Feature 4: Retention Service
export class RetentionService {
  private tableName = 'user_activity';

  // Update user activity timestamp
  async updateActivity(userId: string, sessionId?: string, characterId?: string): Promise<void> {
    const { error } = await supabase
    .from(this.tableName)
    .upsert({
      user_id: userId,
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating activity:', error);
    }
  }

  // Check if user is inactive
  async checkInactivity(userId: string, thresholdDays: number): Promise<boolean> {
    const { data, error } = await supabase
    .from(this.tableName)
    .select('last_active_at')
    .eq('user_id', userId)
    .single();

    if (error) {
      console.error('Error checking inactivity:', error);
      return false;
    }

    if (!data) return false;

    const lastActive = new Date(data.last_active_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays >= thresholdDays;
  }

  // Get user inactivity status
  async getInactivityStatus(userId: string): Promise<'active' | 'at_risk' | 'inactive' | 'churned'> {
    const { data, error } = await supabase
    .from(this.tableName)
    .select('last_active_at, total_sessions')
    .eq('user_id', userId)
    .single();

    if (error) {
      console.error('Error getting inactivity status:', error);
    }

    if (!data) return 'churned';

    const lastActive = new Date(data.last_active_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 60 * 24));

    if (diffDays < 1) return 'active';
    if (diffDays < 3) return 'at_risk';
    if (diffDays < 7) return 'inactive';
    return 'churned';
  }

  // Get user inactivity days
  async getInactivityDays(userId: string): Promise<number> {
    const { data, error } = await supabase
    .from(this.tableName)
    .select('last_active_at')
    .eq('user_id', userId)
    .single();

    if (error) {
      console.error('Error getting inactivity days:', error);
    }

    if (!data) return 0;

    const lastActive = new Date(data.last_active_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 60 * 60 * 24));

    return diffDays;
  }

  // Get user inactivity status message
  async getInactivityMessage(userId: string): Promise<string> {
    const status = await this.getInactivityStatus(userId);

    const messages: Record<string, string> = {
  active: 'Welkom terug!',
  at_risk: 'We miss je al een paar dagen...',
  inactive: 'We miss je!',
  churned: 'We miss je!',
};

    return messages[status] || messages.active;
  }
}

// Feature 5: A/B Testing Service
export class ABTestingService {
  private tableName = 'experiments';

  // Get experiment variant for user
  async getVariant(userId: string, experimentId: string): Promise<string> {
    const { data, error } = await supabase
    .from(this.tableName)
    .select('variants')
    .eq('id', experimentId)
    .single();

    if (error) {
      console.error('Error getting variant:', error);
    }

    if (!data) return 'control';

    const variants = data.variants;
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) return variant.id;
    }

    return 'control';
  }

  // Log experiment event
  async logEvent(userId: string, experimentId: string, variantId: string, eventType: string): Promise<void> {
    const { error } = await supabase
    .from('experiment_events')
    .insert({
      user_id: userId,
      experiment_id: experimentId,
      variant_id: variantId,
      event_type: eventType,
    });

    if (error) {
      console.error('Error logging event:', error);
    }
  }
}

// Feature 6: Multilingual Quality Service
export class MultilingualQualityService {
  // Check grammar in text
  async checkGrammar(text: string, language: string): Promise<{ hasErrors: boolean; correctedText: string }>{
    // In production, use grammar API or LLM for grammar checking
    const hasErrors = false;
    const correctedText = text;

    return { hasErrors, correctedText };
  }

  // Correct grammar in text
  async correctGrammar(text: string, language: string): Promise<string> {
    // In production, use grammar API or LLM for grammar correction
    return text;
  }
}

// Feature 7: Visual Theming Service
export class VisualThemingService {
  // Get theme CSS variables
  getThemeCSSVariables(theme: VisualTheme): Record<string, string> {
    const themes: Record<VisualTheme, Record<string, string>> = {
  casual: {
    '--chat-bg': '#f5f5f5f5',
    '--chat-bubble-user': '#e3f2ff',
    '--chat-bubble-ai': '#e8f5e9',
    '--accent-color': '#2196f3',
    '--gradient-start': '#e3f2ff',
    '--gradient-end': '#ffffff',
  },
  intimate: {
    '--chat-bg': '#fff0f5',
    '--chat-bubble-user': '#fce4ec',
    '--chat-bubble-ai': '#f3e5e5',
    '--accent-color': '#e91e69',
    '--gradient-start': '#fce4ec',
    '--gradient-end': '#f8bbd0',
  },
  dominant: {
    '--chat-bg': '#1a1a1a',
    '--chat-bubble-user': '#2d2d2d',
    '--chat-bubble-ai': '#000000',
    '--accent-color': '#000000',
    '--gradient-start': '#2d2d2d',
    '--gradient-end': '#000000',
  },
  romantic: {
    '--chat-bg': '#fff0f5',
    '--chat-bubble-user': '#fce4ec',
    '--chat-bubble-ai': '#f8bbd0',
    '--accent-color': '#e91e69',
    '--gradient-start': '#fce4ec',
    '--gradient-end': '#f8bbd0',
  },
  playful: {
    '--chat-bg': '#fff',
    '--chat-bubble-user': '#fff',
    '--chat-bubble-ai': '#fff',
    '--accent-color': '#000',
    '--gradient-start': '#fff',
    '--gradient-end': '#ccc',
  },
};

return themes[theme] || themes.casual;
}

// Get theme CSS variables for character
getCharacterThemeCSSVariables(characterId: string, theme: VisualTheme): Record<string, string> {
return this.getThemeCSSVariables(theme);
}
}

// Feature 1: Persistent Memory Service
export const memoryService = new MemoryService();

// Feature 3: Real-time Feedback Service
export const feedbackService = new FeedbackService();

// Feature 2: Character Evolution Service
export const evolutionService = new EvolutionService();

// Feature 4: Retention Service
export const retentionService = new RetentionService();

// Feature 5: A/B Testing Service
export const abTestingService = new ABTestingService();

// Feature 6: Multilingual Quality Service
export const multilingualQualityService = new MultilingualQualityService();

// Feature 7: Visual Theming Service
export const visualThemingService = new VisualThemingService();
