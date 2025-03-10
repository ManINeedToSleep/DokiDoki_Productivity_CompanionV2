"use client";

import { useMemo } from 'react';
import StatsCard from '@/components/Common/Card/StatsCard';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { FocusSession } from '@/lib/firebase/user';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface FocusTrendChartProps {
  title?: string;
  companionId?: CompanionId;
  recentSessions?: FocusSession[];
  className?: string;
  timeRange?: 'week' | 'month' | 'year';
  chartType?: 'line' | 'area';
  showSessions?: boolean;
  height?: number;
}

export default function FocusTrendChart({
  title = "Focus Time Trend",
  companionId = 'sayori',
  recentSessions = [],
  className = '',
  timeRange = 'week',
  chartType = 'line',
  showSessions = true,
  height = 300
}: FocusTrendChartProps) {
  const colors = getCharacterColors(companionId);
  
  // Process data based on timeRange
  const chartData = useMemo(() => {
    if (!recentSessions || recentSessions.length === 0) {
      // Return placeholder data if no sessions
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return daysOfWeek.map(day => ({
        name: day,
        minutes: 0,
        sessions: 0
      }));
    }
    
    // Calculate start date based on time range
    const startDate = new Date();
    
    // Configure date grouping based on selected time range
    if (timeRange === 'week') {
      // Start from beginning of current week (Monday)
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'month') {
      // Start from beginning of current month
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else { // year
      // Start from beginning of current year
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    // Create map for each time period
    const dataMap = new Map<string, { minutes: number, sessions: number }>();
    
    // Initialize periods
    if (timeRange === 'week') {
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      daysOfWeek.forEach(day => {
        dataMap.set(day, { minutes: 0, sessions: 0 });
      });
    } else if (timeRange === 'month') {
      // Initialize all days of the month (up to 31)
      for (let i = 1; i <= 31; i++) {
        dataMap.set(i.toString().padStart(2, '0'), { minutes: 0, sessions: 0 });
      }
    } else { // year
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach(month => {
        dataMap.set(month, { minutes: 0, sessions: 0 });
      });
    }
    
    // Group sessions by date
    recentSessions.forEach(session => {
      const sessionDate = session.startTime.toDate();
      
      // Skip sessions before our time range
      if (sessionDate < startDate) return;
      
      let key: string;
      
      if (timeRange === 'week') {
        // Use day name for week view
        key = sessionDate.toLocaleDateString(undefined, { weekday: 'short' });
      } else if (timeRange === 'month') {
        // Use day of month for month view
        key = sessionDate.getDate().toString().padStart(2, '0');
      } else { // year
        // Use month name for year view
        key = sessionDate.toLocaleDateString(undefined, { month: 'short' });
      }
      
      // Some browsers might return localized day/month names, ensure we have matching keys
      if (!dataMap.has(key) && timeRange === 'week') {
        // Try to match with our predefined days
        const dayIndex = sessionDate.getDay();
        // Convert 0-based (Sunday = 0) to our format (Monday = 0)
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        key = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][adjustedIndex];
      }
      
      if (dataMap.has(key)) {
        const current = dataMap.get(key)!;
        dataMap.set(key, {
          minutes: current.minutes + Math.floor(session.duration / 60),
          sessions: current.sessions + 1
        });
      }
    });
    
    // Convert map to array and sort if needed
    let result: { name: string; minutes: number; sessions: number }[];
    
    if (timeRange === 'week') {
      // For weeks, maintain day order
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      result = daysOfWeek.map(day => ({
        name: day,
        minutes: dataMap.get(day)?.minutes || 0,
        sessions: dataMap.get(day)?.sessions || 0
      }));
    } else if (timeRange === 'month') {
      // For months, sort by day number
      result = Array.from(dataMap.entries())
        .filter(([key]) => !isNaN(parseInt(key)))
        .map(([key, value]) => ({
          name: key,
          minutes: value.minutes,
          sessions: value.sessions
        }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    } else { // year
      // For years, maintain month order
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      result = months.map(month => ({
        name: month,
        minutes: dataMap.get(month)?.minutes || 0,
        sessions: dataMap.get(month)?.sessions || 0
      }));
    }
    
    return result;
  }, [recentSessions, timeRange]);
  
  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#888888"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left" 
            stroke="#888888"
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Minutes', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#888888' }
            }} 
          />
          {showSessions && (
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#888888"
              tick={{ fontSize: 12 }}
              label={{ 
                value: 'Sessions', 
                angle: 90, 
                position: 'insideRight',
                style: { fontSize: 12, fill: '#888888' }
              }}
            />
          )}
          <Tooltip
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
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="minutes" 
            name="Minutes" 
            stroke={colors.primary} 
            activeDot={{ r: 6, fill: colors.primary }}
            strokeWidth={2}
          />
          {showSessions && (
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="sessions" 
              name="Sessions" 
              stroke="#78C2AD"
              activeDot={{ r: 6, fill: "#78C2AD" }}
              strokeWidth={2}
            />
          )}
        </LineChart>
      );
    } else {
      return (
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            stroke="#888888"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#888888"
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Minutes', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 12, fill: '#888888' }
            }} 
          />
          <Tooltip
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
          <Area 
            type="monotone" 
            dataKey="minutes" 
            name="Minutes" 
            stroke={colors.primary} 
            fill={`${colors.primary}40`}
            activeDot={{ r: 6, fill: colors.primary }}
            strokeWidth={2}
          />
        </AreaChart>
      );
    }
  };
  
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
    </StatsCard>
  );
} 