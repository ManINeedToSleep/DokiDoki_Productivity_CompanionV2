"use client";

import { useState, useEffect, useRef } from 'react';
import { audioPaths } from '@/components/Common/Paths/AudioPath';
import { getBackgroundMusicPath } from '@/types/audio';

// We'll use this in place of the previous SoundEffect type
export type SoundEffectType = 'hover' | 'click' | 'success' | 'error';

// Define the sound effects map
const soundEffectsMap: Record<SoundEffectType, string> = {
  hover: audioPaths.sfx.hover,
  click: audioPaths.sfx.select,
  success: audioPaths.sfx.giggle,
  error: audioPaths.sfx.glitch1
};

// Audio context for managing sound effects
let audioContext: AudioContext | null = null;
const soundEffects: { [key: string]: { buffer: AudioBuffer | null, source: AudioBufferSourceNode | null } } = {};

// Initialize the audio context on user interaction
const initAudioContext = () => {
  if (audioContext) return;
  
  try {
    // Create audio context
    audioContext = new (window.AudioContext || ((window as unknown) as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    console.log('Audio context initialized');
    
    // Load sound effects
    Object.entries(soundEffectsMap).forEach(([key, path]) => {
      soundEffects[key] = { buffer: null, source: null };
      fetch(path)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          if (audioContext) {
            return audioContext.decodeAudioData(arrayBuffer);
          }
          throw new Error('Audio context not available');
        })
        .then(audioBuffer => {
          soundEffects[key].buffer = audioBuffer;
          console.log(`Loaded sound effect: ${key}`);
        })
        .catch((error: Error) => {
          console.warn(`Failed to load sound effect ${key} from ${path}:`, error);
          
          // Try OGG as fallback
          const oggPath = path.replace('.mp3', '.ogg');
          console.log(`Trying OGG fallback: ${oggPath}`);
          
          fetch(oggPath)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
              if (audioContext) {
                return audioContext.decodeAudioData(arrayBuffer);
              }
              throw new Error('Audio context not available');
            })
            .then(audioBuffer => {
              soundEffects[key].buffer = audioBuffer;
              console.log(`Loaded fallback sound effect: ${key}`);
            })
            .catch((fallbackError: Error) => {
              console.error(`Failed to load fallback sound effect ${key}:`, fallbackError);
            });
        });
    });
  } catch (error) {
    console.error('Error initializing audio context:', error);
  }
};

// Play a sound effect
export const playSoundEffect = (type: SoundEffectType) => {
  if (!audioContext) {
    // Try to initialize on the first sound effect play
    initAudioContext();
    return;
  }
  
  try {
    const effect = soundEffects[type];
    if (!effect || !effect.buffer) {
      console.warn(`Sound effect ${type} not loaded yet`);
      return;
    }
    
    // Stop the previous instance if it exists
    if (effect.source) {
      effect.source.stop();
    }
    
    // Create a new audio source
    effect.source = audioContext.createBufferSource();
    effect.source.buffer = effect.buffer;
    effect.source.connect(audioContext.destination);
    effect.source.start(0);
  } catch (error) {
    console.warn(`Error playing sound effect ${type}:`, error);
  }
};

interface BackgroundMusicProps {
  musicEnabled?: boolean;
  soundEffectsEnabled?: boolean;
  initialVolume?: number;
  musicSrc?: string;
}

export default function BackgroundMusic({
  musicEnabled = true,
  soundEffectsEnabled = true,
  initialVolume = 0.3,
  musicSrc = getBackgroundMusicPath('ddlcMainTheme80s')
}: BackgroundMusicProps) {
  // Use useRef instead of useState for values we don't need to update in the UI
  const volume = useRef(initialVolume);
  const isMuted = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<{[key: string]: HTMLAudioElement}>({});
  
  // Initialize audio elements - only on client side
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create main background music element
    const bgMusic = new Audio(musicSrc);
    bgMusic.loop = true;
    bgMusic.volume = initialVolume;
    audioRef.current = bgMusic;
    
    // Create sound effect elements
    Object.entries(soundEffectsMap).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.volume = initialVolume;
      soundEffectsRef.current[key] = audio;
    });
    
    setIsLoaded(true);
    
    return () => {
      // Clean up
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Clean up sound effects
      Object.values(soundEffectsRef.current).forEach(audio => {
        audio.pause();
      });
      soundEffectsRef.current = {};
    };
  }, [musicSrc, initialVolume]);
  
  // Initialize audio context on mount
  useEffect(() => {
    // Function to handle user interaction to unlock audio
    const unlockAudio = () => {
      if (audioUnlocked) return;
      
      // Initialize audio context
      initAudioContext();
      
      // Try to play audio to unlock it
      if (audioRef.current) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio unlocked successfully');
              setAudioUnlocked(true);
            })
            .catch(error => {
              console.warn('Failed to unlock audio:', error);
            });
        }
      }
    };
    
    // Add event listeners for user interaction
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, unlockAudio, { once: true });
    });
    
    // Create silent buffer to unlock mobile audio
    const createSilentBuffer = () => {
      if (!audioContext) return;
      
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    };
    
    // Try to unlock audio on first user interaction
    const handleFirstInteraction = () => {
      createSilentBuffer();
      unlockAudio();
      
      // Remove event listeners after first interaction
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
    
    // Add event listeners for first interaction
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleFirstInteraction);
    });
    
    // Clean up
    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, unlockAudio);
        document.removeEventListener(event, handleFirstInteraction);
      });
    };
  }, [audioUnlocked]);
  
  // Handle music enabled/disabled
  useEffect(() => {
    if (!audioRef.current || !isLoaded) return;
    
    if (musicEnabled && !isMuted.current) {
      audioRef.current.play().catch(e => {
        console.warn('Auto-play was prevented:', e);
      });
    } else {
      audioRef.current.pause();
    }
  }, [musicEnabled, isMuted, isLoaded]);
  
  // Update volume when changed
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = volume.current;
    
    // Also update sound effects volume
    Object.values(soundEffectsRef.current).forEach(audio => {
      audio.volume = volume.current;
    });
  }, [volume]);
  
  // Make playSoundEffect available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { playSoundEffect: typeof playSoundEffect }).playSoundEffect = playSoundEffect;
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { playSoundEffect?: typeof playSoundEffect }).playSoundEffect;
      }
    };
  }, [soundEffectsEnabled]);
  
  return (
    <>
      <audio
        ref={audioRef}
        src={musicSrc}
        loop
        preload="auto"
        style={{ display: 'none' }}
      />
      
      {!audioUnlocked && (
        <div className="fixed bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg z-50 text-sm flex items-center space-x-2 cursor-pointer">
          <span className="text-pink-500">🔊</span>
          <span>Click to enable audio</span>
        </div>
      )}
    </>
  );
}
