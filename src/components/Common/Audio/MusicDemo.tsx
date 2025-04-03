"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaVolumeUp, FaPlay, FaPause, FaStepForward } from 'react-icons/fa';
import { useAudio } from '@/lib/contexts/AudioContext';
import { DDLCBackgroundMusic } from '@/types/audio';
import AudioControls from './AudioControls';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface MusicDemoProps {
  characterId?: CompanionId;
  showVolumeControl?: boolean;
}

// Track information for the player
const musicTracks: {
  id: DDLCBackgroundMusic;
  title: string;
  artist: string;
  duration: string;
  character: CompanionId;
}[] = [
  {
    id: 'ddlcMainTheme80s',
    title: 'DDLC Main Theme (80s Ver.)',
    artist: 'Team Salvato',
    duration: '3:22',
    character: 'sayori'
  },
  {
    id: 'monikasLullaby',
    title: "Monika's Lullaby",
    artist: 'Team Salvato',
    duration: '2:45',
    character: 'monika'
  },
  {
    id: 'runereality',
    title: 'Runereality',
    artist: 'Team Salvato',
    duration: '3:04',
    character: 'yuri'
  }
];

export default function MusicDemo({ 
  characterId = 'sayori',
  showVolumeControl = true 
}: MusicDemoProps) {
  const { 
    isMusicEnabled, 
    currentMusic, 
    playMusic, 
    toggleMusic,
    playSoundEffect
  } = useAudio();
  
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const colors = getCharacterColors(characterId);
  
  // Initialize with the first track
  useEffect(() => {
    if (!currentMusic) {
      playMusic(musicTracks[0].id);
    }
  }, [currentMusic, playMusic]);
  
  // Update active track index when music changes
  useEffect(() => {
    if (currentMusic) {
      const index = musicTracks.findIndex(track => track.id === currentMusic);
      if (index !== -1) {
        setActiveTrackIndex(index);
      }
    }
  }, [currentMusic]);
  
  const handlePlayPause = () => {
    playSoundEffect('select');
    toggleMusic();
  };
  
  const handleNextTrack = () => {
    playSoundEffect('select');
    const nextIndex = (activeTrackIndex + 1) % musicTracks.length;
    playMusic(musicTracks[nextIndex].id);
  };
  
  const activeTrack = musicTracks[activeTrackIndex];
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md"
      style={{ borderTop: `3px solid ${colors.primary}` }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-[Riffic]" style={{ color: colors.primary }}>
          Music Player
        </h3>
        
        {showVolumeControl && (
          <AudioControls characterId={characterId} isMinimal={true} />
        )}
      </div>
      
      <div className="flex items-center space-x-3 mb-3">
        {/* Album art / Character icon */}
        <div 
          className="w-12 h-12 rounded-md flex items-center justify-center text-white text-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <FaVolumeUp />
        </div>
        
        {/* Track info */}
        <div className="flex-1">
          <div className="font-medium truncate" style={{ color: colors.text }}>
            {activeTrack.title}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {activeTrack.artist}
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-1 rounded-full mb-3 overflow-hidden">
        <motion.div 
          className="h-full"
          style={{ backgroundColor: colors.primary }}
          initial={{ width: '0%' }}
          animate={{ width: isMusicEnabled ? '100%' : '0%' }}
          transition={{ 
            duration: 180, 
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center space-x-4">
        <motion.button
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: colors.primary,
            color: 'white' 
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          onMouseEnter={() => playSoundEffect('hover')}
        >
          {isMusicEnabled ? <FaPause /> : <FaPlay />}
        </motion.button>
        
        <motion.button
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: 'white',
            color: colors.primary,
            border: `1px solid ${colors.primary}`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNextTrack}
          onMouseEnter={() => playSoundEffect('hover')}
        >
          <FaStepForward />
        </motion.button>
      </div>
    </div>
  );
} 