import { Goal } from '@/lib/firebase/goals';
import { Timestamp } from '@/lib/firebase';

// Helper function to safely convert a deadline to a Date object
export const getDeadlineDate = (deadline: Timestamp | Date | number | string | undefined): Date => {
  if (!deadline) return new Date(8640000000000000); // Far future date if no deadline
  
  // If it's a Timestamp object with toDate method
  if (deadline && typeof (deadline as Timestamp).toDate === 'function') {
    return (deadline as Timestamp).toDate();
  }
  
  // If it's already a Date object
  if (deadline instanceof Date) {
    return deadline;
  }
  
  // If it's a timestamp number
  if (typeof deadline === 'number') {
    return new Date(deadline);
  }
  
  // If it's a string representation of a date
  if (typeof deadline === 'string') {
    return new Date(deadline);
  }
  
  // Fallback
  return new Date();
};

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