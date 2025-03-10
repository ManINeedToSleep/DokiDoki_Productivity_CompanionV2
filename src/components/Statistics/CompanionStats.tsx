"use client";

import { useMemo } from 'react';
import StatsCard from '@/components/Common/Card/StatsCard';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { UserDocument } from '@/lib/firebase/user';
import { 
  ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface CompanionStatsProps {
  title?: string;
  companionId?: CompanionId;
  userData?: UserDocument | null;
  className?: string;
  chartType?: 'bar' | 'radar';
  height?: number;
}

// Define a proper type for companion data
interface CompanionDataPoint {
  name: string;
  id?: CompanionId;
  affinity: number;
  sessions: number;
  goals: number;
  interactionTime?: number;
  streak?: number;
  lastInteraction?: Date;
}

export default function CompanionStats({
  title = "Companion Statistics",
  companionId = 'sayori',
  userData = null,
  className = '',
  chartType = 'bar',
  height = 300
}: CompanionStatsProps) {
  const colors = getCharacterColors(companionId);
  
  // Process companion data
  const companionData = useMemo<CompanionDataPoint[]>(() => {
    if (!userData || !userData.companions) {
      // Return placeholder data
      return [
        { name: 'Sayori', affinity: 0, sessions: 0, goals: 0 },
        { name: 'Natsuki', affinity: 0, sessions: 0, goals: 0 },
        { name: 'Yuri', affinity: 0, sessions: 0, goals: 0 },
        { name: 'Monika', affinity: 0, sessions: 0, goals: 0 }
      ];
    }
    
    return Object.entries(userData.companions).map(([id, data]) => ({
      name: id.charAt(0).toUpperCase() + id.slice(1), // Capitalize name
      id: id as CompanionId,
      affinity: data.affinityLevel,
      sessions: data.stats.sessionsCompleted,
      goals: data.stats.goalsCompleted,
      interactionTime: Math.floor(data.stats.totalInteractionTime / 60), // Convert seconds to minutes
      streak: data.stats.consecutiveDays,
      lastInteraction: data.lastInteraction.toDate()
    }));
  }, [userData]);
  
  // Get companion-specific data for radar chart
  const getCompanionMetrics = (id: CompanionId) => {
    const companion = companionData.find(c => c.id === id);
    if (!companion) return null;
    
    // Calculate metrics (0-100 scale)
    const totalInteractionScore = Math.min(100, ((companion.interactionTime || 0) / 600) * 100); // Max at 10 hours
    const affinityScore = Math.min(100, (companion.affinity / 100) * 100); // Max at 100 affinity
    const sessionScore = Math.min(100, (companion.sessions / 50) * 100); // Max at 50 sessions
    const goalScore = Math.min(100, (companion.goals / 20) * 100); // Max at 20 goals
    const streakScore = Math.min(100, ((companion.streak || 0) / 14) * 100); // Max at 14-day streak
    
    return [
      { subject: 'Interaction Time', value: totalInteractionScore, fullMark: 100 },
      { subject: 'Affinity', value: affinityScore, fullMark: 100 },
      { subject: 'Sessions', value: sessionScore, fullMark: 100 },
      { subject: 'Goals', value: goalScore, fullMark: 100 },
      { subject: 'Streak', value: streakScore, fullMark: 100 }
    ];
  };
  
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };
  
  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart
          data={companionData}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#888888"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#888888"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "affinity") return [`${value} points`, "Affinity"];
              if (name === "sessions") return [`${value}`, "Sessions"];
              if (name === "goals") return [`${value}`, "Goals"];
              if (name === "interactionTime") return [formatMinutes(value as number), "Interaction Time"];
              return [value, name];
            }}
            contentStyle={{
              backgroundColor: colors.secondary,
              borderColor: colors.primary,
              fontSize: '12px'
            }}
          />
          <Legend 
            verticalAlign="top"
            height={36}
            iconSize={12}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Bar 
            dataKey="affinity" 
            name="Affinity" 
            fill={colors.primary} 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="sessions" 
            name="Sessions" 
            fill="#78C2AD" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="goals" 
            name="Goals" 
            fill="#F3969A" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      );
    } else {
      const metrics = getCompanionMetrics(companionId);
      
      return (
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={metrics || []}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "#4b5563" }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: "#4b5563" }}
            tickCount={5}
          />
          <Radar
            name="Metrics"
            dataKey="value"
            stroke={colors.primary}
            fill={`${colors.primary}40`}
            fillOpacity={0.6}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Score"]}
            contentStyle={{
              backgroundColor: colors.secondary,
              borderColor: colors.primary,
              fontSize: '12px'
            }}
          />
        </RadarChart>
      );
    }
  };
  
  // Find the primary companion's data
  const activeCompanion = companionData.find(c => c.id === companionId);
  
  return (
    <StatsCard
      title={title}
      companionId={companionId}
      className={className}
    >
      <div style={{ width: '100%', height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {chartType === 'radar' && activeCompanion && (
        <div className="text-center mt-4 text-sm font-[Halogen]" style={{ color: colors.text }}>
          <div className="mb-1">
            Affinity Level: <span className="font-bold">{activeCompanion.affinity}</span>
          </div>
          <div className="mb-1">
            Consecutive Days: <span className="font-bold">{activeCompanion.streak || 0}</span>
          </div>
          <div>
            Interaction Time: <span className="font-bold">{formatMinutes(activeCompanion.interactionTime || 0)}</span>
          </div>
        </div>
      )}
    </StatsCard>
  );
} 