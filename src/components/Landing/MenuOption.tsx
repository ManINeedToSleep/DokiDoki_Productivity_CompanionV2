"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import MenuContent from './MenuContent';

// Define menu items
const MENU_ITEMS = [
  { id: 'new-game', label: 'New Game' },
  { id: 'load-game', label: 'Load Game' },
  { id: 'options', label: 'Options' },
  { id: 'help', label: 'Help' },
  { id: 'extra', label: 'Extra' },
];

interface MenuOptionProps {
  onCharacterSelect: (characterId: string | null) => void;
}

export default function MenuOption({ onCharacterSelect }: MenuOptionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const getItemPosition = (position: number) => {
    const radius = 200;
    const angleStep = 0.15;
    const angle = position * angleStep;
    
    const y = position * 50;
    const x = Math.sin(angle) * radius * 0.25;
    
    return `translateX(${x}px) translateY(${y}px)`;
  };

  const handleMenuSelect = (index: number) => {
    // TODO: Add sound effect here
    setSelectedIndex(index);
  };

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen">
        {/* Background Image - adjusted to be responsive */}
        <div className="relative h-full w-full flex justify-start">
          <Image
            src={imagePaths.backgrounds.menuOption}
            alt="Menu Options"
            fill
            quality={100}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw"
            className="object-contain object-left max-h-screen"
            priority
          />
        </div>

        {/* Menu Options */}
        <div className="absolute left-0 top-[75%] -translate-y-1/2 w-[300px] overflow-visible z-10">
          <div className="relative h-[450px]">
            {MENU_ITEMS.map((item, index) => {
              const isSelected = selectedIndex === index;
              const position = index - selectedIndex;
              
              return (
                <MenuButton
                  key={item.id}
                  item={item}
                  isSelected={isSelected}
                  position={position}
                  isHovered={hoveredIndex === index}
                  onHover={() => setHoveredIndex(index)}
                  onHoverEnd={() => setHoveredIndex(null)}
                  onClick={() => handleMenuSelect(index)}
                  style={{ transform: getItemPosition(position) }}
                />
              );
            })}
          </div>
        </div>
      </div>
      <MenuContent 
        selectedItem={MENU_ITEMS[selectedIndex].id} 
        onCharacterSelect={onCharacterSelect}
      />
    </>
  );
}

interface MenuButtonProps {
  item: { id: string; label: string };
  isSelected: boolean;
  position: number;
  isHovered: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
  onClick: () => void;
  style: { transform: string };
}

function MenuButton({
  item,
  isSelected,
  position,
  isHovered,
  onHover,
  onHoverEnd,
  onClick,
  style
}: MenuButtonProps) {
  return (
    <motion.button
      className={`absolute left-0 w-full py-2 text-3xl text-left pl-10 
        transition-all duration-300 font-[Riffic] cursor-pointer
        ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        ...style,
        transform: `${style.transform} scale(${isSelected ? 1.2 : 0.9})`,
        opacity: Math.abs(position) > 2.5 ? 0 : 1 - Math.abs(position) * 0.2,
      }}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onClick={onClick}
    >
      <div className="relative">
        {/* Background text (hot pink border effect) */}
        <span 
          className="absolute inset-0 text-[#FF69B4]"
          style={{ 
            transform: 'scale(1.02)',
            WebkitTextStroke: '4px #FF69B4',
            WebkitTextFillColor: 'transparent',
            opacity: isSelected ? 1 : 0.7
          }}
        >
          {item.label}
        </span>
        
        {/* Foreground text (light pink) */}
        <span 
          className={`relative transition-colors duration-200
            ${isHovered || isSelected ? 'text-white' : 'text-pink-200'}`}
        >
          {item.label}
        </span>
      </div>
    </motion.button>
  );
}
