"use client";

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Store the original onCharacterSelect function in a ref
  const onCharacterSelectRef = useRef(onCharacterSelect);
  
  // Get theme colors based on active character
  const themeColors = getCharacterColors(activeCharacter);
  
  // Define the theme change handler outside useEffect
  const handleThemeChange = useCallback((characterId: string | null) => {
    if (characterId && ['sayori', 'natsuki', 'yuri', 'monika'].includes(characterId)) {
      setActiveCharacter(characterId as CompanionId);
    }
  }, []);
  
  // Create a wrapped character select function that also updates theme
  const wrappedOnCharacterSelect = useCallback((characterId: string | null) => {
    handleThemeChange(characterId);
    onCharacterSelectRef.current(characterId);
  }, [handleThemeChange]);
  
  // Update the theme colors based on character selection
  useEffect(() => {
    // Update ref when onCharacterSelect prop changes
    onCharacterSelectRef.current = onCharacterSelect;
  }, [onCharacterSelect]);
  
  const renderContent = () => {
    switch (selectedItem) {
      case 'new-game':
        return <NewGame onCharacterSelect={wrappedOnCharacterSelect} />;
      case 'load-game':
        return <LoadGame />;
      case 'options':
        return <Options onCharacterSelect={(id) => {
          if (id) {
            handleThemeChange(id);
            onCharacterSelectRef.current(id);
          }
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
      style={{ 
        // Use theme colors in the component styling
        backgroundColor: `${themeColors.primary}05`
      }}
    >
      {renderContent()}
    </motion.div>
  );
} 