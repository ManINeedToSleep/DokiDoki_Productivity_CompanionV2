"use client";

import React, { createContext, useState, useEffect, useContext, useRef, ReactNode, useCallback } from 'react';
import { 
  DDLCSoundEffect, 
  DDLCBackgroundMusic, 
  getSoundEffectPath, 
  getBackgroundMusicPath
} from '@/types/audio';
import { audioPaths } from '@/components/Common/Paths/AudioPath';

// Define audio context type for the Web Audio API
let webAudioContext: AudioContext | null = null;

// Global flag to prevent race conditions with audio unlocking
let isUnlockingAudio = false;
let isAudioUnlockedGlobal = false;

// Try to create web audio context when needed
const getWebAudioContext = (): AudioContext | null => {
  if (webAudioContext) return webAudioContext;
  
  try {
    if (typeof window !== 'undefined') {
      webAudioContext = new (window.AudioContext || ((window as unknown) as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      return webAudioContext;
    }
  } catch (e) {
    console.error('Failed to create Web Audio API context:', e);
  }
  
  return null;
};

interface AudioContextType {
  // State
  isMusicEnabled: boolean;
  isSoundEffectsEnabled: boolean;
  volume: number;
  currentMusic: DDLCBackgroundMusic | null;
  isAudioUnlocked: boolean;
  
  // Actions
  playMusic: (music: DDLCBackgroundMusic) => void;
  stopMusic: () => void;
  playSoundEffect: (effect: DDLCSoundEffect) => void;
  toggleMusic: () => void;
  toggleSoundEffects: () => void;
  setVolume: (volume: number) => void;
  unlockAudio: () => Promise<boolean>;
}

const defaultContext: AudioContextType = {
  isMusicEnabled: true,
  isSoundEffectsEnabled: true,
  volume: 0.5,
  currentMusic: null,
  isAudioUnlocked: false,
  
  playMusic: () => {},
  stopMusic: () => {},
  playSoundEffect: () => {},
  toggleMusic: () => {},
  toggleSoundEffects: () => {},
  setVolume: () => {},
  unlockAudio: async () => false,
};

// Create context
export const AudioContext = createContext<AudioContextType>(defaultContext);

// Custom hook to use audio context
export const useAudio = () => useContext(AudioContext);

interface AudioProviderProps {
  children: ReactNode;
  initialMusic?: DDLCBackgroundMusic;
  initialVolume?: number;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ 
  children,
  initialMusic = 'ddlcMainTheme80s',
  initialVolume = 0.2
}) => {
  // State
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isSoundEffectsEnabled, setIsSoundEffectsEnabled] = useState(true);
  const [volume, setVolume] = useState(initialVolume);
  const [currentMusic, setCurrentMusic] = useState<DDLCBackgroundMusic | null>(initialMusic);
  const [isClient, setIsClient] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Refs for audio elements
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsRef = useRef<{[key: string]: HTMLAudioElement}>({});
  
  // Create a silent buffer to unlock mobile audio
  const createSilentBuffer = useCallback(() => {
    const ctx = getWebAudioContext();
    if (!ctx) return false;
    
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      console.log("Created silent buffer to unlock audio");
      return true;
    } catch (error) {
      console.error("Error creating silent buffer:", error);
      return false;
    }
  }, []);
  
  // Function to unlock audio via user interaction
  const unlockAudio = useCallback(async (): Promise<boolean> => {
    // Skip if already unlocked to prevent loops
    if (audioUnlocked || isAudioUnlockedGlobal) {
      console.log("Audio already unlocked, skipping unlock process");
      setAudioUnlocked(true);
      isAudioUnlockedGlobal = true;
      return true;
    }
    
    // Skip if already unlocking
    if (isUnlockingAudio) {
      console.log("Unlock process already in progress, skipping duplicate call");
      return true;
    }
    
    // Set global flag to prevent concurrent unlocking
    isUnlockingAudio = true;
    
    try {
      console.log("Attempting to unlock audio...");
      
      // Try multiple approaches to unlock audio
      let unlocked = false;
      
      // 1. Try WebAudio API approach
      unlocked = createSilentBuffer();
      
      // 2. Try HTML5 Audio with an empty audio buffer
      if (!unlocked) {
        try {
          // Simple tone generator approach
          const ctx = getWebAudioContext();
          if (ctx) {
            // Create a 100ms sine wave
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            // Set to nearly silent
            gainNode.gain.value = 0.01;
            
            // Connect and configure
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            // Use a simple sine wave at 440Hz
            oscillator.frequency.value = 440;
            
            // Start and stop after 100ms
            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.1);
            
            console.log("Created silent oscillator to unlock audio");
            unlocked = true;
          }
        } catch (oscError) {
          console.warn("Oscillator approach failed:", oscError);
        }
      }
      
      // 3. Try a data URI (empty WAV file as fallback)
      // This is a tiny valid WAV file (more widely supported than MP3)
      const emptyWavDataUri = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQQAAAA=';
      
      try {
        const wavAudio = new Audio(emptyWavDataUri);
        wavAudio.volume = 0.01;
        await wavAudio.play();
        wavAudio.pause();
        console.log("WAV data URI approach succeeded");
        unlocked = true;
      } catch (wavError) {
        console.warn("WAV data URI approach failed:", wavError);
      }
      
      // 4. Try playing a known short sound from our assets
      try {
        const shortSound = new Audio(audioPaths.sfx.select);
        shortSound.volume = 0.01;
        const soundPromise = shortSound.play();
        if (soundPromise !== undefined) {
          await soundPromise;
          shortSound.pause();
          shortSound.currentTime = 0;
          console.log("Short sound approach succeeded");
          unlocked = true;
        }
      } catch (shortSoundError) {
        console.warn("Short sound approach failed:", shortSoundError);
      }
      
      // Now try to play the actual music if enabled and something succeeded
      if (unlocked && musicRef.current && isMusicEnabled) {
        try {
          await musicRef.current.play();
        } catch (musicError) {
          console.warn("Failed to play music after unlocking:", musicError);
          // Don't set unlocked to false, since we succeeded with other methods
        }
      }
      
      // Mark audio as unlocked if any method worked
      if (unlocked) {
        setAudioUnlocked(true);
        isAudioUnlockedGlobal = true;
        console.log("Audio successfully unlocked through at least one method");
      }
      
      return unlocked;
    } catch (err) {
      console.warn('Could not unlock audio context:', err);
      return false;
    } finally {
      isUnlockingAudio = false; // Reset unlocking flag when complete
    }
  }, [audioUnlocked, isMusicEnabled, createSilentBuffer]);
  
  // Set isClient to true once component mounts
  useEffect(() => {
    // Skip if not in browser
    if (typeof window === 'undefined') return;
    
    // Set client side flag
    setIsClient(true);
    
    // Initialize from localStorage if available
    try {
      const savedSettings = localStorage.getItem('audioSettings');
      if (savedSettings) {
        const { musicEnabled, soundEffectsEnabled, volume: savedVolume } = JSON.parse(savedSettings);
        if (typeof musicEnabled === 'boolean') setIsMusicEnabled(musicEnabled);
        if (typeof soundEffectsEnabled === 'boolean') setIsSoundEffectsEnabled(soundEffectsEnabled);
        if (typeof savedVolume === 'number') setVolume(savedVolume);
      }
    } catch (e) {
      console.warn('Could not load saved audio settings:', e);
    }
    
    // Sync with global unlock state
    if (isAudioUnlockedGlobal && !audioUnlocked) {
      setAudioUnlocked(true);
    }
    
    // Skip event listener setup if already unlocked
    if (audioUnlocked || isAudioUnlockedGlobal) {
      console.log("Audio already unlocked, skipping event listener setup");
      return;
    }
    
    // Function to handle user interaction - with cleanup
    let hasHandledInteraction = false;
    
    const handleUserInteraction = () => {
      // Skip if already handled to prevent duplicate calls
      if (hasHandledInteraction) return;
      
      hasHandledInteraction = true;
      console.log("User interaction detected, attempting audio unlock");
      
      // Try to unlock audio
      unlockAudio().then(success => {
        if (success) {
          // Remove all event listeners on success
          console.log("Audio unlocked successfully, removing event listeners");
          interactionEvents.forEach(event => {
            document.removeEventListener(event, handleUserInteraction);
          });
        } else {
          // Reset flag to allow another attempt
          hasHandledInteraction = false;
        }
      });
    };
    
    // Add event listeners for user interaction
    const interactionEvents = ['click', 'touchstart', 'keydown'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });
    
    // Cleanup
    return () => {
      interactionEvents.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [audioUnlocked, unlockAudio]);
  
  // Update component state when global unlocked state changes
  useEffect(() => {
    if (isAudioUnlockedGlobal && !audioUnlocked) {
      setAudioUnlocked(true);
    }
  }, [audioUnlocked]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem('audioSettings', JSON.stringify({
          musicEnabled: isMusicEnabled,
          soundEffectsEnabled: isSoundEffectsEnabled,
          volume
        }));
      } catch (e) {
        console.warn('Could not save audio settings:', e);
      }
    }
  }, [isClient, isMusicEnabled, isSoundEffectsEnabled, volume]);
  
  // Initialize music player
  useEffect(() => {
    if (!isClient) return;
    
    try {
      // Clean up function for previous audio
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
      
      // Create and setup new audio if we have current music
      if (currentMusic) {
        const musicPath = getBackgroundMusicPath(currentMusic);
        console.log(`Attempting to load audio from: ${musicPath}`);
        
        // Create new audio element
        const audio = new Audio();
        audio.src = musicPath;
        audio.loop = true;
        audio.volume = volume;
        audio.preload = "auto"; // Ensure preloading
        
        // Add event listeners for debugging
        audio.addEventListener('error', (e) => {
          console.error(`Error loading audio file ${musicPath}:`, e);
        });
        
        audio.addEventListener('canplaythrough', () => {
          console.log(`Audio file ${musicPath} loaded successfully`);
        });
        
        musicRef.current = audio;
        
        // Play if music is enabled and audio is unlocked
        if (isMusicEnabled && (audioUnlocked || isAudioUnlockedGlobal)) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn('Failed to play music automatically (expected for autoplay policy):', err);
              // We'll rely on user interaction to start playback
            });
          }
        }
      }
    } catch (error) {
      console.warn('Error setting up music player:', error);
    }
    
    // Clean up on unmount
    return () => {
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, [currentMusic, isClient, isMusicEnabled, audioUnlocked, volume]);
  
  // Handle music enabled/disabled changes
  useEffect(() => {
    if (!isClient || !musicRef.current) return;
    
    if (isMusicEnabled && (audioUnlocked || isAudioUnlockedGlobal)) {
      musicRef.current.play().catch(err => {
        console.warn('Failed to play music:', err);
      });
    } else {
      musicRef.current.pause();
    }
  }, [isMusicEnabled, isClient, audioUnlocked]);
  
  // Handle volume changes
  useEffect(() => {
    if (!isClient || !musicRef.current) return;
    
    musicRef.current.volume = volume;
    
    // Update volume for all sound effects too
    Object.values(soundEffectsRef.current).forEach(audio => {
      audio.volume = volume;
    });
  }, [volume, isClient]);
  
  // Play a music track
  const playMusic = (music: DDLCBackgroundMusic) => {
    if (!isClient) return;
    setCurrentMusic(music);
  };
  
  // Stop the current music
  const stopMusic = () => {
    if (!isClient || !musicRef.current) return;
    
    musicRef.current.pause();
    musicRef.current.currentTime = 0;
    setCurrentMusic(null);
  };
  
  // Play a sound effect 
  const playSoundEffect = (effect: DDLCSoundEffect) => {
    if (!isClient || !isSoundEffectsEnabled) return;
    
    // Early return if audio is clearly unlocked globally or in component state
    const isUnlocked = audioUnlocked || isAudioUnlockedGlobal;
    
    try {
      // If audio isn't unlocked yet, try to unlock it once
      if (!isUnlocked && !isUnlockingAudio) {
        console.log(`Sound effect ${effect} requested while audio locked - attempting to unlock once`);
        
        // Use the global flag to track unlock attempts
        isUnlockingAudio = true;
        
        unlockAudio().then(success => {
          // Reset flag after unlock attempt
          isUnlockingAudio = false;
          
          if (success) {
            // If unlocking succeeded, try playing directly instead of recursing
            console.log(`Audio unlocked successfully, directly playing sound: ${effect}`);
            playDirectSoundEffect(effect);
          } else {
            console.warn(`Failed to unlock audio, cannot play sound effect: ${effect}`);
          }
        });
        return;
      }
      
      // Handle case where unlocking is in progress - just return without looping
      if (!isUnlocked && isUnlockingAudio) {
        console.log(`Audio unlocking in progress, deferring sound effect: ${effect}`);
        return;
      }
      
      // If we got here, audio should be unlocked - play sound directly
      playDirectSoundEffect(effect);
    } catch (error) {
      console.error(`Sound effect error for ${effect}:`, error);
      isUnlockingAudio = false; // Reset flag if an error occurred
    }
  };
  
  // Direct sound effect playback function (separated to prevent recursion)
  const playDirectSoundEffect = (effect: DDLCSoundEffect) => {
    try {
      // Get the path for this sound effect 
      const soundPath = getSoundEffectPath(effect);
      console.log(`Playing sound effect: ${effect} from path: ${soundPath}`);
      
      // Use the cached audio element if it exists
      let audio: HTMLAudioElement;
      
      // Create or reuse the audio element
      if (!soundEffectsRef.current[effect]) {
        const newAudio = new Audio();
        newAudio.volume = volume;
        newAudio.src = soundPath;
        
        // Setup error handling as direct listener instead of complex chaining
        newAudio.onerror = () => {
          console.warn(`Error loading sound effect ${effect}, trying fallback`);
          
          // Just use a known working sound as fallback
          const fallbackAudio = new Audio(audioPaths.sfx.ddlcSelectSfx);
          fallbackAudio.volume = volume;
          fallbackAudio.play().catch(() => {
            console.error(`Fallback sound also failed for ${effect}`);
          });
        };
        
        soundEffectsRef.current[effect] = newAudio;
        audio = newAudio;
      } else {
        // Use cached audio
        audio = soundEffectsRef.current[effect];
      }
      
      // Create a clone to allow overlapping sounds
      const clonedAudio = audio.cloneNode() as HTMLAudioElement;
      clonedAudio.volume = volume;
      clonedAudio.play().catch(err => {
        console.warn(`Failed to play sound effect ${effect}:`, err);
      });
    } catch (error) {
      console.error(`Error playing direct sound effect for ${effect}:`, error);
    }
  };
  
  // Toggle music on/off
  const toggleMusic = () => {
    setIsMusicEnabled(prev => !prev);
  };
  
  // Toggle sound effects on/off
  const toggleSoundEffects = () => {
    setIsSoundEffectsEnabled(prev => !prev);
  };
  
  // Context value
  const contextValue: AudioContextType = {
    isMusicEnabled,
    isSoundEffectsEnabled,
    volume,
    currentMusic,
    isAudioUnlocked: audioUnlocked || isAudioUnlockedGlobal,
    
    playMusic,
    stopMusic,
    playSoundEffect,
    toggleMusic,
    toggleSoundEffects,
    setVolume,
    unlockAudio,
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
}; 