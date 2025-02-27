"use client";

import { motion } from "framer-motion";
import Card from "@/components/Common/Card/LandingCard";

export default function Extra() {
  return (
    <Card>
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-[Riffic] text-pink-700 mb-4">Credits & Disclaimers</h2>
          <p className="text-pink-500 italic">Information about DDPC and its creation</p>
        </motion.div>

        <div className="space-y-6">
          <motion.div
            className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-lg shadow-lg border-2 border-pink-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-2xl text-pink-800 mb-4 font-[Riffic]">About the Creator</h3>
            <p className="text-pink-900 leading-relaxed">
              DDPC was created as a passion project by a DDLC fan who wanted to combine 
              the charm of Doki Doki Literature Club with productivity tools. This project 
              is made purely for fun and to share something enjoyable with the community.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-lg shadow-lg border-2 border-pink-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-2xl text-pink-800 mb-4 font-[Riffic]">Assets Credits</h3>
            <p className="text-pink-900 leading-relaxed mb-4">
              The character sprites and artwork used in this project are from DDLC and DDLC Plus, 
              created by Team Salvato. These assets are used with respect to Team Salvato&apos;s IP Guidelines.
            </p>
            <ul className="list-disc list-inside text-pink-900 space-y-2 ml-4">
              <li>Character Sprites: Team Salvato</li>
              <li>Original Game: Doki Doki Literature Club (Team Salvato)</li>
              <li>Fonts: Team Salvato & Public Fonts</li>
            </ul>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-pink-50 to-white p-8 rounded-lg shadow-lg border-2 border-pink-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-2xl text-pink-800 mb-4 font-[Riffic]">Legal Disclaimer</h3>
            <p className="text-pink-900 leading-relaxed">
              This is a fan project and is not affiliated with Team Salvato. Doki Doki Literature 
              Club and all related characters and assets belong to Team Salvato. This project is 
              created under fair use and follows Team Salvato&apos;s IP Guidelines.
            </p>
          </motion.div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-pink-500 italic mb-3">
              Special thanks to Team Salvato for creating DDLC and inspiring this project! 💕
            </p>
            <a 
              href="http://teamsalvato.com/ip-guidelines/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-pink-400 hover:text-pink-600 underline transition-colors"
            >
              Team Salvato IP Guidelines
            </a>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
