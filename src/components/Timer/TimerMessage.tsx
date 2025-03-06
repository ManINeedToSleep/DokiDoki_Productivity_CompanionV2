import React, { useEffect, useState, useRef } from 'react';
import { TimerMessageProps } from './types';
import DialogueNotification from '@/components/Common/Notifications/DialogueNotification';
import { 
  getSessionCompleteDialogue,
  getCompanionDialogue
} from '@/lib/firebase/dialogue';

const TimerMessage: React.FC<TimerMessageProps> = ({ 
  message, 
  timerState,
  companionId,
  mood = 'happy',
  affinity = 50,
  sessionDuration = 0,
  consecutiveDays = 0,
  onClose
}) => {
  const [dialogueMessage, setDialogueMessage] = useState<string>('');
  const prevTimerStateRef = useRef<string | null>(null);
  
  useEffect(() => {
    // If there's already a specific message passed, use that instead
    if (message) {
      setDialogueMessage(message);
      return;
    }
    
    // Only log when timer state changes
    const timerStateChanged = prevTimerStateRef.current !== timerState;
    if (timerStateChanged && process.env.NODE_ENV === 'development') {
      console.log("Timer state changed to:", timerState);
      console.log("Dialogue parameters:", {
        companionId,
        mood,
        affinity,
        sessionDuration,
        consecutiveDays
      });
    }
    
    // Update the previous timer state
    prevTimerStateRef.current = timerState;
    
    // Otherwise, generate a message based on timer state
    let generatedMessage = '';
    
    try {
      switch (timerState) {
        case 'idle':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            undefined, 
            'encouragement'
          );
          // If we got a default fallback, use a specific message instead
          if (generatedMessage.includes("[Default")) {
            generatedMessage = "Ready to start focusing? I'm here to help you stay on track!";
          }
          if (timerStateChanged && process.env.NODE_ENV === 'development') {
            console.log("Idle message:", generatedMessage);
          }
          break;
        
        case 'running':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            { focusStats: { currentSessionTime: Math.floor(sessionDuration / 60), dailyFocusTime: 0, breaksTaken: 0 } }, 
            'session.during'
          );
          // If we got a default fallback, use a specific message instead
          if (generatedMessage.includes("[Default")) {
            generatedMessage = "You're doing great! Keep focusing, I believe in you!";
          }
          if (timerStateChanged && process.env.NODE_ENV === 'development') {
            console.log("Running message:", generatedMessage);
          }
          break;
        
        case 'paused':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            undefined, 
            'encouragement'
          );
          if (timerStateChanged && process.env.NODE_ENV === 'development') {
            console.log("Paused message:", generatedMessage);
          }
          break;
          
        case 'completed':
          generatedMessage = getSessionCompleteDialogue(
            companionId,
            mood,
            affinity,
            { 
              currentSessionTime: Math.floor(sessionDuration / 60), 
              dailyFocusTime: Math.floor(sessionDuration / 60), 
              breaksTaken: 0, 
              totalSessions: 1 
            }
          );
          if (timerStateChanged && process.env.NODE_ENV === 'development') {
            console.log("Completed message:", generatedMessage);
          }
          break;
        
        case 'break':
          generatedMessage = getCompanionDialogue(
            companionId, 
            mood, 
            affinity, 
            consecutiveDays, 
            { isBreakTime: true }, 
            'session.break'
          );
          if (timerStateChanged && process.env.NODE_ENV === 'development') {
            console.log("Break message:", generatedMessage);
          }
          break;
      }
    } catch (error) {
      console.error("Error generating dialogue message:", error);
      generatedMessage = "Let's focus on your work!";
    }
    
    setDialogueMessage(
      generatedMessage && !generatedMessage.includes("[Default") 
        ? generatedMessage 
        : "Let's do our best today!"
    );
  }, [timerState, message, companionId, mood, affinity, sessionDuration, consecutiveDays]);
  
  if (!dialogueMessage) return null;
  
  return (
    <DialogueNotification
      companionId={companionId}
      message={dialogueMessage}
      onClose={onClose}
      position="bottom-right"
    />
  );
};

export default TimerMessage; 