"use client";

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  companionId?: CompanionId;
  icon?: ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
  companionId = 'sayori',
  icon
}: SettingsSectionProps) {
  const colors = getCharacterColors(companionId);
  
  return (
    <motion.div
      className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div 
        className="px-6 py-4 border-b"
        style={{ borderColor: `${colors.primary}40` }} // 40 = 25% opacity
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div 
              className="p-2 rounded-full"
              style={{ backgroundColor: `${colors.primary}20` }} // 20 = 12% opacity
            >
              {icon}
            </div>
          )}
          <div>
            <h2 
              className="text-lg font-[Riffic]"
              style={{ color: colors.heading }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm text-gray-500 font-[Halogen] mt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
} 