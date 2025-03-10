"use client";

import { useMemo } from 'react';
import StatsCard from '@/components/Common/Card/StatsCard';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { FocusSession } from '@/lib/firebase/user';
import { Timestamp } from '@/lib/firebase';

interface RecentSessionsProps {
  title?: string;
  companionId?: CompanionId;
  recentSessions?: FocusSession[];
  className?: string;
  limit?: number;
}

export default function RecentSessions({
  title = "Recent Sessions",
  companionId = 'sayori',
  recentSessions = [],
  className = '',
  limit = 5
}: RecentSessionsProps) {
  const colors = getCharacterColors(companionId);
  
  // Sort sessions by date (newest first)
  const sortedSessions = useMemo(() => {
    if (!recentSessions || recentSessions.length === 0) {
      return [];
    }
    
    return [...recentSessions]
      .sort((a, b) => b.startTime.toMillis() - a.startTime.toMillis())
      .slice(0, limit);
  }, [recentSessions, limit]);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate productivity score (placeholder logic - could be improved)
  const getProductivityScore = (session: FocusSession) => {
    // Base score depends on completion status
    let score = session.completed ? 80 : 40;
    
    // Add bonus for longer sessions (max +10)
    const durationMinutes = session.duration / 60;
    score += Math.min(10, durationMinutes / 6);
    
    // Penalty for many breaks (max -10)
    score -= Math.min(10, session.breaks.count * 2);
    
    // Random variance for demo purposes
    score += Math.floor(Math.random() * 10);
    
    // Ensure within 0-100 range
    return Math.max(0, Math.min(100, Math.floor(score)));
  };
  
  // Get color based on productivity score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <StatsCard
      title={title}
      companionId={companionId}
      className={className}
    >
      {sortedSessions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-[Halogen]" style={{ color: colors.text }}>Date</th>
                <th className="text-left py-2 text-sm font-[Halogen]" style={{ color: colors.text }}>Duration</th>
                <th className="text-left py-2 text-sm font-[Halogen]" style={{ color: colors.text }}>Companion</th>
                <th className="text-left py-2 text-sm font-[Halogen]" style={{ color: colors.text }}>Status</th>
                <th className="text-left py-2 text-sm font-[Halogen]" style={{ color: colors.text }}>Productivity</th>
              </tr>
            </thead>
            <tbody>
              {sortedSessions.map((session) => {
                const productivity = getProductivityScore(session);
                return (
                  <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">
                      {formatDate(session.startTime)}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {formatTime(session.duration)}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      <span className="capitalize">
                        {session.companionId}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      <span 
                        className={`px-2 py-1 rounded-full text-xs ${
                          session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {session.completed ? 'Completed' : 'Interrupted'}
                      </span>
                    </td>
                    <td className="py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getScoreColor(productivity)}`}
                            style={{ 
                              width: `${productivity}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-xs">{productivity}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-600 font-[Halogen]">
          No recent sessions found. Start a focus session to track your progress!
        </div>
      )}
    </StatsCard>
  );
} 