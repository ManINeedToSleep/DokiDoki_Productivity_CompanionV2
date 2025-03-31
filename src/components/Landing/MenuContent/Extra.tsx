"use client";

import { motion } from "framer-motion";
import { useAudio } from "@/lib/contexts/AudioContext";

interface CreditSection {
  title: string;
  content: string;
  items?: string[];
}

const CREDITS: CreditSection[] = [
  {
    title: "About the Creator",
    content: "DDPC was created as a passion project by a DDLC fan who wanted to combine the charm of Doki Doki Literature Club with productivity tools. This project is made purely for fun and to share something enjoyable with the community."
  },
  {
    title: "Assets Credits",
    content: "The character sprites and artwork used in this project are from DDLC and DDLC Plus, created by Team Salvato. These assets are used with respect to Team Salvato's IP Guidelines.",
    items: [
      "Character Sprites: Team Salvato",
      "Original Game: Doki Doki Literature Club (Team Salvato)",
      "Fonts: Team Salvato & Public Fonts"
    ]
  },
  {
    title: "Legal Disclaimer",
    content: "This is a fan project and is not affiliated with Team Salvato. Doki Doki Literature Club and all related characters and assets belong to Team Salvato. This project is created under fair use and follows Team Salvato's IP Guidelines."
  }
];

export default function Extra() {
  const { playSoundEffect } = useAudio();
  
  return (
    <div>
      <h3 className="text-2xl font-[Riffic] text-pink-600 mb-6 text-center">Credits & Disclaimers</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CREDITS.map((section, index) => (
          <motion.div
            key={index}
            className="bg-white/70 p-5 rounded-lg shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            onMouseEnter={() => playSoundEffect('hover')}
          >
            <h4 className="text-lg text-pink-600 mb-3 font-semibold">{section.title}</h4>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">{section.content}</p>
            
            {section.items && (
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                {section.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
      
      <motion.div 
        className="text-center mt-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        viewport={{ once: true }}
      >
        <p className="text-pink-500 italic mb-2 text-sm">
          Special thanks to Team Salvato for creating DDLC and inspiring this project! 💕
        </p>
        <a 
          href="http://teamsalvato.com/ip-guidelines/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-pink-400 hover:text-pink-600 underline transition-colors"
          onClick={() => playSoundEffect('select')}
          onMouseEnter={() => playSoundEffect('hover')}
        >
          Team Salvato IP Guidelines
        </a>
      </motion.div>
    </div>
  );
}
