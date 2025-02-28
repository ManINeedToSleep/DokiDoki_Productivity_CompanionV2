"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/Common/Button/Button";

export function StudyNotes() {
  const [notes, setNotes] = useState<string>("");
  const [savedNotes, setSavedNotes] = useState<string[]>([]);

  const handleSaveNote = () => {
    if (notes.trim()) {
      setSavedNotes(prev => [...prev, notes.trim()]);
      setNotes("");
    }
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-[Riffic] text-pink-600 mb-4">Study Notes</h2>
      
      <div className="space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your study notes here..."
          className="w-full p-3 rounded-lg border border-pink-200 focus:outline-none focus:border-pink-400 font-[Halogen] text-pink-700 resize-none"
          rows={3}
        />
        
        <div className="flex justify-end">
          <Button
            onClick={handleSaveNote}
            label="Save Note"
            disabled={!notes.trim()}
          />
        </div>

        {savedNotes.length > 0 && (
          <div className="mt-4 space-y-2">
            {savedNotes.map((note, index) => (
              <div 
                key={index}
                className="bg-white/50 p-3 rounded-lg font-[Halogen] text-pink-700"
              >
                {note}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
