"use client";

import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { 
  DDLCSoundEffect, 
  DDLCBackgroundMusic, 
  getSoundEffectPath, 
  getBackgroundMusicPath
} from '@/types/audio';
import { audioPaths } from '@/components/Common/Paths/AudioPath';

interface AudioContextType {
  // State
  isMusicEnabled: boolean;
  isSoundEffectsEnabled: boolean;
  volume: number;
  currentMusic: DDLCBackgroundMusic | null;
  
  // Actions
  playMusic: (music: DDLCBackgroundMusic) => void;
  stopMusic: () => void;
  playSoundEffect: (effect: DDLCSoundEffect) => void;
  toggleMusic: () => void;
  toggleSoundEffects: () => void;
  setVolume: (volume: number) => void;
}

const defaultContext: AudioContextType = {
  isMusicEnabled: true,
  isSoundEffectsEnabled: true,
  volume: 0.5,
  currentMusic: null,
  
  playMusic: () => {},
  stopMusic: () => {},
  playSoundEffect: () => {},
  toggleMusic: () => {},
  toggleSoundEffects: () => {},
  setVolume: () => {},
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
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
    
    // Function to handle user interaction
    const handleUserInteraction = () => {
      // Try to play a silent audio to unlock audio context
      const unlockAudio = async () => {
        try {
          console.log("User interaction detected, attempting to unlock audio...");
          // Create a silent audio context
          const silentAudio = new Audio();
          silentAudio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAUHkkIAAAAAAAEgAAABzOHuzRL/";
          silentAudio.volume = 0.01;
          await silentAudio.play();
          silentAudio.pause();
          
          // Now try to play the actual music if enabled
          if (musicRef.current && isMusicEnabled) {
            await musicRef.current.play();
          }
          
          // Mark audio as unlocked
          setAudioUnlocked(true);
          
          // Remove event listeners after successful unlock
          document.removeEventListener('click', handleUserInteraction);
          document.removeEventListener('touchstart', handleUserInteraction);
          console.log("Audio successfully unlocked");
        } catch (err) {
          console.warn('Could not unlock audio context:', err);
        }
      };
      
      unlockAudio();
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [isMusicEnabled]);
  
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
        
        // Check if file exists (simple check)
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
        
        // Play if music is enabled - wait for user interaction
        if (isMusicEnabled) {
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
  }, [currentMusic, isClient, isMusicEnabled, volume]);
  
  // Handle music enabled/disabled changes
  useEffect(() => {
    if (!isClient || !musicRef.current) return;
    
    if (isMusicEnabled) {
      musicRef.current.play().catch(err => {
        console.warn('Failed to play music:', err);
      });
    } else {
      musicRef.current.pause();
    }
  }, [isMusicEnabled, isClient]);
  
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
    
    try {
      // Get the path for this sound effect 
      const soundPath = getSoundEffectPath(effect);
      console.log(`Attempting to play sound effect: ${effect} from path: ${soundPath}`);
      
      // Create or reuse the audio element
      if (!soundEffectsRef.current[effect]) {
        const audio = new Audio();
        audio.preload = "auto";
        
        // Simple error handler - all files should be MP3 now
        audio.addEventListener('error', (e) => {
          console.warn(`Error loading sound effect ${effect} from ${soundPath}:`, e);
          
          // If loading fails, use the fallback MP3 we know exists
          audio.src = audioPaths.sfx.ddlcSelectSfx;
        });
        
        audio.src = soundPath;
        audio.volume = volume;
        soundEffectsRef.current[effect] = audio;
      }
      
      // Reset and play
      const audio = soundEffectsRef.current[effect];
      audio.pause();
      audio.currentTime = 0;
      
      // Try to play with proper error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn(`Failed to play sound effect ${effect}:`, err);
          
          // Try the fallback sound if this one fails
          if (!audio.src.includes('ddlc-select-sfx.mp3')) {
            audio.src = audioPaths.sfx.ddlcSelectSfx;
            audio.play().catch(innerErr => {
              console.error('Failed to play fallback sound:', innerErr);
            });
          }
        });
      }
    } catch (error) {
      console.error(`Sound effect error for ${effect}:`, error);
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
    
    playMusic,
    stopMusic,
    playSoundEffect,
    toggleMusic,
    toggleSoundEffects,
    setVolume,
  };
  
  return (
    <AudioContext.Provider value={contextValue}>
      {/* Render a UI hint if audio not unlocked yet */}
      {isClient && !audioUnlocked && (
        <div 
          className="fixed bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg z-50 text-sm flex items-center space-x-2 cursor-pointer border border-pink-200"
          onClick={() => {
            // Try to unlock audio on click
            if (musicRef.current && isMusicEnabled) {
              musicRef.current.play().catch(err => {
                console.warn('Could not play audio on click:', err);
              });
            }
            setAudioUnlocked(true);
          }}
        >
          <span className="text-pink-500">🔊</span>
          <span>Click to enable audio</span>
        </div>
      )}
      {children}
    </AudioContext.Provider>
  );
}; 