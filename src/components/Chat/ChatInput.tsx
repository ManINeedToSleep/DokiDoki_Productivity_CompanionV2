"use client";

import { FormEvent, ChangeEvent } from 'react';
import { CompanionId } from '@/lib/firebase/companion';
import Button from '@/components/Common/Button/Button';
import { getInputColors } from '@/components/Common/CharacterColor/CharacterColor';

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
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
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
  
  // Prevent unnecessary refreshes when input is focused
  const handleFocus = (e: React.FocusEvent) => {
    // Stop event propagation to prevent it from bubbling up to window
    e.stopPropagation();
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onClick={(e) => e.stopPropagation()}
        placeholder={getPlaceholder(companionId)}
        className={`flex-1 p-3 rounded-lg focus:outline-none transition-all duration-200 placeholder-${inputColors.placeholder}`}
        style={{
          backgroundColor: inputColors.bg,
          borderColor: inputColors.border,
          borderWidth: '2px',
          color: inputColors.focus,
          caretColor: inputColors.focus
        }}
        disabled={isLoading}
      />
      
      <Button
        label={isLoading ? "Thinking..." : "Send"}
        onClick={onSubmit}
        disabled={isLoading || !value.trim()}
        companionId={companionId}
        type="submit"
        className="px-4 py-2"
      />
    </form>
  );
} 