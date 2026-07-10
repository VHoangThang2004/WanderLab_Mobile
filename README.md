# WanderLab Mobile

WanderLab Mobile is a comprehensive travel and social application built with React Native and Expo. It empowers users to plan itineraries, connect with fellow travelers, share their journeys, and discover new destinations, with a special focus on interactive experiences.

## 🚀 Features

- **Authentication & User Profiles:** Secure login and registration using Supabase, with customizable user profiles.
- **Smart Itineraries (AI Powered):** Create and manage detailed travel plans. Potentially leverages AI for smart suggestions and markdown-based rich text rendering.
- **Travel Diary & Community:** Share your experiences with travel diary posts (images, text). Explore posts from other users, interact, and follow suggested users.
- **Interactive Map:** Features a custom interactive Vietnam Map component for exploring destinations.
- **Real-time Messaging:** Chat with other travelers and friends.
- **Notifications:** Stay up-to-date with community interactions and itinerary updates.

## 🛠️ Tech Stack

- **Framework:** [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Language:** TypeScript
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) for global state and [@tanstack/react-query](https://tanstack.com/query/latest) for server state/caching.
- **Navigation:** [React Navigation](https://reactnavigation.org/) (Bottom Tabs, Native Stack, Drawer)
- **Backend & Auth:** [Supabase](https://supabase.com/)
- **Media:** `expo-image`, `expo-image-picker`, `expo-document-picker`
- **Other Key Libraries:** `react-native-webrtc`, `react-native-markdown-display`, `react-native-reanimated`

## 📁 Project Structure

```text
src/
├── api/          # API calls and services (Supabase, etc.)
├── components/   # Reusable UI components (PostCards, Maps, Modals, etc.)
├── data/         # Mock data or static data assets
├── hooks/        # Custom React hooks
├── lib/          # Third-party library configurations (e.g., supabase client)
├── locales/      # Internationalization files
├── navigation/   # Navigation configuration and routers
├── screens/      # Screen components grouped by feature (auth, home, diary, explore, etc.)
├── stores/       # Zustand state stores
├── theme/        # Styling constants, colors, and typography
└── types/        # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Expo CLI
- Supabase Project (for backend services)

### Installation

1. Clone the repository and navigate to the project folder:
   ```bash
   cd WanderLab_Mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the root directory.
   - Add your Supabase URL and Anon Key (and any other necessary API keys):
     ```env
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

### Running the App

Start the Expo development server:

```bash
npm start
```
- Press `a` to open in an Android emulator.
- Press `i` to open in an iOS simulator (requires macOS).
- Scan the QR code with the Expo Go app on your physical device.

## 📄 License

This project is licensed under the [LICENSE](./LICENSE) file included in the repository.
