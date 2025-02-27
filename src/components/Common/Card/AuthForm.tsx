"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`
      bg-white/80 
      backdrop-blur-sm 
      rounded-lg 
      shadow-lg 
      border-2 
      border-pink-100
      ${className}
    `}>
      {children}
    </div>
  );
}
