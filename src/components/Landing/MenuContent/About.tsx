"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { imagePaths } from "@/components/Common/Paths/ImagePath";
import { useAudio } from "@/lib/contexts/AudioContext";

export default function About() {
  const { playSoundEffect } = useAudio();
  
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-[Riffic] text-pink-600 mb-4">About Doki Doki Productivity</h3>
      
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-base mb-4 text-gray-700">
            Welcome to Doki Doki Productivity Club, a productivity app with a charming Doki Doki theme! 
            Stay organized and motivated with your cute companion by your side.
          </p>
          
          <h4 className="text-lg font-[Riffic] text-pink-600 mb-2">Our Inspiration</h4>
          <p className="mb-4 text-gray-700">
            Inspired by the beloved Doki Doki aesthetic, we&apos;ve created a productivity tool that makes 
            getting things done more enjoyable. The cute characters and pleasant design help make 
            your daily tasks feel less like work and more like fun!
          </p>
        </div>
        
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <Image
            src={imagePaths.backgrounds.menuOption}
            alt="Doki Doki Productivity"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        
        <div>
          <h4 className="text-lg font-[Riffic] text-pink-600 mb-2">Features</h4>
          <motion.ul 
            className="grid grid-cols-2 gap-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              },
              hidden: {}
            }}
          >
            {[
              "Task management with cute companions",
              "Calendar and scheduling tools",
              "Note-taking with themes",
              "Progress tracking",
              "Customizable workspace",
              "Productivity insights",
              "Character-specific music",
              "Sound effects and feedback"
            ].map((feature, index) => (
              <motion.li 
                key={index}
                className="flex items-center text-gray-700"
                variants={{
                  visible: { opacity: 1, y: 0 },
                  hidden: { opacity: 0, y: 10 }
                }}
                onMouseEnter={() => playSoundEffect('hover')}
              >
                <span className="text-pink-500 mr-2">♥</span> {feature}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
      
      <div className="pt-4 border-t border-pink-300">
        <h4 className="text-lg font-[Riffic] text-pink-600 mb-2">Why Doki Doki?</h4>
        <p className="text-gray-700">
          We believe productivity tools don&apos;t have to be boring! By combining the charm of 
          Doki Doki with powerful productivity features, we&apos;ve created an app that makes 
          organization enjoyable and keeps you coming back to get things done.
        </p>
        <div className="mt-4 p-3 bg-pink-50 rounded-lg border border-pink-200">
          <h5 className="text-sm font-bold text-pink-600 mb-1">Audio Features</h5>
          <p className="text-xs text-gray-600">
            Character voices, background music, and interactive sound effects enhance your
            experience. Click the sound icon to enable audio features!
          </p>
        </div>
      </div>
    </div>
  );
}
