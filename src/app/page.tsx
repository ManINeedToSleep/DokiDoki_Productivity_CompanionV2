"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaVolumeUp, FaVolumeMute, FaChevronDown } from "react-icons/fa";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import BackgroundMusic, { playSoundEffect, SoundEffectType } from "@/components/Common/Music/BackgroundMusic";
import { getBackgroundMusicPath } from "@/types/audio";
import { CompanionId } from "@/lib/firebase/companion";
import { getCharacterColors, getCharacterDotColor } from "@/components/Common/CharacterColor/CharacterColor";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import CharacterInfo from "@/components/Landing/CharacterInfo";

// Sections for the landing page (based on menu items)
import About from "@/components/Landing/MenuContent/About";
import Help from "@/components/Landing/MenuContent/Help";
import Extra from "@/components/Landing/MenuContent/Extra";
import Options from "@/components/Landing/MenuContent/Options";

// Character data
const characters = [
  { 
    id: "sayori" as CompanionId, 
    name: "Sayori", 
    description: "Always cheerful and supportive. Sayori will help you stay positive through your productivity journey!"
  },
  { 
    id: "natsuki" as CompanionId, 
    name: "Natsuki", 
    description: "Direct and energetic. Natsuki will keep you motivated with her spirited approach!"
  },
  { 
    id: "yuri" as CompanionId, 
    name: "Yuri", 
    description: "Thoughtful and calm. Yuri will help you maintain deep focus and mindfulness."
  },
  { 
    id: "monika" as CompanionId, 
    name: "Monika", 
    description: "Confident and encouraging. Monika will guide you through your productivity journey!"
  }
];

// Section definitions
const sections = [
  { id: "home", label: "Home" },
  { id: "companions", label: "Companions" },
  { id: "features", label: "Features" },
  { id: "testimonials", label: "Testimonials" },
  { id: "about", label: "About" },
];

export default function Home() {
  const router = useRouter();
  const [selectedCharacter, setSelectedCharacter] = useState<CompanionId | null>(null);
  const [hoveredCharacter, setHoveredCharacter] = useState<CompanionId | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [activeTheme, setActiveTheme] = useState<CompanionId>("sayori");
  const [activeSection, setActiveSection] = useState("home");
  
  // Create section refs individually first
  const homeRef = useRef<HTMLDivElement>(null);
  const companionsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  
  // Group refs in a memoized object
  const sectionRefs = useMemo(() => ({
    home: homeRef,
    companions: companionsRef,
    features: featuresRef,
    testimonials: testimonialsRef,
    about: aboutRef,
  }), []);
  
  // Main container reference for scrolling
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Update theme when character is selected
  useEffect(() => {
    if (selectedCharacter) {
      setActiveTheme(selectedCharacter);
    }
  }, [selectedCharacter]);
  
  // Handle scroll to detect active section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for better detection
      
      // Find which section is currently in view
      for (const [id, ref] of Object.entries(sectionRefs)) {
        if (ref.current) {
          const element = ref.current;
          const { offsetTop, offsetHeight } = element;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRefs]);

  const handleCharacterSelect = (characterId: CompanionId | null) => {
    setSelectedCharacter(characterId);
    
    // Play sound on character select
    if (characterId) {
      playSoundEffect('click' as SoundEffectType);
      
      // Update theme
      setActiveTheme(characterId);
    }
  };

  const handleCharacterHover = (characterId: CompanionId | null) => {
    if (characterId && characterId !== hoveredCharacter) {
      playSoundEffect('hover' as SoundEffectType);
    }
    setHoveredCharacter(characterId);
  };

  const handleStartJourney = () => {
    if (selectedCharacter) {
      playSoundEffect('click' as SoundEffectType);
      
      setTimeout(() => {
        router.push(`/auth?mode=signup&companion=${selectedCharacter}`);
      }, 300);
    }
  };

  const handleLogin = () => {
    playSoundEffect('click' as SoundEffectType);
    
    setTimeout(() => {
      router.push("/auth");
    }, 300);
  };
  
  const toggleMusic = () => {
    setMusicEnabled(prev => !prev);
    playSoundEffect('click' as SoundEffectType);
  };
  
  const scrollToSection = (sectionId: string) => {
    playSoundEffect('click' as SoundEffectType);
    
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    setActiveSection(sectionId);
  };

  // Get theme colors
  const themeColors = getCharacterColors(activeTheme);
  const dotColor = getCharacterDotColor(activeTheme);

  return (
    <div className="min-h-screen w-full overflow-y-auto" ref={mainContainerRef}>
      {/* Background music component */}
      <BackgroundMusic 
        musicEnabled={musicEnabled} 
        soundEffectsEnabled={true}
        musicSrc={getBackgroundMusicPath('ddlcMainTheme80s')}
      />
      
      {/* Animated polka dot background */}
      <PolkaDotBackground dotColor={dotColor} />
      
      <main className="relative min-h-screen w-full">
        {/* Custom scrollbar style */}
        <style jsx global>{`
          /* Hide scrollbar but allow scrolling */
          body {
            overflow-y: auto;
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none;  /* IE and Edge */
          }
          
          body::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
          
          /* Ensure the container is scrollable */
          html, body, #__next, main {
            height: 100%;
            width: 100%;
          }
        `}</style>

        {/* Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-2xl font-[Riffic]" style={{ color: themeColors.primary }}>
                  Doki Doki PC
                </h1>
              </div>
              
              {/* Navigation links */}
              <nav className="hidden md:flex items-center space-x-8">
                {sections.map((section) => (
                  <button 
                    key={section.id}
                    className={`text-sm font-[Halogen] transition-colors relative py-2`}
                    style={{ 
                      color: activeSection === section.id ? themeColors.primary : 'gray'
                    }}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.label}
                    {activeSection === section.id && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                        layoutId="activeSection"
                        style={{ backgroundColor: themeColors.primary }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                ))}
              </nav>
              
              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Music toggle */}
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  onClick={toggleMusic}
                >
                  {musicEnabled ? (
                    <FaVolumeUp style={{ color: themeColors.primary }} />
                  ) : (
                    <FaVolumeMute style={{ color: themeColors.primary }} />
                  )}
                </button>
                
                {/* Login button */}
                <button 
                  className="hidden md:block px-4 py-1.5 rounded-full text-white text-sm shadow-sm hover:shadow transition-all"
                  style={{ backgroundColor: themeColors.primary }}
                  onClick={handleLogin}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero section */}
        <section 
          ref={homeRef}
          className="min-h-screen flex flex-col items-center justify-center px-4 pt-16"
          id="home"
        >
          <div className="container mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div 
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.3 }}
                className="mb-6"
              >
                <h1 
                  className="text-5xl md:text-6xl font-[Riffic] mb-2 drop-shadow-lg"
                  style={{ color: themeColors.primary }}
                >
                  Doki Doki
                </h1>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="h-1 rounded-full w-48 md:w-96 mx-auto mb-2"
                  style={{ backgroundColor: themeColors.primary }}
                />
                <h2 
                  className="text-3xl md:text-4xl font-[Riffic] drop-shadow-md"
                  style={{ color: themeColors.heading }}
                >
                  Productivity Club
                </h2>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-4 text-lg mb-8"
                style={{ color: themeColors.text }}
              >
                Welcome to a new adventure! Meet the Literature Club members who will help you on your productivity journey.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
                className="flex flex-col md:flex-row gap-4 justify-center"
              >
                <button 
                  className="px-6 py-3 rounded-full font-[Riffic] text-white shadow-lg transition-all hover:brightness-110 active:brightness-90"
                  style={{ 
                    backgroundColor: themeColors.primary,
                    boxShadow: `0 4px 14px ${themeColors.primary}60`
                  }}
                  onClick={() => scrollToSection("companions")}
                >
                  Choose Your Companion
                </button>
                
                <button 
                  className="px-6 py-3 rounded-full font-[Riffic] bg-white shadow-md hover:shadow-lg transition-all border-2"
                  style={{ 
                    color: themeColors.primary,
                    borderColor: themeColors.primary 
                  }}
                  onClick={handleLogin}
                >
                  I Already Have an Account
                </button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="absolute bottom-8 left-0 right-0 flex justify-center"
                onClick={() => scrollToSection("companions")}
              >
                <div className="cursor-pointer p-2 animate-bounce">
                  <FaChevronDown style={{ color: themeColors.primary }} size={24} />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Companions section */}
        <section 
          ref={companionsRef}
          className="min-h-screen py-16 px-4"
          id="companions"
        >
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-[Riffic] text-center mb-12"
              style={{ color: themeColors.primary }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Choose Your Companion
            </motion.h2>
            
            {/* Character selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
              {characters.map((character) => {
                const colors = getCharacterColors(character.id);
                return (
                  <motion.div 
                    key={character.id}
                    className={`relative rounded-xl p-4 cursor-pointer transition-all
                      ${selectedCharacter === character.id ? 'bg-white/80' : 'bg-white/30 hover:bg-white/50'}
                      backdrop-blur-sm border-2`}
                    style={{ 
                      borderColor: colors.primary,
                      boxShadow: selectedCharacter === character.id || hoveredCharacter === character.id 
                        ? `0 0 20px ${colors.primary}40` 
                        : 'none'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { 
                        delay: 0.1 * characters.findIndex(c => c.id === character.id),
                        duration: 0.5 
                      }
                    }}
                    viewport={{ once: true }}
                    onClick={() => handleCharacterSelect(character.id)}
                    onMouseEnter={() => handleCharacterHover(character.id)}
                    onMouseLeave={() => handleCharacterHover(null)}
                    whileHover={{ scale: 1.03 }}
                    animate={{ 
                      scale: selectedCharacter === character.id ? 1.05 : 1
                    }}
                  >
                    <motion.div 
                      className="absolute top-2 left-2 right-2 flex justify-center"
                      animate={{ 
                        y: selectedCharacter === character.id ? -5 : 0
                      }}
                    >
                      <h3 
                        className="text-xl font-[Riffic] px-3 py-1 rounded-full text-white"
                        style={{ 
                          backgroundColor: colors.primary,
                          opacity: selectedCharacter === character.id || hoveredCharacter === character.id ? 1 : 0.7
                        }}
                      >
                        {character.name}
                      </h3>
                    </motion.div>
                    
                    <div className="h-48 md:h-64 relative mt-7">
                      <motion.div
                        className="absolute inset-0"
                        animate={{ 
                          y: [0, -10, 0],
                        }}
                        transition={{ 
                          y: { repeat: Infinity, duration: 3, ease: "easeInOut" },
                        }}
                      >
                        <Image
                          src={imagePaths.characterSprites[`${character.id}Chibi`]}
                          alt={character.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 25vw"
                          className="object-contain"
                        />
                      </motion.div>
                    </div>
                    
                    <AnimatePresence>
                      {(selectedCharacter === character.id || hoveredCharacter === character.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-2 overflow-hidden"
                        >
                          <p className="text-sm text-center" style={{ color: colors.text }}>
                            {character.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Character info */}
            <AnimatePresence>
              {selectedCharacter && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="mt-8"
                >
                  <CharacterInfo selectedCharacter={selectedCharacter} />
                  
                  <div className="mt-8 text-center">
                    <button 
                      className="px-8 py-3 rounded-full font-[Riffic] text-white shadow-lg transition-all hover:brightness-110 active:brightness-90"
                      style={{ 
                        backgroundColor: themeColors.primary,
                        boxShadow: `0 4px 14px ${themeColors.primary}60`
                      }}
                      onClick={handleStartJourney}
                    >
                      Begin Your Journey with {selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Features section */}
        <section 
          ref={featuresRef}
          className="min-h-screen py-16 px-4 bg-white/70"
          id="features"
        >
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-[Riffic] text-center mb-12"
              style={{ color: themeColors.primary }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Features
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Pomodoro Timer",
                  description: "Stay focused with a customizable Pomodoro timer. Your companion will cheer you on during work sessions and celebrate breaks with you!",
                  icon: "⏱️"
                },
                {
                  title: "Task Management",
                  description: "Organize your tasks in a delightful interface with your companion offering encouragement and advice along the way.",
                  icon: "📝"
                },
                {
                  title: "Progress Tracking",
                  description: "Watch your productivity grow with detailed statistics and insights on your work habits and accomplishments.",
                  icon: "📊"
                },
                {
                  title: "Character Progression",
                  description: "Develop a deeper connection with your companion as you work together. Unlock new interactions and memories!",
                  icon: "💖"
                },
                {
                  title: "Customizable Interface",
                  description: "Personalize your workspace with themes and settings that match your preferences and work style.",
                  icon: "🎨"
                },
                {
                  title: "Motivational Messages",
                  description: "Receive encouraging words from your companion based on your tasks, progress, and achievements.",
                  icon: "💬"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-[Riffic] mb-2" style={{ color: themeColors.primary }}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-700">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials section */}
        <section 
          ref={testimonialsRef}
          className="min-h-screen py-16 px-4 bg-gradient-to-b from-white/30 to-white/60"
          id="testimonials"
        >
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-[Riffic] text-center mb-4"
              style={{ color: themeColors.primary }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Character Testaments
            </motion.h2>
            
            <motion.p
              className="text-center max-w-2xl mx-auto mb-12"
              style={{ color: themeColors.text }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              viewport={{ once: true }}
            >
              Discover your companions&apos; thoughts on productivity...
            </motion.p>
            
            <div className="max-w-4xl mx-auto">
              <Options />
            </div>
          </div>
        </section>

        {/* About section */}
        <section 
          ref={aboutRef}
          className="min-h-screen py-16 px-4 bg-white/70"
          id="about"
        >
          <div className="container mx-auto">
            <motion.h2 
              className="text-3xl md:text-4xl font-[Riffic] text-center mb-12"
              style={{ color: themeColors.primary }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              About
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <About />
              </motion.div>
              
              <motion.div
                className="bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <Help />
              </motion.div>
            </div>
            
            <motion.div
              className="mt-12 bg-white/70 backdrop-blur-sm p-6 rounded-xl shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Extra />
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 px-4 bg-white/50 backdrop-blur-sm border-t" style={{ borderColor: `${themeColors.primary}30` }}>
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-[Riffic]" style={{ color: themeColors.primary }}>
                  Doki Doki Productivity Club
                </h3>
                <p className="text-sm" style={{ color: themeColors.text }}>
                  Inspired by Doki Doki Literature Club
                </p>
              </div>
              
              <div className="flex space-x-6">
                {sections.map((section) => (
                  <button 
                    key={section.id}
                    className="text-sm hover:underline"
                    style={{ color: themeColors.text }}
                    onClick={() => scrollToSection(section.id)}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 md:mt-0">
                <p className="text-sm" style={{ color: themeColors.text }}>
                  ♥ Made with love ♥
                </p>
              </div>
            </div>
      </div>
        </footer>
    </main>
    </div>
  );
}
