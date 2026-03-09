// Content Moderation Module
// Implements keyword-based filtering for explicit sexual content

export interface ModerationResult {
  isAllowed: boolean;
  reason?: string;
  flaggedTerms?: string[];
}

// Blocked terms in multiple languages (Dutch, English, and other common languages)
// These are sexual/explicit terms that violate content policies
const BLOCKED_TERMS: string[] = [
  // Dutch explicit sexual terms
  'geil', 'geilste', 'sex', 'seks', 'sexverhalen', 'seksverhalen', 'druipende',
  'xxx', 'xxx-chatbot', 'opwindend', 'hijgend', 'nat', 'vies', 'dirty',
  'verslavende', 'verslaafd', 'lust', 'verlangen', 'intiem', 'intieme',
  'orgasme', 'klaarkomen', 'masturberen', 'masturbatie', 'porno', 'pornografie',
  'naakt', 'naakte', 'bloot', 'erotisch', 'erotische', 'stouterd', 'stoute',
  'beffen', 'neuken', 'vrijen', 'penetratie', 'penis', 'lul', 'kut', 'tieten',
  'borsten', 'kont', 'reet', 'anus', 'sperma', 'zaad', 'pis', 'plassen',
  'bdsm', 'fetish', 'fetisj', 'kinky', 'submissive', 'dominant', 'slaaf',
  'meesteres', 'dildo', 'vibrator', 'seksspeeltje', 'seksspeeltjes',
  // English explicit sexual terms
  'horny', 'sexual', 'porn', 'pornography', 'explicit',
  'masturbation', 'masturbate', 'orgasm', 'cum', 'cumming', 'ejaculate',
  'naked', 'nude', 'nudity', 'erotic', 'erotica', 'blowjob', 'handjob',
  'fuck', 'fucking', 'fucked', 'shit', 'ass', 'asshole', 'dick', 'cock',
  'pussy', 'vagina', 'boobs', 'tits', 'anal', 'oral', 'sexting',
  'nsfw', 'adult content', 'adult material', 'kink', 'bdsm',
  'domination', 'submission', 'slave', 'master', 'mistress', 'bondage',
  'buttplug', 'cumshot', 'creampie',
  'gangbang', 'threesome', 'foursome', 'orgy', 'swingers', 'cuckold',
  'intercourse', 'copulation', 'fornication', 'sodomy', 'bestiality',
  'incest', 'rape', 'molestation', 'pedophilia', 'child porn',
  // Other common languages (German, French, Spanish, Italian)
  'sexuell', 'nackt', 'erotik', 'ficken', 'arsch', 'schwanz', 'muschi',
  'sexuel', 'nu', 'erotique', 'baiser', 'cul', 'bite', 'chatte', 'seins',
  'sexo', 'desnudo', 'erotico', 'follar', 'culo', 'polla',
  'sesso', 'nudo', 'scopare', 'cazzo', 'figa',
];

/**
 * Check if text contains any blocked/explicit content
 * @param text The text to check
 * @returns ModerationResult indicating if content is allowed
 */
export function checkContent(text: string): ModerationResult {
  if (!text || typeof text !== 'string') {
    return { isAllowed: true }; // Empty content is allowed
  }

  const normalizedText = text.toLowerCase();
  const flaggedTerms: string[] = [];

  // Check for exact matches and partial matches
  for (const term of BLOCKED_TERMS) {
    // Check for whole word match with word boundaries
    const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(term)}\\b`, 'i');
    if (wordBoundaryRegex.test(normalizedText)) {
      flaggedTerms.push(term);
      continue;
    }
    
    // Also check for the term as part of larger words (for compound words)
    if (normalizedText.includes(term.toLowerCase())) {
      flaggedTerms.push(term);
    }
  }

  if (flaggedTerms.length > 0) {
    return {
      isAllowed: false,
      reason: 'Content contains prohibited terms that violate our content policy.',
      flaggedTerms: [...new Set(flaggedTerms)], // Remove duplicates
    };
  }

  return { isAllowed: true };
}

/**
 * Check content across multiple text fields
 * @param texts Object with field names as keys and text content as values
 * @returns ModerationResult indicating if all content is allowed
 */
export function checkMultipleContent(texts: Record<string, string>): ModerationResult {
  const allFlaggedTerms: string[] = [];
  const flaggedFields: string[] = [];

  for (const [field, text] of Object.entries(texts)) {
    const result = checkContent(text);
    if (!result.isAllowed) {
      allFlaggedTerms.push(...(result.flaggedTerms || []));
      flaggedFields.push(field);
    }
  }

  if (flaggedFields.length > 0) {
    return {
      isAllowed: false,
      reason: `Content in field(s) [${flaggedFields.join(', ')}] violates our content policy.`,
      flaggedTerms: [...new Set(allFlaggedTerms)],
    };
  }

  return { isAllowed: true };
}

/**
 * Check chat messages for explicit content
 * @param messages Array of chat messages with role and content
 * @returns ModerationResult
 */
export function checkChatMessages(messages: Array<{ role: string; content: string }>): ModerationResult {
  if (!Array.isArray(messages)) {
    return {
      isAllowed: false,
      reason: 'Invalid messages format.',
    };
  }

  const texts: Record<string, string> = {};
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg && typeof msg.content === 'string') {
      texts[`message_${i}`] = msg.content;
    }
  }

  return checkMultipleContent(texts);
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if an image generation prompt contains inappropriate content
 * @param prompt The image generation prompt
 * @returns ModerationResult
 */
export function checkImagePrompt(prompt: string): ModerationResult {
  // Image prompts get stricter checking
  const result = checkContent(prompt);
  
  if (!result.isAllowed) {
    return {
      isAllowed: false,
      reason: 'Image generation request contains content that violates our safety policy.',
      flaggedTerms: result.flaggedTerms,
    };
  }

  return { isAllowed: true };
}

// Default export for convenience
export default {
  checkContent,
  checkMultipleContent,
  checkChatMessages,
  checkImagePrompt,
};
