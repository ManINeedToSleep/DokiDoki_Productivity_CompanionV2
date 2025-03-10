"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '../CharacterColor/CharacterColor';

interface StatsCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  companionId?: CompanionId;
  noPadding?: boolean;
  variant?: 'default' | 'bordered' | 'subtle';
  maxHeight?: string;
}

export default function StatsCard({ 
  children, 
  className = '', 
  title, 
  companionId = 'sayori', 
  noPadding = false,
  variant = 'default',
  maxHeight
}: StatsCardProps) {
  const colors = getCharacterColors(companionId);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'bordered':
        return `border-4 border-${colors.primary} bg-white/90`;
      case 'subtle':
        return `border border-${colors.secondary} bg-white/80`;
      default:
        return `border-2 border-${colors.secondary} bg-white/90`;
    }
  };
  
  return (
    <motion.div 
      className={`
        backdrop-blur-sm 
        rounded-lg 
        ${noPadding ? '' : 'p-5'}
        shadow-md 
        ${getVariantStyles()}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxHeight: maxHeight }}
    >
      {title && (
        <h3 
          className="text-lg font-[Riffic] mb-3 px-1"
          style={{ color: colors.heading }}
        >
          {title}
        </h3>
      )}
      {children}
    </motion.div>
  );
} 