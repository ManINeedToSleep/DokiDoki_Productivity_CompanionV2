# User Data Structure

## Base User Info
typescript
interface UserBase {
uid: string;
email: string;
displayName: string;
createdAt: Timestamp;
lastLogin: Timestamp;
}

## Settings
typescript
interface UserSettings {
selectedCompanion: 'sayori' | 'yuri' | 'natsuki' | 'monika';
timerSettings: {
workDuration: number; // in minutes
shortBreakDuration: number;
longBreakDuration: number;
autoStartBreaks: boolean;
autoStartPomodoros: boolean;
};
notifications: {
enabled: boolean;
reminderFrequency: 'low' | 'medium' | 'high';
soundEnabled: boolean;
companionVoiceEnabled: boolean;
};
theme: {
background: string;
music: 'lofi' | 'ddlc' | 'ambient' | 'none';
volume: number;
};
}

## Statistics
typescript:UserData_Test.md
interface UserStats {
totalFocusTime: number; // in minutes
weeklyStreak: number;
longestStreak: number;
averageDailyFocus: number;
taskCompletionRate: number;
lastActiveDate: Timestamp;
dailyStats: {
[date: string]: {
focusTime: number;
completedPomodoros: number;
completedTasks: number;
}
};
}

## Companion Data
typescript:UserData_Test.md
interface CompanionProgress {
[companionId: string]: {
affinityLevel: number;
totalInteractionTime: number;
unlockedSprites: string[];
unlockedBackgrounds: string[];
lastInteraction: Timestamp;
specialEvents: {
[eventId: string]: {
triggered: boolean;
date: Timestamp;
}
};
gifts: {
[giftId: string]: {
received: boolean;
date: Timestamp;
}
};
}
}

## Achievements
typescript:UserData_Test.md
interface UserAchievements {
[achievementId: string]: {
unlocked: boolean;
progress: number;
maxProgress: number;
unlockedAt: Timestamp | null;
}
}

## Goals
typescript:UserData_Test.md
interface UserGoals {
daily: {
targetFocusTime: number;
targetPomodoros: number;
completed: boolean;
progress: number;
};
weekly: {
targetFocusTime: number;
targetPomodoros: number;
completed: boolean;
progress: number;
};
companionChallenges: {
[challengeId: string]: {
type: string;
target: number;
progress: number;
completed: boolean;
expiresAt: Timestamp;
}
};
}

## Complete User Document
```typescript:UserData_Test.md
interface UserDocument {
  base: UserBase;
  settings: UserSettings;
  stats: UserStats;
  companions: CompanionProgress;
  achievements: UserAchievements;
  goals: UserGoals;
  version: number;  // For future schema migrations
}
```

## Firebase Collection Structure
```
/users
  /{userId}
    - base
    - settings
    - stats
    - companions
    - achievements
    - goals
    - version

/companionDialogue
  /{companionId}
    /{dialogueId}
      - text
      - conditions
      - responses

/achievements
  /{achievementId}
    - title
    - description
    - requirements
    - rewards

/events
  /{eventId}
    - type
    - requirements
    - dialogue
    - rewards
```
