interface AchievementCardProps {
  children: React.ReactNode;
  className?: string;
}

export default function AchievementCard({ children, className = '' }: AchievementCardProps) {
  return (
    <div 
      className={`
        bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg
        border-2 border-pink-100
        ${className}
      `}
    >
      {children}
    </div>
  );
} 