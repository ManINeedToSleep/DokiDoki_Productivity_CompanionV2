"use client";

import { FormEvent, ChangeEvent, useState, useRef, useEffect } from 'react';
import { CompanionId } from '@/lib/firebase/companion';
import Button from '@/components/Common/Button/Button';
import { getInputColors } from '@/components/Common/CharacterColor/CharacterColor';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSmile, FaHeart, FaStar, FaThumbsUp, 
  FaLaugh, FaSadTear, FaAngry, FaPaperPlane 
} from 'react-icons/fa';

interface ChatInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  companionId: CompanionId;
}

export default function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading,
  companionId
}: ChatInputProps) {
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Common emojis for quick access
  const quickEmojis = ['😊', '❤️', '😂', '👍', '🎉', '😍', '🤔', '✨'];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit();
      setShowEmojis(false);
    }
  };
  
  const getPlaceholder = (id: CompanionId): string => {
    switch (id) {
      case 'sayori': return "Chat with Sayori...";
      case 'natsuki': return "Chat with Natsuki...";
      case 'yuri': return "Chat with Yuri...";
      case 'monika': return "Chat with Monika...";
      default: return "Type your message...";
    }
  };

  const inputColors = getInputColors(companionId);
  
  // Handle emoji selection
  const handleEmojiClick = (emoji: string) => {
    if (inputRef.current) {
      const input = inputRef.current;
      const cursorPos = input.selectionStart || 0;
      const startText = value.substring(0, cursorPos);
      const endText = value.substring(cursorPos);
      
      // Simulate change event with the new value
      const newValue = startText + emoji + endText;
      const event = {
        target: { value: newValue }
      } as ChangeEvent<HTMLInputElement>;
      
      onChange(event);
      
      // Focus back on input after adding emoji
      setTimeout(() => {
        input.focus();
        input.selectionStart = cursorPos + emoji.length;
        input.selectionEnd = cursorPos + emoji.length;
      }, 10);
    }
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowEmojis(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Prevent unnecessary refreshes when input is focused
  const handleFocus = (e: React.FocusEvent) => {
    // Stop event propagation to prevent it from bubbling up to window
    e.stopPropagation();
  };
  
  return (
    <div className="relative mt-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onClick={(e) => e.stopPropagation()}
            placeholder={getPlaceholder(companionId)}
            className={`w-full p-3 pl-4 pr-12 rounded-full focus:outline-none transition-all duration-200 shadow-sm placeholder-${inputColors.placeholder}`}
            style={{
              backgroundColor: inputColors.bg,
              borderColor: inputColors.border,
              borderWidth: '2px',
              color: inputColors.focus,
              caretColor: inputColors.focus
            }}
            disabled={isLoading}
          />
          
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <FaSmile 
              size={20} 
              className="opacity-70 hover:opacity-100"
              style={{ color: inputColors.focus }}
            />
          </button>
        </div>
        
        <Button
          label=""
          Icon={FaPaperPlane}
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          companionId={companionId}
          type="submit"
          className="px-4 py-3 rounded-full"
        />
      </form>
      
      <AnimatePresence>
        {showEmojis && (
          <motion.div
            ref={emojiRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10"
            style={{ width: '280px' }}
          >
            <div className="grid grid-cols-8 gap-2">
              {quickEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-2 mt-2 pt-2 border-t border-gray-100">
              <button onClick={() => handleEmojiClick('😊')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaSmile color="#FFB02E" />
              </button>
              <button onClick={() => handleEmojiClick('❤️')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaHeart color="#FF5252" />
              </button>
              <button onClick={() => handleEmojiClick('🌟')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaStar color="#FFD700" />
              </button>
              <button onClick={() => handleEmojiClick('👍')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaThumbsUp color="#4285F4" />
              </button>
              <button onClick={() => handleEmojiClick('😂')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaLaugh color="#FFB02E" />
              </button>
              <button onClick={() => handleEmojiClick('😢')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaSadTear color="#FFB02E" />
              </button>
              <button onClick={() => handleEmojiClick('😠')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                <FaAngry color="#FF5252" />
              </button>
              <button onClick={() => handleEmojiClick('✨')} className="text-xl hover:bg-gray-100 p-1.5 rounded-md transition-colors">
                ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 