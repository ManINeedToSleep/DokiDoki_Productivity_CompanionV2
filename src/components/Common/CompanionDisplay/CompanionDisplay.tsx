"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { imagePaths } from '@/components/Common/Paths/ImagePath';
import { usePathname } from 'next/navigation';

interface CompanionDisplayProps {
  characterId: string | null;
  mode?: 'landing' | 'dashboard';
}

export default function CompanionDisplay({ characterId, mode }: CompanionDisplayProps) {
  const pathname = usePathname();
  const isDashboard = mode === 'dashboard' || pathname.includes('/dashboard');

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
    <div className={isDashboard 
      ? "absolute inset-0 flex items-end justify-center"
      : "absolute bottom-0 left-1/4 w-1/4 h-full flex items-end justify-center"
    }>
      <AnimatePresence mode="wait">
        <motion.img
          key={characterId}
          src={spritePath}
          alt={`${capitalizedName} sprite`}
          className={isDashboard 
            ? "h-full w-auto object-contain"
            : "max-h-[90vh] h-auto w-auto max-w-full object-contain"
          }
          initial={isDashboard 
            ? { opacity: 0, scale: 0.8 }
            : { opacity: 0, x: -50, scale: 0.95 }
          }
          animate={isDashboard
            ? { opacity: 1, scale: 1 }
            : { opacity: 1, x: 0, scale: 1 }
          }
          exit={isDashboard
            ? { opacity: 0, scale: 0.8 }
            : { opacity: 0, x: 50, scale: 0.95 }
          }
          transition={isDashboard
            ? { duration: 0.3 }
            : { 
                type: "spring",
                stiffness: 200,
                damping: 20,
                duration: 0.5 
              }
          }
        />
      </AnimatePresence>
    </div>
  );
}
