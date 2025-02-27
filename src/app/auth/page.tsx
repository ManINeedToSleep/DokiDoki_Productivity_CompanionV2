"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Button from "@/components/Common/Button/Button";
import AuthForm from "@/components/Common/Card/AuthForm";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import PolkaDotBackground from "@/components/Common/BackgroundCustom/PolkadotBackground";
import { createUserDocument } from "@/lib/firebase/user";

type AuthMode = "signin" | "signup";
type AuthField = "email" | "password";

interface AuthError {
  code: string;
  message: string;
}

const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'Email already in use. Try logging in instead.',
  'auth/invalid-email': 'Invalid email address.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password.',
  'default': 'Something went wrong. Please try again.'
} as const;

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<AuthField | null>(null);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") setMode("signup");
  }, [searchParams]);

  const handleInputChange = (field: AuthField) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleEmailAuth = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError("");
      
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const selectedCompanion = searchParams.get('companion') || 'sayori';
        console.log('Selected companion:', selectedCompanion);
        await createUserDocument(user.uid, user.email!, selectedCompanion as 'sayori' | 'yuri' | 'natsuki' | 'monika');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      
      router.push('/dashboard');
    } catch (error: unknown) {
      const authError = error as AuthError;
      setError(AUTH_ERROR_MESSAGES[authError.code as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default);
    } finally {
      setLoading(false);
    }
  }, [loading, mode, formData, router, searchParams]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      const selectedCompanion = searchParams.get('companion') || 'sayori';
      await createUserDocument(user.uid, user.email!, selectedCompanion as 'sayori' | 'yuri' | 'natsuki' | 'monika');
      router.push('/dashboard');
    } catch (error: unknown) {
      const authError = error as AuthError;
      setError(AUTH_ERROR_MESSAGES[authError.code as keyof typeof AUTH_ERROR_MESSAGES] || AUTH_ERROR_MESSAGES.default);
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  const toggleMode = () => setMode(prev => prev === "signin" ? "signup" : "signin");

  const chibis = [
    imagePaths.characterSprites.sayoriChibi,
    imagePaths.characterSprites.yuriChibi,
    imagePaths.characterSprites.natsukiChibi,
    imagePaths.characterSprites.monikaChibi
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <PolkaDotBackground />
      
      {/* Character Chibis */}
      <AnimatePresence>
        {chibis.map((chibiPath, index) => (
          <motion.img
            key={index}
            src={chibiPath}
            alt={`Character ${index + 1}`}
            className={`absolute w-48 h-48 object-contain pointer-events-none ${
              index === 0 ? "left-[5%] top-[15%]" :
              index === 1 ? "left-[10%] bottom-[10%]" :
              index === 2 ? "right-[5%] top-[15%]" :
              "right-[10%] bottom-[10%]"
            }`}
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ 
              delay: index * 0.2,
              duration: 0.5,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
          />
        ))}
      </AnimatePresence>

      {/* Auth Form */}
      <AuthForm className="mb-8">
        <div className="flex flex-col items-center justify-center p-8">
          <motion.div
            className="w-[400px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <motion.h1 
              className="text-3xl font-[Riffic] text-pink-700 mb-6 text-center"
              key={mode}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {mode === "signin" ? "Welcome Back!" : "Join the Literature Club!"}
            </motion.h1>
            
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
                    className="w-full p-3 rounded-lg bg-white/50 border border-pink-100 
                      focus:border-pink-300 focus:outline-none text-center 
                      text-black placeholder:text-pink-300 transition-all duration-200"
                    value={formData[field as AuthField]}
                    onChange={handleInputChange(field as AuthField)}
                    onFocus={() => setFocusedField(field as AuthField)}
                    onBlur={() => setFocusedField(null)}
                  />
                </motion.div>
              ))}
              
              <div className="flex justify-center">
                <Button 
                  label={mode === "signin" ? "Sign In" : "Create Account"}
                  onClick={handleEmailAuth}
                  disabled={loading}
                />
              </div>
            </form>

            {/* Add divider and Google button */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-pink-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white/80 text-pink-600">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <Button 
                label="Continue with Google"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
              />
            </div>

            <motion.p 
              className="mt-6 text-center text-sm text-pink-600"
              animate={{ opacity: loading ? 0.5 : 1 }}
            >
              {mode === "signin" ? "New to DDPC? " : "Already have an account? "}
              <button 
                onClick={toggleMode}
                disabled={loading}
                className="text-pink-500 hover:text-pink-600 underline disabled:opacity-50"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </motion.p>

            <motion.div 
              className="mt-8 text-center text-sm text-pink-500 italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {mode === "signin" 
                ? "The club members have been waiting for you!" 
                : "We're excited to have you join us!"}
            </motion.div>
          </motion.div>
        </div>
      </AuthForm>

      {/* Decorative Elements */}
      <motion.div
        className="text-pink-400 text-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        ♥ Doki Doki Productivity Club ♥
      </motion.div>
    </div>
  );
}
