"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CompanionId } from '@/lib/firebase/companion';

interface ToggleProps {
  isOn: boolean;
  onToggle: (isOn: boolean) => void;
  disabled?: boolean;
  label?: string;
  companionId?: CompanionId;
  size?: 'sm' | 'md' | 'lg';
}

export default function Toggle({
  isOn,
  onToggle,
  disabled = false,
  label,
  companionId = 'sayori',
  size = 'md'
}: ToggleProps) {
  const [isChecked, setIsChecked] = useState(isOn);
  
  // Update internal state when prop changes
  useEffect(() => {
    setIsChecked(isOn);
  }, [isOn]);
  
  const handleToggle = () => {
    if (disabled) return;
    
    const newValue = !isChecked;
    setIsChecked(newValue);
    onToggle(newValue);
  };
  
  // Get character-specific colors
  const getCharacterColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          bg: '#FFEEF3', 
          active: '#FFB6C1',
          track: '#FFE6EB',
          hover: '#FFCCD5'
        };
      case 'natsuki':
        return { 
          bg: '#FFF0F0', 
          active: '#FF8DA1',
          track: '#FFE8E8',
          hover: '#FFCCD0'
        };
      case 'yuri':
        return { 
          bg: '#F0F0FF', 
          active: '#A49EFF',
          track: '#E8E8FF',
          hover: '#D1D0FF'
        };
      case 'monika':
        return { 
          bg: '#F0FFF5', 
          active: '#85CD9E',
          track: '#E8FFE8',
          hover: '#C5E8D1'
        };
      default:
        return { 
          bg: '#FFEEF3', 
          active: '#FFB6C1',
          track: '#FFE6EB',
          hover: '#FFCCD5'
        };
    }
  };
  
  // Get size dimensions
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          width: 36,
          height: 20,
          circle: 16,
          translate: 16
        };
      case 'lg':
        return {
          width: 60,
          height: 32,
          circle: 28,
          translate: 28
        };
      case 'md':
      default:
        return {
          width: 48,
          height: 24,
          circle: 20,
          translate: 24
        };
    }
  };
  
  const colors = getCharacterColors(companionId);
  const sizeStyles = getSizeStyles();
  
  return (
    <div className="flex items-center">
      {label && (
        <label className="mr-3 cursor-pointer font-[Halogen] text-gray-700" onClick={handleToggle}>
          {label}
        </label>
      )}
      
      <div 
        className={`
          relative rounded-full cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
        `}
        onClick={handleToggle}
        style={{ 
          width: sizeStyles.width,
          height: sizeStyles.height,
          backgroundColor: isChecked ? colors.active : colors.track
        }}
      >
        <motion.div
          className="absolute rounded-full shadow-sm"
          style={{
            width: sizeStyles.circle,
            height: sizeStyles.circle,
            top: (sizeStyles.height - sizeStyles.circle) / 2,
            backgroundColor: 'white'
          }}
          initial={false}
          animate={{ 
            left: isChecked 
              ? sizeStyles.width - sizeStyles.circle - ((sizeStyles.height - sizeStyles.circle) / 2) 
              : (sizeStyles.height - sizeStyles.circle) / 2
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );
} 