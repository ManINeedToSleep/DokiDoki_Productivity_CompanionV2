"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Button from "@/components/Common/Button/Button";
import Card from "@/components/Common/Card/AuthForm";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import { AuthMode } from "@/lib/stores/authStore";
import { CompanionId } from "@/lib/firebase/companion";
import { useAuth } from "@/hooks/useAuth";

type AuthField = "email" | "password";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="loading-spinner"></div></div>}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  
  // Use our custom auth hook
  const { isLoading, error, signIn, signUp, signInWithGoogle, clearError, redirectIfAuthenticated } = useAuth();
  
  // Redirect if already logged in
  redirectIfAuthenticated();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [focusedField, setFocusedField] = useState<AuthField | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<CompanionId>("sayori");
  const [showCompanionSelector, setShowCompanionSelector] = useState(false);

  // Check for URL params
  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
      setShowCompanionSelector(true);
    }
    
    const companion = searchParams.get("companion");
    if (companion && ["sayori", "yuri", "natsuki", "monika"].includes(companion)) {
      setSelectedCompanion(companion as CompanionId);
    }
  }, [searchParams]);

  const handleInputChange = (field: AuthField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    clearError();
  };

  const handleEmailAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (mode === "signup") {
      await signUp(formData.email, formData.password, selectedCompanion);
    } else {
      await signIn(formData.email, formData.password);
    }
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle(selectedCompanion);
  };

  const toggleMode = () => {
    setMode(prev => {
      const newMode = prev === "signin" ? "signup" : "signin";
      setShowCompanionSelector(newMode === "signup");
      return newMode;
    });
    clearError();
  };

  const selectCompanion = (id: CompanionId) => {
    setSelectedCompanion(id);
  };

  const companions: { id: CompanionId; name: string; image: string }[] = [
    { id: "sayori", name: "Sayori", image: imagePaths.characterSprites.sayoriChibi },
    { id: "yuri", name: "Yuri", image: imagePaths.characterSprites.yuriChibi },
    { id: "natsuki", name: "Natsuki", image: imagePaths.characterSprites.natsukiChibi },
    { id: "monika", name: "Monika", image: imagePaths.characterSprites.monikaChibi }
  ];

  // Get character color based on selected companion
  const getCharacterColor = (id: CompanionId): string => {
    switch (id) {
      case "sayori": return "#FF9ED2";
      case "natsuki": return "#FF8DA1";
      case "yuri": return "#A49EFF";
      case "monika": return "#85CD9E";
      default: return "#FF9ED2";
    }
  };

  // Get character-specific input colors
  const getInputColors = (id: CompanionId) => {
    switch (id) {
      case "sayori":
        return { 
          bg: '#FFF5F9',
          border: '#FFD1E6',
          focus: '#FF9ED2',
          placeholder: '#FFAED9'
        };
      case "natsuki":
        return { 
          bg: '#FFF5F5',
          border: '#FFCCD5',
          focus: '#FF8DA1',
          placeholder: '#FFA5B5'
        };
      case "yuri":
        return { 
          bg: '#F5F5FF',
          border: '#D1D0FF',
          focus: '#A49EFF',
          placeholder: '#B8B5FF'
        };
      case "monika":
        return { 
          bg: '#F5FFF8',
          border: '#C5E8D1',
          focus: '#85CD9E',
          placeholder: '#A0DCB4'
        };
      default:
        return { 
          bg: '#FFF5F9',
          border: '#FFD1E6',
          focus: '#FF9ED2',
          placeholder: '#FFAED9'
        };
    }
  };

  const characterColor = getCharacterColor(selectedCompanion);
  const inputColors = getInputColors(selectedCompanion);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <PolkaDotBackground dotColor={characterColor} />
      
      {/* Character Chibis */}
      <AnimatePresence>
        {companions.map((companion) => (
          <motion.div
            key={companion.id}
            className={`absolute w-48 h-48 object-contain pointer-events-none ${
              companion.id === "sayori" ? "left-[5%] top-[10%]" :
              companion.id === "yuri" ? "left-[10%] bottom-[15%]" :
              companion.id === "natsuki" ? "right-[5%] top-[10%]" :
              "right-[10%] bottom-[15%]"
            }`}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ 
              opacity: companion.id === selectedCompanion ? 1 : 0.5,
              scale: companion.id === selectedCompanion ? 1 : 0.8,
              y: 0 
            }}
            transition={{ 
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          >
            <Image
              src={companion.image}
              alt=""
              width={192}
              height={192}
              className="object-contain z-10 relative"
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Auth Form */}
      <Card className="mb-8 z-10" companionId={selectedCompanion}>
        <div className="flex flex-col items-center justify-center p-8">
          <motion.div
            className="w-[400px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.h1 
              className="text-3xl font-[Riffic] mb-6 text-center"
              key={mode}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: characterColor }}
            >
              {mode === "signin" ? "Welcome Back!" : "Join the Literature Club!"}
            </motion.h1>
            
            {/* Companion Selector (for signup) */}
            <AnimatePresence>
              {showCompanionSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <h2 className="text-center mb-3" style={{ color: characterColor }}>Choose your companion:</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {companions.map((companion) => (
                      <motion.button
                        key={companion.id}
                        className={`p-2 rounded-lg transition-all flex flex-col items-center ${
                          selectedCompanion === companion.id 
                            ? `ring-2 ring-${companion.id === 'sayori' ? 'pink' : companion.id === 'natsuki' ? 'red' : companion.id === 'yuri' ? 'indigo' : 'green'}-300 bg-white/50` 
                            : 'hover:bg-white/30'
                        }`}
                        style={{ 
                          borderColor: selectedCompanion === companion.id ? getCharacterColor(companion.id) : 'transparent'
                        }}
                        onClick={() => selectCompanion(companion.id)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="w-12 h-12 relative mb-1 overflow-visible">
                          <Image
                            src={companion.image}
                            alt={companion.name}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </div>
                        <br></br>
                        <span> </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
              {["email", "password"].map((field) => (
                <motion.div 
                  key={field}
                  className="flex flex-col items-center"
                  animate={{ 
                    scale: focusedField === field ? 1.02 : 1,
                    y: focusedField === field ? -2 : 0
                  }}
                >
                  <input
                    type={field}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    className="w-full p-3 rounded-lg border-2 transition-all duration-200 font-[halogen]"
                    value={formData[field as AuthField]}
                    onChange={handleInputChange(field as AuthField)}
                    onFocus={() => setFocusedField(field as AuthField)}
                    onBlur={() => setFocusedField(null)}
                    style={{ 
                      backgroundColor: inputColors.bg,
                      borderColor: focusedField === field ? inputColors.focus : inputColors.border,
                      boxShadow: focusedField === field ? `0 0 0 1px ${inputColors.focus}` : '',
                      color: inputColors.focus,
                      textAlign: "center",
                      caretColor: inputColors.focus,
                    }}
                  />
                </motion.div>
              ))}
              
              <div className="flex justify-center">
                <Button 
                  label={mode === "signin" ? "Sign In" : "Create Account"}
                  onClick={handleEmailAuth}
                  disabled={isLoading}
                  className="bg-opacity-90 hover:bg-opacity-100 transition-all"
                  companionId={selectedCompanion}
                />
              </div>
            </form>

            {/* Add divider and Google button */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: `${characterColor}40` }}></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80" style={{ color: characterColor }}>Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <Button 
                label="Continue with Google"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full"
                companionId={selectedCompanion}
              />
            </div>

            <motion.p 
              className="mt-6 text-center text-sm"
              animate={{ opacity: isLoading ? 0.5 : 1 }}
              style={{ color: `${characterColor}CC` }}
            >
              {mode === "signin" ? "New to DDPC? " : "Already have an account? "}
              <button 
                onClick={toggleMode}
                disabled={isLoading}
                className="hover:underline disabled:opacity-50 font-medium"
                style={{ color: characterColor }}
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </motion.p>

            <motion.div 
              className="mt-8 text-center text-sm italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ color: characterColor }}
            >
              {mode === "signin" 
                ? "The club members have been waiting for you!" 
                : "We're excited to have you join us!"}
            </motion.div>
          </motion.div>
        </div>
      </Card>

      {/* Decorative Elements */}
      <motion.div
        className="text-sm z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        style={{ color: characterColor }}
      >
        ♥ Doki Doki Productivity Club ♥
      </motion.div>

      {/* Add this style tag inside your component */}
      <style jsx global>{`
        input::selection {
          background-color: ${characterColor}40;
          color: ${inputColors.focus};
        }
        
        input:focus {
          outline-color: ${inputColors.focus};
        }
      `}</style>
    </div>
  );
}
