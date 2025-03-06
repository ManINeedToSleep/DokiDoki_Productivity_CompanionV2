import { Goal } from '@/lib/firebase/goals';

// Format date function
export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

// Get tomorrow's date as a string
export const getTomorrowDateString = () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error generating tomorrow's date:", error);
    // Return today's date as a fallback
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
};

// Check if a goal is system-generated (not created by the user)
export const isSystemGoal = (goal: Goal) => {
  // If it has a companionId or is a daily/weekly/challenge goal that was auto-generated
  return !!goal.companionId || 
         (goal.type !== 'custom' && !goal.id.includes('user_'));
};

// Function to identify user-created goals
export const isUserCreatedGoal = (goal: Goal) => {
  return goal.type === 'custom' && goal.id.includes('user_');
}; 