"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { imagePaths } from '@/components/Common/Paths/ImagePath';

interface CompanionDisplayProps {
  characterId: string | null;
}

export default function CompanionDisplay({ characterId }: CompanionDisplayProps) {
  if (!characterId) return null;

  const getCharacterSprite = (id: string) => {
    switch (id) {
      case 'sayori':
        return imagePaths.characterSprites.sayori;
      case 'yuri':
        return imagePaths.characterSprites.yuri;
      case 'natsuki':
        return imagePaths.characterSprites.natsuki;
      case 'monika':
        return imagePaths.characterSprites.monika;
      default:
        return '';
    }
  };

  const spritePath = getCharacterSprite(characterId);
  const capitalizedName = characterId.charAt(0).toUpperCase() + characterId.slice(1);

  return (
    <div className="absolute bottom-0 left-1/4 w-1/4 h-full flex items-end justify-center">
      <AnimatePresence mode="wait">
        <motion.img
          key={characterId}
          src={spritePath}
          alt={`${capitalizedName} sprite`}
          className="max-h-[90vh] h-auto w-auto max-w-full object-contain"
          initial={{ opacity: 0, x: -50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 20,
            duration: 0.5 
          }}
        />
      </AnimatePresence>
    </div>
  );
}
