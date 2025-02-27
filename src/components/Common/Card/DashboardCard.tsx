"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardCard({ children, className = '' }: DashboardCardProps) {
  return (
    <motion.div 
      className={`
        bg-white/80 
        backdrop-blur-sm 
        rounded-lg 
        p-6
        shadow-lg 
        border-2 
        border-pink-100
        hover:border-pink-200
        transition-all
        duration-300
        ${className}
      `}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
