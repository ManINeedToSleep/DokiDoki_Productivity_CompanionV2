"use client";

import { useState, useEffect } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { audioPaths } from '@/components/Common/Paths/AudioPath';
import Button from '@/components/Common/Button/Button';

export default function AudioTest() {
  const { isSoundEffectsEnabled, isMusicEnabled, toggleMusic, toggleSoundEffects } = useAudio();
  const [audioContextStatus, setAudioContextStatus] = useState<string>('Unknown');
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  
  // Check audio format support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if AudioContext exists
      const hasAudioContext = !!(window.AudioContext || 
        ((window as unknown) as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      setAudioContextStatus(hasAudioContext ? 'Available' : 'Not available');
      
      // Check audio format support
      const audio = document.createElement('audio');
      const formats = [];
      
      if (audio.canPlayType('audio/mp3').replace('no', '')) {
        formats.push('MP3');
      }
      
      if (audio.canPlayType('audio/ogg; codecs="vorbis"').replace('no', '')) {
        formats.push('OGG');
      }
      
      if (audio.canPlayType('audio/wav').replace('no', '')) {
        formats.push('WAV');
      }
      
      setAvailableFormats(formats);
    }
  }, []);
  
  // Test playing a specific sound
  const testSound = (path: string, name: string) => {
    try {
      console.log(`Testing sound: ${name} from path: ${path}`);
      const audio = new Audio(path);
      
      // Add error listener
      audio.onerror = (e) => {
        console.error(`Error playing sound ${name}:`, e);
        // Try OGG fallback
        const oggPath = path.replace('.mp3', '.ogg');
        console.log(`Trying OGG fallback: ${oggPath}`);
        
        const oggAudio = new Audio(oggPath);
        oggAudio.onerror = (fallbackErr) => {
          console.error(`OGG fallback also failed for ${name}:`, fallbackErr);
        };
        
        oggAudio.oncanplaythrough = () => {
          console.log(`OGG fallback for ${name} loaded successfully, playing...`);
          oggAudio.play().catch(err => console.error(`Failed to play OGG fallback:`, err));
        };
      };
      
      // Play when ready
      audio.oncanplaythrough = () => {
        console.log(`Sound ${name} loaded successfully, playing...`);
        audio.play().catch(err => console.error(`Failed to play sound:`, err));
      };
      
      audio.volume = 0.5;
      audio.src = path;
    } catch (error) {
      console.error(`Test sound error:`, error);
    }
  };
  
  return (
    <div className="p-4 bg-white/90 rounded-lg shadow-md">
      <h2 className="text-lg font-bold mb-4">Audio System Test</h2>
      
      <div className="mb-4">
        <p className="text-sm mb-1"><strong>AudioContext:</strong> {audioContextStatus}</p>
        <p className="text-sm mb-1"><strong>Supported formats:</strong> {availableFormats.join(', ') || 'None detected'}</p>
        <p className="text-sm mb-3">
          <strong>Music:</strong> {isMusicEnabled ? 'Enabled' : 'Disabled'} | 
          <strong> Sound FX:</strong> {isSoundEffectsEnabled ? 'Enabled' : 'Disabled'}
        </p>
        
        <div className="flex gap-2 mb-4">
          <button 
            onClick={toggleMusic}
            className="px-2 py-1 text-sm bg-pink-100 hover:bg-pink-200 text-pink-800 rounded"
          >
            {isMusicEnabled ? 'Disable Music' : 'Enable Music'}
          </button>
          
          <button 
            onClick={toggleSoundEffects}
            className="px-2 py-1 text-sm bg-purple-100 hover:bg-purple-200 text-purple-800 rounded"
          >
            {isSoundEffectsEnabled ? 'Disable Sound FX' : 'Enable Sound FX'}
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Button with Sound Effects</h3>
        <div className="flex gap-2">
          <Button 
            label="Click Sound" 
            onClick={() => console.log("Button clicked!")}
            companionId="sayori"
          />
          <Button 
            label="Hover Over Me" 
            onClick={() => {}}
            companionId="natsuki"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-md font-semibold mb-2">Test Individual Sounds</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(audioPaths.sfx).map(([key, path]) => (
            <button 
              key={key}
              onClick={() => testSound(path, key)}
              className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-left truncate"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 