# Doki Doki Productivity Companion Chat System

This document provides instructions for setting up and using the OpenAI-powered companion chat system.

## Setup Instructions

### 1. Environment Variables

Copy the `.env.local.template` file to `.env` and add your API keys:

```bash
cp .env.local.template .env
```

Then edit the `.env` file to add your OpenAI API key:

```
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

**Important**: Note that the OpenAI key is now a server-side variable (no NEXT_PUBLIC_ prefix) for better security.

You can get an OpenAI API key from [OpenAI's website](https://platform.openai.com/account/api-keys).

### 2. Firebase Setup

Ensure your Firebase project has the correct security rules for the chat subcollection. Add these rules to your Firestore:

```
// Rules for chat subcollection
match /users/{userId}/chats/{chatId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

// Rules for settings subcollection (for chat usage limits)
match /users/{userId}/settings/{settingId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

### 3. Install Dependencies

Make sure you have all necessary dependencies installed:

```bash
npm install openai
```

## Usage Instructions

### Daily Message Limits

By default, the chat system limits users to 50 messages per day. You can adjust this limit in the `.env` file:

```
NEXT_PUBLIC_MAX_DAILY_MESSAGES=50
```

### Security Implementation

This chat system uses a secure approach:

- OpenAI API calls are made from your secure server-side API routes
- Your API key is never exposed to the client
- All requests are authenticated through Next.js API routes

### Content Moderation

The system includes content moderation to prevent:

- NSFW content
- Self-harm and violence discussions
- Out-of-character requests ("You're an AI" type prompts)

The moderation uses OpenAI's moderation API with a fallback to keyword filtering if the API is unavailable.

### Affinity Level and Responses

Each companion's responses are influenced by their affinity level with the user:

- **Levels 1-2**: Brief, casual responses (new acquaintance)
- **Levels 3-5**: Friendly, slightly longer responses (becoming friends)
- **Levels 6-8**: Detailed, caring responses (close friends)
- **Levels 9-10**: In-depth, personalized responses (best friends)

Affinity increases through interactions and completing sessions/goals.

### Character Personality

Each character has distinct traits and speaking styles based on their personalities from Doki Doki Literature Club:

- **Sayori**: Cheerful, energetic, supportive, sometimes scatterbrained
- **Natsuki**: Tsundere, blunt, passionate, easily flustered
- **Yuri**: Intelligent, formal, elegant, sometimes anxious
- **Monika**: Confident, analytical, ambitious, direct

## Fallback Mechanism

If the OpenAI API is unavailable, the system will fall back to a simpler response system with pre-written character-specific messages. 