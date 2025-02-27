"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Button from "@/components/Common/Button/Button";
import Card from "@/components/Common/Card/LandingCard";

export default function LoadGame() {
  const router = useRouter();

  return (
    <Card>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-[Riffic] text-pink-700 mb-4">Resume Progress</h2>
          <p className="text-pink-500 italic">Your companion awaits your return...</p>
        </motion.div>

        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-lg shadow-lg border-2 border-pink-100">
            <h3 className="text-2xl text-pink-800 mb-4 font-[Riffic]">Welcome Back!</h3>
            <p className="text-pink-900 mb-6 leading-relaxed">
              Ready to continue your journey? Your companion has been eagerly waiting 
              to assist you with your tasks and goals.
            </p>
            
            <div className="flex justify-center">
              <Button 
                label="Return to Your Companion" 
                onClick={() => router.push('/auth?mode=signin')}
                className="text-lg px-8 py-3 shadow-lg hover:scale-105 transform transition-all"
              />
            </div>
          </div>

          <motion.div 
            className="text-center text-pink-400 text-sm mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4 }}
          >
          </motion.div>
        </motion.div>
      </div>
    </Card>
  );
}
