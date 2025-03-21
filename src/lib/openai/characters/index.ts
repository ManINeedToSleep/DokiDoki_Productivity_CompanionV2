import { 
  SAYORI_ID, SAYORI_TRAITS, SAYORI_SPEECH, SAYORI_INTERESTS, SAYORI_EMOTIONS, 
  SAYORI_RESPONSES, SAYORI_MODIFIERS, SAYORI_RELATIONSHIPS,
  SAYORI_LEVEL_TRAITS, SAYORI_LEVEL_EMOTIONS, SAYORI_HIGH_LEVEL_CATCHPHRASES
} from './sayori';
import { 
  NATSUKI_ID, NATSUKI_TRAITS, NATSUKI_SPEECH, NATSUKI_INTERESTS, NATSUKI_EMOTIONS, 
  NATSUKI_RESPONSES, NATSUKI_MODIFIERS, NATSUKI_RELATIONSHIPS,
  NATSUKI_LEVEL_TRAITS, NATSUKI_LEVEL_EMOTIONS, NATSUKI_HIGH_LEVEL_CATCHPHRASES
} from './natsuki';
import { 
  YURI_ID, YURI_TRAITS, YURI_SPEECH, YURI_INTERESTS, YURI_EMOTIONS, 
  YURI_RESPONSES, YURI_MODIFIERS, YURI_RELATIONSHIPS,
  YURI_LEVEL_TRAITS, YURI_LEVEL_EMOTIONS, YURI_HIGH_LEVEL_CATCHPHRASES
} from './yuri';
import { 
  MONIKA_ID, MONIKA_TRAITS, MONIKA_SPEECH, MONIKA_INTERESTS, MONIKA_EMOTIONS, 
  MONIKA_RESPONSES, MONIKA_MODIFIERS, MONIKA_RELATIONSHIPS,
  MONIKA_LEVEL_TRAITS, MONIKA_LEVEL_EMOTIONS, MONIKA_HIGH_LEVEL_CATCHPHRASES
} from './monika';

// Export all character IDs
export const CHARACTER_IDS = {
  SAYORI: SAYORI_ID,
  NATSUKI: NATSUKI_ID,
  YURI: YURI_ID,
  MONIKA: MONIKA_ID
} as const;

// Export all character traits
export const CHARACTER_TRAITS = {
  SAYORI: SAYORI_TRAITS,
  NATSUKI: NATSUKI_TRAITS,
  YURI: YURI_TRAITS,
  MONIKA: MONIKA_TRAITS
} as const;

// Export all character speech patterns
export const CHARACTER_SPEECH = {
  SAYORI: SAYORI_SPEECH,
  NATSUKI: NATSUKI_SPEECH,
  YURI: YURI_SPEECH,
  MONIKA: MONIKA_SPEECH
} as const;

// Export all character interests
export const CHARACTER_INTERESTS = {
  SAYORI: SAYORI_INTERESTS,
  NATSUKI: NATSUKI_INTERESTS,
  YURI: YURI_INTERESTS,
  MONIKA: MONIKA_INTERESTS
} as const;

// Export all character emotions
export const CHARACTER_EMOTIONS = {
  SAYORI: SAYORI_EMOTIONS,
  NATSUKI: NATSUKI_EMOTIONS,
  YURI: YURI_EMOTIONS,
  MONIKA: MONIKA_EMOTIONS
} as const;

// Export all character responses
export const CHARACTER_RESPONSES = {
  SAYORI: SAYORI_RESPONSES,
  NATSUKI: NATSUKI_RESPONSES,
  YURI: YURI_RESPONSES,
  MONIKA: MONIKA_RESPONSES
} as const;

// Export all character modifiers
export const CHARACTER_MODIFIERS = {
  SAYORI: SAYORI_MODIFIERS,
  NATSUKI: NATSUKI_MODIFIERS,
  YURI: YURI_MODIFIERS,
  MONIKA: MONIKA_MODIFIERS
} as const;

// Export all character relationships
export const CHARACTER_RELATIONSHIPS = {
  SAYORI: SAYORI_RELATIONSHIPS,
  NATSUKI: NATSUKI_RELATIONSHIPS,
  YURI: YURI_RELATIONSHIPS,
  MONIKA: MONIKA_RELATIONSHIPS
} as const;

// Export all character level-based traits
export const CHARACTER_LEVEL_TRAITS = {
  SAYORI: SAYORI_LEVEL_TRAITS,
  NATSUKI: NATSUKI_LEVEL_TRAITS,
  YURI: YURI_LEVEL_TRAITS,
  MONIKA: MONIKA_LEVEL_TRAITS
} as const;

// Export all character level-based emotions
export const CHARACTER_LEVEL_EMOTIONS = {
  SAYORI: SAYORI_LEVEL_EMOTIONS,
  NATSUKI: NATSUKI_LEVEL_EMOTIONS,
  YURI: YURI_LEVEL_EMOTIONS,
  MONIKA: MONIKA_LEVEL_EMOTIONS
} as const;

// Export all character high-level catchphrases
export const CHARACTER_HIGH_LEVEL_CATCHPHRASES = {
  SAYORI: SAYORI_HIGH_LEVEL_CATCHPHRASES,
  NATSUKI: NATSUKI_HIGH_LEVEL_CATCHPHRASES,
  YURI: YURI_HIGH_LEVEL_CATCHPHRASES,
  MONIKA: MONIKA_HIGH_LEVEL_CATCHPHRASES
} as const;

// Export individual characters with level-based components
export {
  // Sayori exports
  SAYORI_ID,
  SAYORI_TRAITS,
  SAYORI_SPEECH,
  SAYORI_INTERESTS,
  SAYORI_EMOTIONS,
  SAYORI_RESPONSES,
  SAYORI_MODIFIERS,
  SAYORI_RELATIONSHIPS,
  SAYORI_LEVEL_TRAITS,
  SAYORI_LEVEL_EMOTIONS,
  SAYORI_HIGH_LEVEL_CATCHPHRASES,

  // Natsuki exports
  NATSUKI_ID,
  NATSUKI_TRAITS,
  NATSUKI_SPEECH,
  NATSUKI_INTERESTS,
  NATSUKI_EMOTIONS,
  NATSUKI_RESPONSES,
  NATSUKI_MODIFIERS,
  NATSUKI_RELATIONSHIPS,
  NATSUKI_LEVEL_TRAITS,
  NATSUKI_LEVEL_EMOTIONS,
  NATSUKI_HIGH_LEVEL_CATCHPHRASES,

  // Yuri exports
  YURI_ID,
  YURI_TRAITS,
  YURI_SPEECH,
  YURI_INTERESTS,
  YURI_EMOTIONS,
  YURI_RESPONSES,
  YURI_MODIFIERS,
  YURI_RELATIONSHIPS,
  YURI_LEVEL_TRAITS,
  YURI_LEVEL_EMOTIONS,
  YURI_HIGH_LEVEL_CATCHPHRASES,

  // Monika exports
  MONIKA_ID,
  MONIKA_TRAITS,
  MONIKA_SPEECH,
  MONIKA_INTERESTS,
  MONIKA_EMOTIONS,
  MONIKA_RESPONSES,
  MONIKA_MODIFIERS,
  MONIKA_RELATIONSHIPS,
  MONIKA_LEVEL_TRAITS,
  MONIKA_LEVEL_EMOTIONS,
  MONIKA_HIGH_LEVEL_CATCHPHRASES
}; 