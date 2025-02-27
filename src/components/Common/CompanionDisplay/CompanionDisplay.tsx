"use client";

import { motion } from 'framer-motion';
import { imagePaths } from '@/components/Common/Paths/ImagePath';

interface CompanionDisplayProps {
  characterId: string | null;
  position?: 'left' | 'right';
}

export default function CompanionDisplay({ 
  characterId,
}: CompanionDisplayProps) {
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
      <motion.img
        src={spritePath}
        alt={`${capitalizedName} sprite`}
        className="max-h-[90vh] h-auto w-auto max-w-full object-contain"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}
