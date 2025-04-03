"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAudio } from '@/lib/contexts/AudioContext';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { UserDocument } from '@/lib/firebase/user';
import SettingsSection from './SettingsSection';
import SettingsRow from './SettingsRow';
import Button from '@/components/Common/Button/Button';
import { FaVolumeUp, FaVolumeMute, FaVolumeDown, FaVolumeOff, FaMusic } from 'react-icons/fa';
import { DDLCSoundEffect } from '@/types/audio';
import { useUserStore } from '@/lib/stores/userStore';

interface AudioSettingsProps {
  userData: UserDocument;
  companionId: CompanionId;
}

export default function AudioSettings({ userData, companionId }: AudioSettingsProps) {
  const { 
    isMusicEnabled, 
    isSoundEffectsEnabled, 
    volume, 
    playSoundEffect,
    toggleMusic, 
    toggleSoundEffects, 
    setVolume
  } = useAudio();

  const colors = getCharacterColors(companionId);
  const [localVolume, setLocalVolume] = useState(volume);

  const { updateAudioSettings } = useUserStore();

  useEffect(() => {
    // Initialize local volume state from global volume
    setLocalVolume(volume);
  }, [volume]);

  // Update user settings when audio settings change
  useEffect(() => {
    if (userData) {
      // Use the userStore to manage state and sync with Firebase 
      updateAudioSettings(userData.base.uid, {
        musicEnabled: isMusicEnabled,
        soundEffectsEnabled: isSoundEffectsEnabled,
        volume: volume
      });
    }
  }, [isMusicEnabled, isSoundEffectsEnabled, volume, userData, updateAudioSettings]);

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setLocalVolume(newVolume);
    // Update volume in real time while dragging
    setVolume(newVolume);
  };

  // Apply volume change when slider is released
  const handleVolumeChangeComplete = () => {
    playSoundEffect('select');
  };

  // Play a sound effect for testing
  const testSoundEffect = (effect: DDLCSoundEffect) => {
    playSoundEffect(effect);
  };

  return (
    <SettingsSection 
      title="Audio Settings"
      companionId={companionId}
      icon={<FaMusic size={20} style={{ color: colors.primary }} />}
    >
      <SettingsRow
        title="Background Music"
        description="Toggle background music on/off"
        companionId={companionId}
      >
        <motion.button
          onClick={toggleMusic}
          className={`p-3 rounded-full shadow-sm transition-all`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            backgroundColor: isMusicEnabled 
              ? `${colors.primary}30` 
              : 'rgba(0,0,0,0.05)',
            color: colors.primary,
            border: `2px solid ${colors.primary}${isMusicEnabled ? '70' : '40'}`
          }}
        >
          {isMusicEnabled ? <FaVolumeUp size={20} /> : <FaVolumeOff size={20} />}
        </motion.button>
      </SettingsRow>

      <SettingsRow
        title="Sound Effects"
        description="Toggle sound effects on/off"
        companionId={companionId}
      >
        <motion.button
          onClick={toggleSoundEffects}
          className={`p-3 rounded-full shadow-sm transition-all`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ 
            backgroundColor: isSoundEffectsEnabled 
              ? `${colors.primary}30` 
              : 'rgba(0,0,0,0.05)',
            color: colors.primary,
            border: `2px solid ${colors.primary}${isSoundEffectsEnabled ? '70' : '40'}`
          }}
        >
          {isSoundEffectsEnabled ? <FaVolumeDown size={20} /> : <FaVolumeMute size={20} />}
        </motion.button>
      </SettingsRow>

      <SettingsRow
        title="Volume"
        description="Adjust the volume of all audio"
        companionId={companionId}
      >
        <div className="flex items-center w-full max-w-sm gap-3">
          <FaVolumeOff size={16} style={{ color: colors.primary }} />

          <div className="w-full relative flex items-center">
            {/* Use a native range input for the functionality */}
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={localVolume}
              onChange={handleVolumeChange}
              onMouseUp={handleVolumeChangeComplete}
              onTouchEnd={handleVolumeChangeComplete}
              className="w-full h-8 appearance-none bg-transparent"
              style={{
                accentColor: colors.primary
              }}
            />
            
            {/* Overlay the bubble at the calculated position */}
            <div 
              className="absolute pointer-events-none"
              style={{
                left: `calc(${localVolume * 100}% - 15px)`,
                transform: "translateY(-50%)",
                top: "50%"
              }}
            >
              <motion.div 
                className="w-10 h-10 rounded-full shadow-md flex items-center justify-center"
                style={{ 
                  backgroundColor: 'white',
                  border: `3px solid ${colors.primary}`
                }}
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [`0 0 5px ${colors.primary}60`, `0 0 12px ${colors.primary}70`, `0 0 5px ${colors.primary}60`]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatType: 'reverse' 
                }}
              >
                <span 
                  className="text-sm font-bold"
                  style={{ color: colors.primary }}
                >
                  {Math.round(localVolume * 100)}
                </span>
              </motion.div>
            </div>
          </div>
          
          <FaVolumeUp size={16} style={{ color: colors.primary }} />
        </div>
      </SettingsRow>

      <SettingsRow
        title="Test Sound Effects"
        description="Click buttons to test different sound effects"
        companionId={companionId}
      >
        <div className="flex flex-wrap gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              label="Click" 
              onClick={() => testSoundEffect('select')}
              companionId={companionId}
              className="shadow-md"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              label="Hover"
              onClick={() => testSoundEffect('hover')}
              companionId={companionId}
              className="shadow-md"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              label="Notification"
              onClick={() => testSoundEffect('notif')}
              companionId={companionId}
              className="shadow-md"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              label="Glitch"
              onClick={() => testSoundEffect('glitch1')}
              companionId={companionId}
              className="shadow-md"
            />
          </motion.div>
        </div>
      </SettingsRow>

    </SettingsSection>
  );
} 