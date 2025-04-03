import { audioPaths } from '@/components/Common/Paths/AudioPath';

// Define sound effect types based on what's available in audioPaths
export type DDLCSoundEffect = 
  | 'select'
  | 'hover'
  | 'glitch1'
  | 'glitch2'
  | 'glitch3'
  | 'selectGlitch'
  | 'pageflip'
  | 'giggle'
  | 'crack'
  | 'closetOpen'
  | 'closetClose'
  | 'notif'
  | 'ddlcSelectSfx';

// Define background music types
export type DDLCBackgroundMusic = 
  | 'ddlcMainTheme80s'
  | 'monikasLullaby'
  | 'runereality';

// Map to get the path for a sound effect
export const getSoundEffectPath = (effect: DDLCSoundEffect): string => {
  return audioPaths.sfx[effect] || '';
};

// Map to get the path for a background music track
export const getBackgroundMusicPath = (music: DDLCBackgroundMusic): string => {
  return audioPaths.bgm[music] || '';
};

// Common sound effect mappings for the app
export const commonSoundEffects = {
  click: 'select' as DDLCSoundEffect,
  hover: 'hover' as DDLCSoundEffect,
  glitch: 'glitch1' as DDLCSoundEffect,
  error: 'glitch3' as DDLCSoundEffect,
  notification: 'notif' as DDLCSoundEffect
}; 