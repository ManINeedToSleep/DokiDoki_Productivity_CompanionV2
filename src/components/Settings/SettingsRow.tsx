"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface SettingsRowProps {
  title: string;
  description?: string;
  children: ReactNode;
  companionId?: CompanionId;
}

export default function SettingsRow({
  title,
  description,
  children,
  companionId = 'sayori'
}: SettingsRowProps) {
  const colors = companionId ? getCharacterColors(companionId) : { text: '#333', primary: '#FFB6C1' };

  return (
    <motion.div 
      className="flex items-center justify-between py-4 border-b last:border-b-0"
      style={{ borderColor: `${colors.primary}30` }}
      whileHover={{ 
        backgroundColor: `${colors.primary}10`,
        borderRadius: "12px",
        paddingLeft: "12px",
        paddingRight: "12px",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex-1 pr-4">
        <h3 
          className="text-base font-[Halogen]"
          style={{ color: colors.text }}
        >
          {title}
        </h3>
        {description && (
          <p 
            className="text-xs mt-1 font-[Halogen]"
            style={{ color: `${colors.text}99` }}
          >
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </motion.div>
  );
} 