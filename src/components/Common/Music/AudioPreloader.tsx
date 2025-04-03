"use client";

import { useEffect, useRef } from 'react';
import { audioPaths } from '@/components/Common/Paths/AudioPath';
import { useAudio } from '@/lib/contexts/AudioContext';

/**
 * AudioPreloader component that preloads audio files on the client side
 * to ensure they're ready for playback when needed. This helps avoid
 * playback delays when playing sounds for the first time.
 */
const AudioPreloader = () => {
  const { volume } = useAudio();
  const preloadedAudio = useRef<{[key: string]: HTMLAudioElement}>({});
  
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    console.log('Starting audio preloading process');
    
    // Function to preload a sound file and handle errors
    const preloadAudio = (path: string, name: string) => {
      try {
        // Skip if already preloaded
        if (preloadedAudio.current[name]) return;
        
        console.log(`Preloading audio: ${name} from ${path}`);
        const audio = new Audio();
        audio.preload = 'auto';
        
        // Handle loading errors with fallback to OGG
        audio.onerror = () => {
          console.warn(`Error preloading ${path}, trying OGG fallback`);
          const oggPath = path.replace('.mp3', '.ogg');
          
          const oggAudio = new Audio();
          oggAudio.preload = 'auto';
          oggAudio.src = oggPath;
          
          oggAudio.onerror = () => {
            console.error(`Both MP3 and OGG preloading failed for ${name}`);
          };
          
          oggAudio.oncanplaythrough = () => {
            console.log(`OGG fallback for ${name} loaded successfully`);
            preloadedAudio.current[name] = oggAudio;
          };
        };
        
        // Handle successful load
        audio.oncanplaythrough = () => {
          console.log(`Audio ${name} preloaded successfully`);
          preloadedAudio.current[name] = audio;
        };
        
        // Start loading
        audio.src = path;
        
        return audio;
      } catch (error) {
        console.error(`Failed to preload audio ${name}:`, error);
        return null;
      }
    };
    
    // Preload sound effects
    Object.entries(audioPaths.sfx).forEach(([key, path]) => {
      preloadAudio(path, `sfx_${key}`);
    });
    
    // Preload only the main background music (to save resources)
    const mainBgm = audioPaths.bgm.ddlcMainTheme80s;
    preloadAudio(mainBgm, 'bgm_main');
    
    // Capture a reference to the current audio elements for cleanup
    const currentAudio = { ...preloadedAudio.current };
    
    // Clean up function
    return () => {
      // Remove all event listeners and release audio resources
      Object.values(currentAudio).forEach(audio => {
        if (audio) {
          audio.oncanplaythrough = null;
          audio.onerror = null;
          audio.src = '';
        }
      });
      console.log('Audio preloader cleaned up');
    };
  }, []);
  
  // Update volume when the global volume changes
  useEffect(() => {
    Object.values(preloadedAudio.current).forEach(audio => {
      if (audio) {
        audio.volume = volume;
      }
    });
  }, [volume]);
  
  // This component doesn't render anything
  return null;
};

export default AudioPreloader; 