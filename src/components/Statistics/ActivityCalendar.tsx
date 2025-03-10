"use client";

import { useState, useEffect, useMemo } from 'react';
import StatsCard from '@/components/Common/Card/StatsCard';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { FocusSession } from '@/lib/firebase/user';
import { Timestamp } from '@/lib/firebase';

interface ActivityCalendarProps {
  title?: string;
  companionId?: CompanionId;
  recentSessions?: FocusSession[];
  className?: string;
  months?: number; // How many months to display (default: 3)
}

type ActivityDay = {
  date: string;
  count: number;
  duration: number;
  month?: string;
  dayOfMonth?: number;
};

export default function ActivityCalendar({
  title = "Activity Calendar",
  companionId = 'sayori',
  recentSessions = [],
  className = '',
  months = 3
}: ActivityCalendarProps) {
  const colors = getCharacterColors(companionId);
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [monthsData, setMonthsData] = useState<string[]>([]);
  
  useEffect(() => {
    // Create calendar data from sessions
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - months + 1);
    startDate.setDate(1); // Start from the first day of the month
    
    // Get list of month names
    const monthNames: string[] = [];
    const tempMonth = new Date(startDate);
    while (tempMonth <= today) {
      const monthName = tempMonth.toLocaleDateString(undefined, { month: 'short' });
      if (!monthNames.includes(monthName)) {
        monthNames.push(monthName);
      }
      tempMonth.setMonth(tempMonth.getMonth() + 1);
    }
    setMonthsData(monthNames);
    
    // Create a map of dates to track activity counts
    const activityMap = new Map<string, ActivityDay>();
    
    // Initialize all dates in our range with 0 count
    const tempDate = new Date(startDate);
    while (tempDate <= today) {
      const dateStr = tempDate.toISOString().split('T')[0];
      const month = tempDate.toLocaleDateString(undefined, { month: 'short' });
      const dayOfMonth = tempDate.getDate();
      
      activityMap.set(dateStr, { 
        date: dateStr, 
        count: 0, 
        duration: 0,
        month,
        dayOfMonth
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    // Fill in actual session data
    if (recentSessions && recentSessions.length > 0) {
      recentSessions.forEach(session => {
        const sessionDate = (session.startTime as Timestamp).toDate();
        const dateStr = sessionDate.toISOString().split('T')[0];
        
        // Only include sessions within our date range
        if (activityMap.has(dateStr)) {
          const existing = activityMap.get(dateStr)!;
          activityMap.set(dateStr, {
            ...existing,
            count: existing.count + 1,
            duration: existing.duration + session.duration
          });
        }
      });
    }
    
    // Convert map to array for rendering
    setActivityData(Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
  }, [recentSessions, months]);
  
  const getIntensityStyle = (count: number) => {
    if (count === 0) return { backgroundColor: '#f3f4f6' };
    if (count === 1) return { backgroundColor: `${colors.primary}30` };
    if (count === 2) return { backgroundColor: `${colors.primary}50` };
    if (count === 3) return { backgroundColor: `${colors.primary}70` };
    if (count === 4) return { backgroundColor: `${colors.primary}90` };
    return { backgroundColor: colors.primary };
  };
  
  const formatMinutes = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Organize the calendar data by weeks and months
  const calendarStructure = useMemo(() => {
    if (!activityData.length) return { byMonth: {} };
    
    // Create an organized structure by month and day
    const byMonth: Record<string, ActivityDay[][]> = {};
    
    // Initialize the months
    monthsData.forEach(month => {
      byMonth[month] = [];
    });
    
    // Filter and organize data by month
    const monthData: Record<string, ActivityDay[]> = {};
    
    // Group days by month
    activityData.forEach(day => {
      if (!day.month) return;
      
      if (!monthData[day.month]) {
        monthData[day.month] = [];
      }
      monthData[day.month].push(day);
    });
    
    // Organize each month's data into weeks
    Object.entries(monthData).forEach(([month, days]) => {
      if (!days.length) return;
      
      // Sort days by date
      days.sort((a, b) => a.date.localeCompare(b.date));
      
      // Find the first day of the month to determine its day of week
      const firstDay = days[0];
      const firstDate = new Date(firstDay.date);
      const startDayOfWeek = firstDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
      
      // Create week arrays, padding the first week if needed
      let currentWeek: ActivityDay[] = [];
      
      // Add empty days for padding at the start of the month
      for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push({ date: '', count: -1, duration: 0 });
      }
      
      // Add all days from the month
      days.forEach(day => {
        currentWeek.push(day);
        
        // Start a new week when we reach Sunday
        const dayDate = new Date(day.date);
        if (dayDate.getDay() === 6) { // Saturday is the last day of the week
          byMonth[month].push([...currentWeek]);
          currentWeek = [];
        }
      });
      
      // Add the last partial week if it exists
      if (currentWeek.length > 0) {
        // Pad with empty days to complete the week
        while (currentWeek.length < 7) {
          currentWeek.push({ date: '', count: -1, duration: 0 });
        }
        byMonth[month].push(currentWeek);
      }
    });
    
    return { byMonth };
  }, [activityData, monthsData]);
  
  // Day names for header
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <StatsCard
      title={title}
      companionId={companionId}
      className={className}
    >
      <div className="pb-4">
        {/* Month-wise Calendar Layout */}
        <div className="grid grid-cols-3 gap-6">
          {monthsData.map((month) => (
            <div key={month} className="flex flex-col">
              {/* Month Header */}
              <div className="text-center mb-2 font-[Riffic] text-sm" style={{ color: colors.text }}>
                {month}
              </div>
              
              {/* Days of Week Headers */}
              <div className="grid grid-cols-7 mb-1">
                {dayNames.map((day, idx) => (
                  <div key={`${month}-${day}-${idx}`} className="text-xs text-center text-gray-500 font-[Halogen]">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="flex flex-col gap-1">
                {calendarStructure.byMonth[month]?.map((week, weekIdx) => (
                  <div key={`${month}-week-${weekIdx}`} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIdx) => (
                      <div 
                        key={`${month}-day-${weekIdx}-${dayIdx}`}
                        className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs ${
                          day.count < 0 ? 'opacity-0' : ''
                        }`}
                        style={day.count >= 0 ? {
                          ...getIntensityStyle(Math.min(day.count, 5))
                        } : {}}
                        title={day.date ? `${formatDate(day.date)}: ${day.count} sessions (${formatMinutes(day.duration)})` : ''}
                      >
                        <span style={{ color: day.count > 0 ? colors.text : 'inherit' }}>
                          {day.dayOfMonth || ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex justify-end gap-4 mt-6 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
            <span>None</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${colors.primary}30` }}></div>
            <span>1 session</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${colors.primary}70` }}></div>
            <span>2-3 sessions</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors.primary }}></div>
            <span>4+ sessions</span>
          </div>
        </div>
      </div>
    </StatsCard>
  );
} 