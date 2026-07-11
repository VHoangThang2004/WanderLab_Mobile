# Software Requirements Document (SRD) - WanderLab Mobile

## 1. Introduction
### 1.1 Purpose
This document provides a comprehensive overview of the software requirements for the **WanderLab Mobile** application. It serves as a guideline for developers, testers, and stakeholders to understand the system's functionalities, architecture, and constraints.

### 1.2 Scope
WanderLab Mobile is an AI-powered travel and social networking application. It empowers users to automatically generate personalized travel itineraries using Artificial Intelligence, share their travel experiences via diaries, interact with a community of travelers, and communicate through real-time messaging.

## 2. Overall Description
### 2.1 User Characteristics
The application is designed for travel enthusiasts, backpackers, and tourists who seek a convenient way to plan trips, discover new destinations, and connect with like-minded individuals.

### 2.2 Operating Environment
- **Platform:** Cross-platform (iOS and Android).
- **Framework:** React Native powered by Expo (SDK 54).
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage).

## 3. Functional Requirements (System Features)

### 3.1 User Authentication & Profile Management
- **Description:** Users can register, log in, and manage their personal profiles securely.
- **Requirements:**
  - Support Email/Password authentication via Supabase Auth.
  - Users can update their avatar, full name, bio, and travel preferences.
  - Secure session management and token handling.

### 3.2 AI-Powered Smart Itineraries
- **Description:** The core feature allowing users to generate automated travel plans.
- **Requirements:**
  - Users input destination, duration, budget, and specific interests.
  - The system utilizes AI services to generate a structured, day-by-day itinerary.
  - Users can edit, save, and share their itineraries with the community.
  - Markdown-based rich text rendering for detailed plan descriptions.

### 3.3 Travel Diary & Community Interaction
- **Description:** A social feed where users can share their journeys.
- **Requirements:**
  - Users can create "Diary Books" containing photos, locations, and text stories.
  - Users can browse a public feed of community posts and trending destinations.
  - Interactive features: Like, Comment, and Share posts.
  - Ability to follow other travelers and view their public itineraries.

### 3.4 Real-time Messaging & Friends
- **Description:** Direct communication between users.
- **Requirements:**
  - Users can search for others, send, and accept friend requests.
  - Real-time text messaging between friends utilizing Supabase Realtime subscriptions.
  - Message history persistence and unread indicators.

### 3.5 Interactive Map Exploration
- **Description:** Visual exploration of destinations and itineraries.
- **Requirements:**
  - Integration of interactive maps to display routes and points of interest.
  - Location-based suggestions for nearby attractions.

### 3.6 Notifications System
- **Description:** Keeps users updated on relevant activities.
- **Requirements:**
  - Real-time in-app notifications for friend requests, incoming messages, and post interactions.
  - Users can view a notification history and mark notifications as read.

## 4. Non-Functional Requirements

### 4.1 Performance
- Fast data fetching and aggressive caching utilizing `@tanstack/react-query`.
- Smooth UI transitions and animations powered by `react-native-reanimated` (targeting 60 FPS).
- Optimized image loading and caching using `expo-image`.

### 4.2 Security
- Row Level Security (RLS) policies implemented on the Supabase backend to ensure data privacy (e.g., users can only read their own private messages).
- Environment variables (`.env`) used to protect sensitive API keys.

### 4.3 Scalability & Reliability
- Global state management handled by `Zustand` for predictable state updates across complex application flows.
- Modular architecture allowing for easy integration of future features (e.g., payment gateways, booking services).

## 5. Technology Stack

- **Frontend Core:** React Native (0.81.5), Expo (SDK 54).
- **Navigation:** React Navigation v7 (Bottom Tabs, Native Stack, Drawer).
- **Language:** TypeScript (Strict typing for robustness).
- **State Management:** Zustand (Global State), TanStack React Query (Server State).
- **Backend as a Service (BaaS):** Supabase (Auth, Database, Storage, Realtime).
- **UI & Media:** `expo-image`, `expo-image-picker`, `react-native-markdown-display`, `expo-vector-icons`.
- **Advanced Features:** `react-native-webrtc` (Audio/Video ready).

## 6. Setup & Deployment

### 6.1 Local Development
1. Install dependencies: `npm install`
2. Configure `.env` with backend credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Run the development server: `npm start`

### 6.2 Production Build
The application is built using Expo Application Services (EAS).
- For Android (AAB):
  ```bash
  eas build -p android --profile production
  ```
- For iOS (IPA):
  ```bash
  eas build -p ios --profile production
  ```
