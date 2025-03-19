# Doki Doki Focus: Firebase & Zustand Implementation Documentation

## Overview

We've implemented a comprehensive state management system for Doki Doki Focus using Zustand, designed to work seamlessly with Firebase. This implementation significantly reduces database operations by batching updates and provides a responsive user experience through client-side state management.

## Directory Structure

```
src/
└── lib/
    ├── firebase/
    │   ├── achievements.ts
    │   ├── companion.ts
    │   ├── dialogue.ts
    │   ├── goals.ts
    │   └── user.ts
    └── stores/
        ├── achievementsStore.ts
        ├── companionStore.ts
        ├── goalsStore.ts
        ├── index.ts
        ├── README.md
        └── userStore.ts
```

## Firebase Layer (`src/lib/firebase/`)

The Firebase layer provides direct interaction with Firestore database. Each file handles a specific domain of the application:

### `user.ts`

Manages user data, focus sessions, and settings:

- **Key Interfaces**: `FocusSession`, `UserStats`, `UserDocument`
- **Key Functions**:
  - `createUserDocument`: Initializes a new user in Firestore
  - `getUserDocument`: Retrieves user data
  - `recordFocusSession`: Records a completed focus session
  - `updateFocusGoals`: Updates daily/weekly focus goals
  - `updateCompanionAffinity`: Updates companion affinity based on interaction

### `companion.ts`

Manages companion-related data:

- **Key Interfaces**: `CompanionData`, `CompanionPersonality`, `DialogueEvent`
- **Key Types**: `CompanionId`, `CompanionMood`
- **Key Functions**:
  - `getCompanionData`: Retrieves data for a specific companion
  - `updateCompanionAfterSession`: Updates companion stats after a focus session
  - `refreshCompanionMood`: Calculates and updates companion mood
  - `checkForDialogueEvents`: Checks for triggered dialogue events

### `dialogue.ts`

Manages dialogue content and retrieval:

- **Key Interfaces**: `DialogueEntry`, `DialogueConditions`, `DialogueContext`
- **Key Functions**:
  - `getCompanionDialogue`: Retrieves appropriate dialogue based on context
  - `getAchievementDialogue`: Gets dialogue for achievement unlocks
  - `getStreakDialogue`: Gets dialogue for streak milestones
  - `generateDialogueEvent`: Creates dialogue events based on triggers

### `goals.ts`

Manages focus goals:

- **Key Interface**: `Goal`
- **Key Functions**:
  - `createGoal`: Creates a new user-defined goal
  - `createCompanionGoal`: Creates a goal assigned by a companion
  - `updateGoalProgress`: Updates progress on a goal
  - `completeGoal`: Marks a goal as completed

### `achievements.ts`

Manages achievements:

- **Key Interface**: `Achievement`
- **Key Functions**:
  - `unlockAchievement`: Unlocks an achievement for a user
  - `applyAchievementReward`: Applies the reward for an achievement
  - `checkFocusAchievements`: Checks if any focus-related achievements should be unlocked
  - `checkStreakAchievements`: Checks if any streak-related achievements should be unlocked

## Zustand Stores (`src/lib/stores/`)

The Zustand stores provide client-side state management with optimized Firebase interactions:

### `userStore.ts`

Client-side management of user data:

- **Key Interfaces**: `UserState`, `PendingUpdate` (union type of all update types)
- **Key Features**:
  - Local state updates for immediate UI feedback
  - Batched Firebase updates via `syncWithFirebase`
  - Periodic syncing (every 5 minutes)
  - Force sync on page unload
  - Persistent storage via Zustand's persist middleware

```typescript
// Example usage
const { user, recordFocusSession } = useUserStore();

// Record a session (updates local state immediately)
recordFocusSession(user.base.uid, sessionData);
```

### `companionStore.ts`

Client-side management of companion data:

- **Key Interface**: `CompanionState`
- **Key Features**:
  - Manages companion data locally
  - Provides methods for companion interactions
  - Batches updates to Firebase
  - Handles companion dialogue retrieval

```typescript
// Example usage
const { companions, getGreeting } = useCompanionStore();

// Get a greeting from a companion
const greeting = await getGreeting(userId, 'sayori');
```

### `goalsStore.ts`

Client-side management of goals:

- **Key Interface**: `GoalsState`
- **Key Features**:
  - Local goal creation and updates
  - Progress tracking
  - Companion goal management
  - Batched Firebase updates

```typescript
// Example usage
const { goals, updateProgress } = useGoalsStore();

// Update progress on a goal
updateProgress(userId, goalId, minutesCompleted);
```

### `achievementsStore.ts`

Client-side management of achievements:

- **Key Interface**: `AchievementsState`
- **Key Features**:
  - Tracks unlocked achievements locally
  - Queues achievement checks
  - Batches Firebase updates

```typescript
// Example usage
const { checkFocus } = useAchievementsStore();

// Check for focus-related achievements
checkFocus(userId, totalMinutes, sessionMinutes, totalSessions);
```

### `index.ts`

Exports all stores and provides a combined sync hook:

- **Key Export**: `useSyncAllData`
- **Purpose**: Simplifies importing stores and setting up syncing

```typescript
// Example usage
import { useSyncAllData } from '@/lib/stores';

function App() {
  // Set up syncing for all stores
  useSyncAllData();
  
  return (/* ... */);
}
```

## Key Implementation Details

### Optimized Firebase Interactions

1. **Batched Updates**: Instead of sending each update to Firebase immediately, updates are queued and sent in batches.

2. **Periodic Syncing**: Updates are sent to Firebase every 5 minutes by default:

```typescript
const syncInterval = setInterval(() => {
  syncWithFirebase(uid);
}, 5 * 60 * 1000); // 5 minutes
```

3. **Force Sync on Exit**: Updates are forcibly synced when the user leaves the page:

```typescript
window.addEventListener('beforeunload', () => {
  syncWithFirebase(uid, true); // Force sync
});
```

### Local-First Updates

All stores implement a "local-first" approach:

1. Update local state immediately
2. Add the update to a pending queue
3. Sync the pending queue to Firebase periodically

Example from `userStore.ts`:

```typescript
updateFocusGoals: (uid, dailyGoal, weeklyGoal) => {
  set((state) => {
    if (!state.user) return state;
    
    return {
      user: {
        ...state.user,
        goals: {
          ...state.user.goals,
          dailyGoal: dailyGoal ?? state.user.goals.dailyGoal,
          weeklyGoal: weeklyGoal ?? state.user.goals.weeklyGoal,
        }
      },
      pendingUpdates: [
        ...state.pendingUpdates,
        { 
          type: 'updateFocusGoals', 
          uid, 
          dailyGoal, 
          weeklyGoal 
        }
      ]
    };
  });
}
```

### Type Safety

All stores use TypeScript for type safety:

1. **Union Types for Updates**: Each type of update has its own interface, combined into a union type:

```typescript
type PendingUpdate = 
  | PendingFocusGoalsUpdate 
  | PendingFocusSessionUpdate 
  | PendingCompanionUpdate
  | PendingSettingsUpdate
  | PendingGoalUpdate;
```

2. **Type Guards**: Type guards are used when processing updates:

```typescript
if (update.type === 'updateSettings' && update.updateType === 'timer') {
  const timerSettings = update.data as UserDocument['settings']['timerSettings'];
  await updateTimerSettingsFirebase(update.uid, timerSettings);
}
```

### Persistence

All stores use Zustand's persist middleware to save state to localStorage:

```typescript
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        pendingUpdates: state.pendingUpdates,
        lastSyncTime: state.lastSyncTime
      }),
    }
  )
);
```

## Technical Challenges Solved

1. **Type Safety with Nullable State**: Handled cases where state might be null:

```typescript
// In companionStore.ts
const updatedCompanions = state.companions ? {
  ...state.companions,
  [companionId]: companionData
} : { [companionId]: companionData } as Record<CompanionId, CompanionData>;
```

2. **Avoiding `any` Types**: Replaced `any` with specific union types:

```typescript
// In userStore.ts
data: UserDocument['settings']['timerSettings'] | UserDocument['settings']['theme'] | CompanionId;
```

3. **Handling Complex State Updates**: Implemented helper functions for complex state calculations:

```typescript
// In userStore.ts
function calculateUpdatedStats(currentStats: UserStats, newSession: FocusSession): UserStats {
  // Complex calculation logic
}
```

## Benefits of This Implementation

1. **Reduced Firebase Operations**: By batching updates, we significantly reduce the number of Firebase operations, potentially saving costs and improving performance.

2. **Improved User Experience**: Updates appear instantly in the UI, making the application feel more responsive.

3. **Offline Support**: Basic functionality works even when temporarily offline, with updates synced when connectivity is restored.

4. **Type Safety**: The entire implementation is type-safe, reducing the likelihood of runtime errors.

5. **Maintainability**: The code is organized by domain, making it easier to understand and maintain.

## Usage Guidelines

1. **Component Integration**:

```tsx
import { useUserStore, useSyncAllData } from '@/lib/stores';

function FocusTimer() {
  const { user, recordFocusSession } = useUserStore();
  useSyncAllData(); // Set up syncing
  
  const handleSessionComplete = (session) => {
    recordFocusSession(user.base.uid, session);
  };
  
  return (/* ... */);
}
```

2. **Initial Data Loading**:

```tsx
import { useUserStore } from '@/lib/stores';
import { auth } from '@/lib/firebase';

function App() {
  const { refreshUserData } = useUserStore();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await refreshUserData(user.uid);
      }
    });
    
    return unsubscribe;
  }, [refreshUserData]);
  
  return (/* ... */);
}
```

3. **Force Syncing**:

```tsx
import { useUserStore } from '@/lib/stores';

function SaveButton() {
  const { user, syncWithFirebase } = useUserStore();
  
  const handleSave = () => {
    syncWithFirebase(user.base.uid, true); // Force sync
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```