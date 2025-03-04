"use client";

import { ReactNode } from "react";
import { CompanionId } from '@/lib/firebase/companion';

interface CardProps {
  children: ReactNode;
  className?: string;
  companionId?: CompanionId;
}

export default function Card({ children, className = '', companionId = 'sayori' }: CardProps) {
  // Get character-specific border color
  const getBorderColor = (id: CompanionId) => {
    switch (id) {
      case 'sayori':
        return 'border-pink-200';
      case 'natsuki':
        return 'border-red-200';
      case 'yuri':
        return 'border-indigo-200';
      case 'monika':
        return 'border-green-200';
      default:
        return 'border-pink-200';
    }
  };

  const borderColor = getBorderColor(companionId);

  return (
    <div className={`
      bg-white/80 
      backdrop-blur-sm 
      rounded-lg 
      shadow-lg 
      border-2 
      ${borderColor}
      ${className}
    `}>
      {children}
    </div>
  );
}
