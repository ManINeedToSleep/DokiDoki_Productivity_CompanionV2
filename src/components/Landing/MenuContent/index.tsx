"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

const NewGame = dynamic(() => import('./NewGame'));
const LoadGame = dynamic(() => import('./LoadGame'));
const Options = dynamic(() => import('./Options'));
const Help = dynamic(() => import('./Help'));
const Extra = dynamic(() => import('./Extra'));
const About = dynamic(() => import('./About'));

interface MenuContentProps {
  selectedItem: string;
  onCharacterSelect: (characterId: string | null) => void;
}

export default function MenuContent({ selectedItem, onCharacterSelect }: MenuContentProps) {
  const [activeCharacter, setActiveCharacter] = useState<CompanionId>('sayori');
  const themeColors = getCharacterColors(activeCharacter);
  
  // Update the theme colors based on character selection
  useEffect(() => {
    const handleThemeChange = (characterId: string | null) => {
      if (characterId && ['sayori', 'natsuki', 'yuri', 'monika'].includes(characterId)) {
        setActiveCharacter(characterId as CompanionId);
      }
    };
    
    // Add an event listener for character selection
    const origOnCharacterSelect = onCharacterSelect;
    onCharacterSelect = (characterId) => {
      handleThemeChange(characterId);
      origOnCharacterSelect(characterId);
    };
    
    return () => {
      // Clean up
      onCharacterSelect = origOnCharacterSelect;
    };
  }, [onCharacterSelect]);
  
  const renderContent = () => {
    switch (selectedItem) {
      case 'new-game':
        return <NewGame onCharacterSelect={onCharacterSelect} />;
      case 'load-game':
        return <LoadGame />;
      case 'options':
        return <Options onCharacterSelect={(id) => {
          if (id) setActiveCharacter(id as CompanionId);
        }} />;
      case 'help':
        return <Help />;
      case 'extra':
        return <Extra />;
      case 'about':
        return <About />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="relative z-20 w-full max-w-3xl mx-auto mt-12 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {renderContent()}
    </motion.div>
  );
} 