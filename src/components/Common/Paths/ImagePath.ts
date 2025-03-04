import { CompanionId } from '@/lib/firebase/companion';

// Extended mood type to include all possible moods
export type ExtendedCompanionMood = 
  'happy' | 'sad' | 'angry' | 'excited' | 'surprised' | 
  'thoughtful' | 'neutral' | 'embarrassed' | 'proud' | 'worried' | 'annoyed';

// Background ID type
export type BackgroundId = keyof typeof imagePaths.characterBackgrounds;

export const imagePaths = {
  characterBackgrounds: {
    monikaTrust1: "/images/characters/character_backgrounds/Monika-Trust-1.png",
    natsukiSpecial1: "/images/characters/character_backgrounds/Natsuki-Special-1.png",
    natsukiSpecial2: "/images/characters/character_backgrounds/Natsuki-Special-2.png",
    sayoriSpecial2: "/images/characters/character_backgrounds/Sayori-Special-2.png",
    sayoriTrust1: "/images/characters/character_backgrounds/Sayori-Trust-1.png",
    yuriSpecial2: "/images/characters/character_backgrounds/Yuri-Special-2.png",
    yuriTrust1: "/images/characters/character_backgrounds/Yuri-Trust-1.png",
  },
  characterSprites: {
    monikaChibi: "/images/characters/sprites/Monika-Chibi.png",
    monika: "/images/characters/sprites/Monika.png",
    natsukiChibi: "/images/characters/sprites/Natsuki-Chibi.png",
    natsuki: "/images/characters/sprites/Natsuki.png",
    sayoriChibi: "/images/characters/sprites/Sayori-Chibi.png",
    sayori: "/images/characters/sprites/Sayori.png",
    yuriChibi: "/images/characters/sprites/Yuri-Chibi.png",
    yuri: "/images/characters/sprites/Yuri.png",
  },
  characterMoods: {
    sayori: {
      happy: "/images/characters/sprites/Sayori.png",
      sad: "/images/characters/sprites/Sayori.png",
      angry: "/images/characters/sprites/Sayori.png",
      excited: "/images/characters/sprites/Sayori.png",
      surprised: "/images/characters/sprites/Sayori.png",
      thoughtful: "/images/characters/sprites/Sayori.png",
      neutral: "/images/characters/sprites/Sayori.png",
      embarrassed: "/images/characters/sprites/Sayori.png",
      proud: "/images/characters/sprites/Sayori.png",
      worried: "/images/characters/sprites/Sayori.png",
      annoyed: "/images/characters/sprites/Sayori.png",
    },
    natsuki: {
      happy: "/images/characters/sprites/Natsuki.png",
      sad: "/images/characters/sprites/Natsuki.png",
      angry: "/images/characters/sprites/Natsuki.png",
      excited: "/images/characters/sprites/Natsuki.png",
      surprised: "/images/characters/sprites/Natsuki.png",
      thoughtful: "/images/characters/sprites/Natsuki.png",
      neutral: "/images/characters/sprites/Natsuki.png",
      embarrassed: "/images/characters/sprites/Natsuki.png",
      proud: "/images/characters/sprites/Natsuki.png",
      worried: "/images/characters/sprites/Natsuki.png",
      annoyed: "/images/characters/sprites/Natsuki.png",
    },
    yuri: {
      happy: "/images/characters/sprites/Yuri.png",
      sad: "/images/characters/sprites/Yuri.png",
      angry: "/images/characters/sprites/Yuri.png",
      excited: "/images/characters/sprites/Yuri.png",
      surprised: "/images/characters/sprites/Yuri.png",
      thoughtful: "/images/characters/sprites/Yuri.png",
      neutral: "/images/characters/sprites/Yuri.png",
      embarrassed: "/images/characters/sprites/Yuri.png",
      proud: "/images/characters/sprites/Yuri.png",
      worried: "/images/characters/sprites/Yuri.png",
      annoyed: "/images/characters/sprites/Yuri.png",
    },
    monika: {
      happy: "/images/characters/sprites/Monika.png",
      sad: "/images/characters/sprites/Monika.png",
      angry: "/images/characters/sprites/Monika.png",
      excited: "/images/characters/sprites/Monika.png",
      surprised: "/images/characters/sprites/Monika.png",
      thoughtful: "/images/characters/sprites/Monika.png",
      neutral: "/images/characters/sprites/Monika.png",
      embarrassed: "/images/characters/sprites/Monika.png",
      proud: "/images/characters/sprites/Monika.png",
      worried: "/images/characters/sprites/Monika.png",
      annoyed: "/images/characters/sprites/Monika.png",
    },
  },
  backgrounds: {
    menuBackground: "/images/backgrounds/Menu-Background.png",
    menuOption: "/images/backgrounds/Menu-Option.png",
  }
};

// Helper function to get the correct image path for a character
export const getCompanionImagePath = (
  characterId: CompanionId
): string => {
  // Return the default sprite
  return imagePaths.characterSprites[characterId];
};

// Helper function to get the chibi version of a character
export const getCompanionChibiPath = (characterId: CompanionId): string => {
  return imagePaths.characterSprites[`${characterId}Chibi`];
};

// Helper function to get a character background
export const getCharacterBackgroundPath = (backgroundId: BackgroundId): string => {
  return imagePaths.characterBackgrounds[backgroundId];
};

// Helper function to get a character background by string (with type checking)
export const getCharacterBackgroundPathByString = (backgroundId: string): string => {
  // Check if the backgroundId is a valid key in characterBackgrounds
  if (backgroundId in imagePaths.characterBackgrounds) {
    return imagePaths.characterBackgrounds[backgroundId as BackgroundId];
  }
  return ''; // Return empty string if not found
};