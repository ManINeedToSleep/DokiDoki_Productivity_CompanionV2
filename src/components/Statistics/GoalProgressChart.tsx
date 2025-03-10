"use client";

import StatsCard from '@/components/Common/Card/StatsCard';
import { CompanionId } from '@/lib/firebase/companion';
import { getCharacterColors } from '@/components/Common/CharacterColor/CharacterColor';
import { Goal } from '@/lib/firebase/goals';
import { 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface GoalProgressChartProps {
  title?: string;
  companionId?: CompanionId;
  goals?: Goal[];
  className?: string;
  chartType?: 'bar' | 'pie';
  height?: number;
}

export default function GoalProgressChart({
  title = "Goal Progress",
  companionId = 'sayori',
  goals = [],
  className = '',
  chartType = 'bar',
  height = 300
}: GoalProgressChartProps) {
  const colors = getCharacterColors(companionId);
  
  // Process goals data
  const getGoalsByType = () => {
    const result = [
      { name: 'Daily', completed: 0, total: 0 },
      { name: 'Weekly', completed: 0, total: 0 },
      { name: 'Challenge', completed: 0, total: 0 },
      { name: 'Custom', completed: 0, total: 0 }
    ];
    
    if (!goals || goals.length === 0) {
      return result; // Return empty data if no goals
    }
    
    // Count goals by type
    goals.forEach(goal => {
      const typeIndex = result.findIndex(item => item.name.toLowerCase() === goal.type);
      if (typeIndex >= 0) {
        result[typeIndex].total += 1;
        if (goal.completed) {
          result[typeIndex].completed += 1;
        }
      }
    });
    
    return result;
  };
  
  const getCompletionData = () => {
    if (!goals || goals.length === 0) {
      return [
        { name: 'Completed', value: 0 },
        { name: 'Remaining', value: 100 }
      ];
    }
    
    const completed = goals.filter(goal => goal.completed).length;
    const total = goals.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return [
      { name: 'Completed', value: completionRate },
      { name: 'Remaining', value: 100 - completionRate }
    ];
  };
  
  const goalsByType = getGoalsByType();
  const completionData = getCompletionData();
  
  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart
          data={goalsByType}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          barSize={30}
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
              if (name === "completed") return [`${value} goals`, "Completed"];
              return [`${value} goals`, "Total"];
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
            dataKey="completed" 
            name="Completed" 
            fill={colors.primary} 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="total" 
            name="Total" 
            fill="#d1d5db" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      );
    } else {
      return (
        <PieChart>
          <Pie
            data={completionData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            <Cell fill={colors.primary} />
            <Cell fill="#f3f4f6" />
          </Pie>
          <Tooltip
            formatter={(value) => [`${value}%`, "Percentage"]}
            contentStyle={{
              backgroundColor: colors.secondary,
              borderColor: colors.primary,
              fontSize: '12px'
            }}
          />
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconSize={12}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      );
    }
  };
  
  // Calculate completion stats
  const totalGoals = goals?.length || 0;
  const completedGoals = goals?.filter(g => g.completed)?.length || 0;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
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
      
      {chartType === 'bar' && (
        <div className="text-center mt-4">
          <span className="text-sm font-[Halogen] text-gray-700">
            {`You've completed ${completedGoals} of ${totalGoals} goals (${completionRate}%)`}
          </span>
        </div>
      )}
      
      {chartType === 'pie' && completedGoals > 0 && (
        <div className="text-center mt-4">
          <span className="text-sm font-[Halogen]" style={{ color: colors.text }}>
            {`${completedGoals} Goals Completed`}
          </span>
        </div>
      )}
    </StatsCard>
  );
} 