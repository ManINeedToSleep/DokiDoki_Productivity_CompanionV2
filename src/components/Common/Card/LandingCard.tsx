"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

export default function Card({ children }: CardProps) {
  return (
    <div className="fixed inset-0 left-1/3 flex items-center justify-center z-10">
      <AnimatePresence mode="wait">
        <motion.div 
          className="w-[550px] max-h-[600px] overflow-y-auto scrollbar-hide
            bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg"
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.95 }}
          transition={{ 
            duration: 0.3,
            ease: "easeInOut"
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
