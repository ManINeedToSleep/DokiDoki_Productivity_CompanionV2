# DokiDoki Productivity Companion V2

<p align="center">
  <img src="public/images/characters/sprites/monika_casual_smile.png" alt="DokiDoki Productivity Companion" width="200">
</p>

A gamified productivity application with anime-inspired companions that help users stay focused, track progress, and achieve their goals through interactive features and personalized motivation.

## ✨ Features

- **Focus Timer**: Pomodoro-style productivity timer with customizable work/break intervals
- **AI-Powered Companions**: Virtual companions with distinct personalities that provide motivation and feedback
- **Interactive Chat System**: Real-time messaging with AI-powered responses that adapt to your interaction level
- **Goal Tracking**: Set and monitor short and long-term productivity goals
- **Achievement System**: Unlock achievements as you progress in your productivity journey
- **Statistics Dashboard**: Visualize your productivity patterns with detailed charts and metrics
- **Customizable Settings**: Personalize your experience to match your workflow

## 🚀 Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Authentication**: Firebase Authentication
- **Database**: Firestore
- **AI Integration**: OpenAI API
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## 📐 Architecture

The project follows a modular architecture with clear separation of concerns:

- **Firebase Layer**: Handles data persistence and authentication
- **Store Layer**: Manages application state using Zustand
- **UI Components**: Reusable React components for the user interface
- **Hooks**: Custom React hooks for shared functionality
- **AI Integration**: Services for handling companion personalities and responses

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/DokiDoki_Productivity_CompanionV2.git
cd DokiDoki_Productivity_CompanionV2
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Firebase and OpenAI credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
OPENAI_API_KEY=your_openai_api_key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📋 Key Components

### Companion System

The companion system provides virtual assistants with unique personalities:

- **Character Personas**: Each companion has distinct traits, preferences, and interaction styles
- **Affinity System**: Companions develop increasing affinity based on user interactions
- **Dynamic Responses**: AI-generated responses adapt to the conversation context and companion personality

### Focus Timer

The focus timer helps users maintain productivity:

- **Pomodoro Technique**: Alternating work and break intervals
- **Customizable Settings**: Adjust session duration, break length, and notification preferences
- **Statistics Tracking**: Records focus sessions for performance analysis
- **Companion Integration**: Companions provide encouragement during focus sessions

### Chat System

The chat system enables communication with companions:

- **Real-time Messaging**: Instant message delivery and responses
- **Context Awareness**: Maintains conversation flow and references
- **Token Management**: Optimized token usage for AI responses
- **Message Categories**: Structured response types for varied interactions

### Goal and Achievement System

The goal system helps users track their productivity objectives:

- **Custom Goals**: Create personalized productivity goals
- **Companion Goals**: Special goals suggested by companions
- **Progress Tracking**: Visual indicators of goal completion
- **Achievements**: Unlock rewards for reaching milestones

## 📈 State Management

The application uses Zustand for state management with Firebase integration:

- **Efficient Updates**: Batched database operations for improved performance
- **Offline Support**: Continued functionality during connection loss
- **Synchronization**: Bidirectional sync between client state and database
- **Modular Stores**: Separate stores for different domains (user, companion, goals, etc.)

## 🔒 Security

- **Authentication**: Secure user authentication via Firebase
- **Data Validation**: Input validation and sanitization
- **Firestore Rules**: Granular access control for database operations
- **Rate Limiting**: Prevents API abuse
- **Content Moderation**: Filters inappropriate content

## 🧪 Future Enhancements

- **Mobile App**: Native mobile applications for iOS and Android
- **Voice Interaction**: Talk directly to your companions
- **Additional Companions**: Expand the roster of available companions
- **Social Features**: Connect with friends and share achievements
- **Customizable Themes**: Additional visual themes and companion outfits

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Character designs inspired by visual novels
- OpenAI for AI capabilities
- Next.js team for the incredible framework
- The open-source community for various libraries and tools
