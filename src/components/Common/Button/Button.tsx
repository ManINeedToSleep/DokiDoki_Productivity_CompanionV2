"use client";

import { CSSProperties } from 'react';
import { CompanionId } from '@/lib/firebase/companion';

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: CSSProperties;
  companionId?: CompanionId;
}

export default function Button({ 
  label, 
  onClick, 
  disabled = false, 
  className = '',
  type = 'button',
  style,
  companionId = 'sayori'
}: ButtonProps) {
  // Get character-specific colors
  const getCharacterColors = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return { 
          bg: '#FFEEF3', 
          border: '#FFB6C1', 
          hoverBg: '#FFCCDD',
          text: '#D76C95'
        };
      case 'natsuki':
        return { 
          bg: '#FFF0F0', 
          border: '#FF8DA1', 
          hoverBg: '#FFCCD5',
          text: '#D14D61'
        };
      case 'yuri':
        return { 
          bg: '#F0F0FF', 
          border: '#A49EFF', 
          hoverBg: '#D5D1FF',
          text: '#6A61E0'
        };
      case 'monika':
        return { 
          bg: '#F0FFF5', 
          border: '#85CD9E', 
          hoverBg: '#C5E8D1',
          text: '#4A9B68'
        };
      default:
        return { 
          bg: '#FFEEF3', 
          border: '#FFB6C1', 
          hoverBg: '#FFCCDD',
          text: '#D76C95'
        };
    }
  };

  const colors = getCharacterColors(companionId);

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        ...style
      }}
      className={`
        px-4 py-2 
        rounded-lg 
        font-[Riffic] 
        border-4
        hover:bg-opacity-80
        disabled:opacity-50 
        disabled:cursor-not-allowed 
        transition-colors
        ${className}
      `}
    >
      {label}
    </button>
  );
}
