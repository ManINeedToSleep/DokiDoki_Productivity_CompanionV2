'use client';

import { useEffect } from 'react';
import { AudioPreloader } from '@/components/Common/Music';
import { useAudio } from '@/lib/contexts/AudioContext';

/**
 * AudioWrapper is a client component that handles audio initialization
 * and preloading. It wraps the AudioPreloader component to ensure
 * that audio functionality is only initialized on the client side.
 */
export default function AudioWrapper() {
  const { unlockAudio, isAudioUnlocked } = useAudio();

  // One-time setup effect to handle first user interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Skip if audio is already unlocked
    if (isAudioUnlocked) {
      console.log("AudioWrapper: Audio already unlocked, skipping setup");
      return;
    }
    
    // Just set up one event listener with { once: true } to handle the first interaction
    const handleFirstInteraction = async () => {
      console.log("AudioWrapper: First user interaction detected");
      await unlockAudio();
    };
    
    // Use { once: true } to automatically remove the listener after first trigger
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [unlockAudio, isAudioUnlocked]);

  return <AudioPreloader />;
} 