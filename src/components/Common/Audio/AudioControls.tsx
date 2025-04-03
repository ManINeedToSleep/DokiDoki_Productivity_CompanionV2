"use client";

import { useState } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
import { FaVolumeUp, FaVolumeDown, FaVolumeMute, FaMusic } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { CompanionId } from '@/lib/firebase/companion';

interface AudioControlsProps {
  characterId?: CompanionId;
  showLabels?: boolean;
  isMinimal?: boolean;
  className?: string;
}

export default function AudioControls({
  characterId = 'sayori',
  showLabels = false,
  isMinimal = false,
  className = ''
}: AudioControlsProps) {
  const {
    isMusicEnabled,
    isSoundEffectsEnabled,
    volume,
    toggleMusic,
    toggleSoundEffects,
    setVolume,
    playSoundEffect
  } = useAudio();
  
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  
  // Get character colors for styling
  const colors = getCharacterColors(characterId);
  
  // Handle volume icon click - toggle volume slider visibility
  const handleVolumeIconClick = () => {
    setIsVolumeVisible(!isVolumeVisible);
    playSoundEffect('hover');
  };
  
  // Handle music toggle
  const handleMusicToggle = () => {
    toggleMusic();
    playSoundEffect('select');
  };
  
  // Handle sound effects toggle
  const handleSoundToggle = () => {
    toggleSoundEffects();
    playSoundEffect('select');
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  // Get the appropriate volume icon based on current volume
  const getVolumeIcon = () => {
    if (!isSoundEffectsEnabled) return <FaVolumeMute />;
    if (volume === 0) return <FaVolumeMute />;
    if (volume < 0.5) return <FaVolumeDown />;
    return <FaVolumeUp />;
  };
  
  // If minimal mode, show just the basic controls
  if (isMinimal) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <button
          className="p-2 rounded-full hover:opacity-80 transition-opacity"
          style={{ color: colors.primary }}
          onClick={handleMusicToggle}
          title={isMusicEnabled ? "Disable Music" : "Enable Music"}
        >
          <FaMusic className={isMusicEnabled ? "" : "opacity-50"} />
        </button>
        
        <button
          className="p-2 rounded-full hover:opacity-80 transition-opacity"
          style={{ color: colors.primary }}
          onClick={handleSoundToggle}
          title={isSoundEffectsEnabled ? "Disable Sound Effects" : "Enable Sound Effects"}
        >
          {getVolumeIcon()}
        </button>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Music toggle button */}
      <div className="flex flex-col items-center">
        <motion.button
          className="p-2 bg-white/70 rounded-full shadow-sm hover:shadow-md transition-all"
          style={{ color: colors.primary }}
          onClick={handleMusicToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaMusic className={isMusicEnabled ? "" : "opacity-50"} />
        </motion.button>
        {showLabels && (
          <span className="text-xs mt-1" style={{ color: colors.text }}>
            Music: {isMusicEnabled ? "On" : "Off"}
          </span>
        )}
      </div>
      
      {/* Volume control */}
      <div className="flex flex-col items-center relative">
        <motion.button
          className="p-2 bg-white/70 rounded-full shadow-sm hover:shadow-md transition-all"
          style={{ color: colors.primary }}
          onClick={handleVolumeIconClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {getVolumeIcon()}
        </motion.button>
        
        {showLabels && (
          <span className="text-xs mt-1" style={{ color: colors.text }}>
            Volume
          </span>
        )}
        
        {/* Volume slider - conditionally displayed */}
        {isVolumeVisible && (
          <motion.div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-white/90 shadow-lg rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-pink-500"
              style={{ accentColor: colors.primary }}
            />
          </motion.div>
        )}
      </div>
      
      {/* Sound effects toggle button */}
      <div className="flex flex-col items-center">
        <motion.button
          className="p-2 bg-white/70 rounded-full shadow-sm hover:shadow-md transition-all"
          style={{ color: colors.primary }}
          onClick={handleSoundToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSoundEffectsEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
        </motion.button>
        {showLabels && (
          <span className="text-xs mt-1" style={{ color: colors.text }}>
            Sound: {isSoundEffectsEnabled ? "On" : "Off"}
          </span>
        )}
      </div>
    </div>
  );
} 