"use client";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({ 
  label, 
  onClick, 
  disabled = false, 
  className = ''
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 
        rounded-lg 
        font-[Riffic] 
        text-pink-900 
        border-4 border-[#FFB6C1] 
        bg-[#FFEEF3] 
        hover:bg-[#FFCCDD] 
        disabled:opacity-50 
        disabled:cursor-not-allowed 
        transition-colors
        ${className}
      `}
    >
      {label}
    </button>
  );
}
