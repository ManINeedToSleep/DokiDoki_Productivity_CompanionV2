interface AchievementItemCardProps {
  children: React.ReactNode;
  className?: string;
  isLocked?: boolean;
}

export default function AchievementItemCard({ children, className = '', isLocked = false }: AchievementItemCardProps) {
  return (
    <div 
      className={`
        bg-white/80 backdrop-blur-sm rounded-lg p-4
        ${isLocked ? 'opacity-50 hover:opacity-75 transition-opacity' : 'shadow-md'}
        ${className}
      `}
    >
      {children}
    </div>
  );
} 