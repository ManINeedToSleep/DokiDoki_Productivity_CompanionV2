"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlitchEffectProps {
  trigger?: boolean;
  intensity?: 'subtle' | 'medium' | 'intense';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glitchText?: string;
  onGlitchComplete?: () => void;
}

export default function GlitchEffect({
  trigger = false,
  intensity = 'medium',
  children,
  className = '',
  style = {},
  glitchText,
  onGlitchComplete
}: GlitchEffectProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [randomGlitch, setRandomGlitch] = useState(false);
  
  // Set up intensity parameters
  const glitchDuration = {
    subtle: 0.2,
    medium: 0.3,
    intense: 0.5
  }[intensity];
  
  const glitchFrequency = {
    subtle: 0.05,
    medium: 0.1,
    intense: 0.2
  }[intensity];

  const glitchIntensity = {
    subtle: 2,
    medium: 5,
    intense: 10
  }[intensity];
  
  // Random glitch effect
  useEffect(() => {
    if (!trigger) return;
    
    // Start glitching
    setIsGlitching(true);
    
    // Timer for stopping the glitch
    const glitchTimer = setTimeout(() => {
      setIsGlitching(false);
      if (onGlitchComplete) onGlitchComplete();
    }, glitchDuration * 1000 * 4); // Duration in ms
    
    // Clean up
    return () => clearTimeout(glitchTimer);
  }, [trigger, glitchDuration, onGlitchComplete]);
  
  // Random glitches with lower probability
  useEffect(() => {
    if (!isGlitching) return;
    
    const randomGlitchInterval = setInterval(() => {
      const shouldGlitch = Math.random() < glitchFrequency;
      setRandomGlitch(shouldGlitch);
      
      if (shouldGlitch) {
        // Turn off glitch after a short time
        setTimeout(() => setRandomGlitch(false), 120);
      }
    }, 100);
    
    return () => clearInterval(randomGlitchInterval);
  }, [isGlitching, glitchFrequency]);
  
  const getGlitchStyles = (): React.CSSProperties => {
    if (!isGlitching && !randomGlitch) return {};
    
    const randomX = (Math.random() - 0.5) * glitchIntensity;
    const randomY = (Math.random() - 0.5) * glitchIntensity;
    const randomSkew = (Math.random() - 0.5) * glitchIntensity * 0.5;
    
    return {
      transform: `translate(${randomX}px, ${randomY}px) skew(${randomSkew}deg)`,
      filter: `hue-rotate(${Math.random() * 360}deg) brightness(${1 + Math.random() * 0.4})`
    };
  };

  // Generate RGB shift layers
  const generateRgbShiftLayers = () => {
    if (!isGlitching && !randomGlitch) return null;
    
    return (
      <>
        {/* Red layer */}
        <div 
          className="absolute inset-0 z-10 mix-blend-screen pointer-events-none" 
          style={{ 
            color: 'rgb(255,0,0)',
            left: `${(Math.random() - 0.5) * glitchIntensity * 2}px`,
            top: `${(Math.random() - 0.5) * glitchIntensity}px`,
            opacity: 0.8
          }}
        >
          {children}
        </div>
        
        {/* Blue layer */}
        <div 
          className="absolute inset-0 z-10 mix-blend-screen pointer-events-none" 
          style={{ 
            color: 'rgb(0,0,255)',
            left: `${(Math.random() - 0.5) * glitchIntensity * -2}px`,
            top: `${(Math.random() - 0.5) * glitchIntensity}px`,
            opacity: 0.8
          }}
        >
          {children}
        </div>
        
        {/* Green layer */}
        <div 
          className="absolute inset-0 z-10 mix-blend-screen pointer-events-none" 
          style={{ 
            color: 'rgb(0,255,0)',
            left: `${(Math.random() - 0.5) * glitchIntensity}px`,
            top: `${(Math.random() - 0.5) * glitchIntensity * -1}px`,
            opacity: 0.8
          }}
        >
          {children}
        </div>
      </>
    );
  };
  
  return (
    <div className={`relative ${className}`} style={style}>
      {/* Main content */}
      <div style={getGlitchStyles()}>
        {children}
      </div>
      
      {/* RGB shift effect */}
      {generateRgbShiftLayers()}
      
      {/* Glitch text overlay */}
      <AnimatePresence>
        {isGlitching && glitchText && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none text-red-500 font-bold overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, times: [0, 0.2, 0.3, 0.45, 0.5] }}
          >
            <div 
              className="text-center px-4 py-2 bg-black bg-opacity-30 backdrop-blur-sm"
              style={{ fontFamily: 'monospace', fontSize: '2rem', textTransform: 'uppercase' }}
            >
              {glitchText}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Scan lines */}
      {(isGlitching || randomGlitch) && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 overflow-hidden opacity-30"
          style={{
            backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.5) 50%)',
            backgroundSize: '100% 4px',
            mixBlendMode: 'color-burn'
          }}
        />
      )}
    </div>
  );
} 