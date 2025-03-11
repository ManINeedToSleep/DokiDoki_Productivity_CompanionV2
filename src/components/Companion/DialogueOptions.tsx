"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';

export interface DialogueOption {
  id: string;
  text: string;
  responseId?: string;
  affinity?: number; // Affinity change when selected
  effect?: 'positive' | 'negative' | 'neutral';
}

interface DialogueOptionsProps {
  options: DialogueOption[];
  companionId: CompanionId;
  onSelectOption: (option: DialogueOption) => void;
  isVisible?: boolean;
}

const DialogueOptions: React.FC<DialogueOptionsProps> = ({
  options,
  companionId,
  onSelectOption,
  isVisible = true
}) => {
  const colors = getCharacterColors(companionId);
  
  if (!isVisible || options.length === 0) return null;
  
  // Container animation for the entire options list
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };
  
  // Animation for individual options
  const optionVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
    hover: { scale: 1.02, x: 5 }
  };
  
  return (
    <motion.div
      className="w-full max-w-2xl mx-auto px-4 py-2 mb-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-2">
        {options.map((option) => (
          <motion.button
            key={option.id}
            className={`text-left p-3 rounded-lg backdrop-blur-sm border border-white/30 
                       shadow-md hover:shadow-lg transition-all ${
                         option.effect === 'positive' ? 'hover:border-green-400/60' :
                         option.effect === 'negative' ? 'hover:border-red-400/60' :
                         `hover:border-${colors.primary}/60`
                       }`}
            style={{ 
              backgroundColor: `rgba(255, 255, 255, 0.7)`,
              borderLeft: `4px solid ${
                option.effect === 'positive' ? '#4ade80' :
                option.effect === 'negative' ? '#f87171' :
                colors.primary
              }`
            }}
            variants={optionVariants}
            whileHover="hover"
            onClick={() => onSelectOption(option)}
          >
            <p className="text-gray-800 font-medium">
              {option.text}
            </p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default DialogueOptions; 