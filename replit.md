# eai bora - Event Discovery Mobile App

## Overview

"eai bora" is a React Native mobile application built with Expo that connects users with local events. The app serves two distinct user types: individual users discovering nearby events and businesses posting events. It features a location-based feed, real-time chat, event search/filtering, and social interactions (likes, comments, saves).

The application uses a bottom tab navigation pattern with four main screens (Feed, Explore, Chat, Profile) and includes authentication flows supporting both personal and business accounts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Mobile Framework
- **React Native with Expo SDK 54**: Cross-platform mobile development framework
- **New Architecture Enabled**: Utilizes React Native's latest architecture for improved performance
- **React 19.1.0**: Latest React version with experimental compiler enabled

### Navigation Structure
- **React Navigation v7**: Native stack and bottom tab navigators
- **Four-Tab Bottom Navigation**: Feed, Explore, Chat, Profile
- **Modal Presentations**: Event details and event creation as modal screens
- **Authentication Guard**: Root navigator switches between authenticated (MainTabs) and unauthenticated (Auth) flows
- **Platform-Specific Blur Effects**: iOS uses BlurView for tab bar transparency, Android uses solid backgrounds

### State Management
- **React Context API**: Used for authentication state via `AuthProvider`
- **Local Component State**: React hooks (useState, useEffect) for screen-level state
- **No Global State Library**: Simple context-based approach without Redux/MobX

### Data Layer
- **expo-sqlite**: Local SQLite database for offline-first data storage
- **Database Schema**:
  - `users`: User accounts (personal and business)
  - `events`: Event listings with geolocation
  - `chats`: Chat conversations
  - `messages`: Chat messages
  - `likes`: Event likes tracking
  - `saves`: Saved events tracking
  - `comments`: Event comments
- **Mock Data Seeding**: Development database populated with sample events on initialization
- **AsyncStorage**: Persists user session (user ID) for authentication

### Location Services
- **expo-location**: Geolocation API for current position
- **Location Caching**: Stores current location in memory to reduce API calls
- **Distance Calculation**: Events include calculated distance from user's location
- **Permission Handling**: Requests foreground location permissions

### UI/UX Architecture
- **Design System**: Centralized theme with light/dark mode support
  - Colors: Primary (#7C3AED purple), Secondary (#3B82F6 blue), Accent (#FF6B6B red)
  - Spacing scale: xs(4), sm(8), md(12), lg(16), xl(20), 2xl(24), 3xl(32), 4xl(40)
  - Typography: h1-h4, body, small, link variants
  - Border radius: sm(8), md(12), lg(16), xl(24)
  - Elevation system: Four-level background colors for depth
- **Gesture Handling**: react-native-gesture-handler for smooth interactions
- **Animations**: react-native-reanimated for spring-based micro-interactions
- **Safe Areas**: react-native-safe-area-context for proper inset handling
- **Keyboard Management**: react-native-keyboard-controller for keyboard-aware scrolling

### Component Architecture
- **Themed Components**: `ThemedText`, `ThemedView` adapt to light/dark mode
- **Screen Wrappers**: `ScreenScrollView`, `ScreenFlatList`, `ScreenKeyboardAwareScrollView` handle safe area insets and styling
- **Reusable UI Elements**: Button, Card, EventCard, ChatPreviewCard, CategoryChip, EmptyState
- **Error Boundary**: Class-based error boundary for graceful error handling with restart functionality

### Image Handling
- **expo-image**: Optimized image component for better performance
- **expo-image-picker**: Camera and gallery access for event creation
- **Remote Images**: Events use Unsplash URLs for mock data

### Authentication Flow
- **Account Types**: Personal (event discovery) and Business (event posting)
- **Mock Authentication**: No real backend - creates users on-the-fly in local database
- **Session Persistence**: User ID stored in AsyncStorage
- **No SSO Implementation**: Design guidelines mention Apple/Google sign-in but not implemented

### Platform-Specific Considerations
- **iOS**: Transparent headers with blur, full-screen gestures
- **Android**: Solid backgrounds, edge-to-edge layout enabled, ripple effects
- **Web**: Fallback to standard ScrollView (KeyboardAwareScrollView incompatible)

### Development Environment
- **Replit Integration**: Custom dev script with proxy URL configuration for Replit environment
- **TypeScript**: Strict mode enabled with path aliases (@/* for root imports)
- **ESLint + Prettier**: Code quality and formatting enforcement
- **Module Resolution**: Babel plugin for @ alias resolution

## External Dependencies

### Core Libraries
- **@expo/vector-icons (Feather icons)**: Icon system throughout the app
- **@react-navigation**: Complete navigation solution (native-stack, bottom-tabs, elements)
- **react-native-reanimated**: High-performance animations
- **react-native-gesture-handler**: Gesture recognition
- **react-native-screens**: Native screen optimization

### Expo Modules
- **expo-sqlite**: SQLite database
- **expo-location**: Geolocation services
- **expo-image-picker**: Media selection
- **expo-blur**: iOS blur effects
- **expo-haptics**: Tactile feedback
- **expo-web-browser**: OAuth (planned but not implemented)
- **expo-splash-screen**: Launch screen management
- **expo-status-bar**: Status bar styling
- **expo-constants**: App configuration access
- **expo-font**: Custom font loading
- **expo-linking**: Deep linking support
- **expo-system-ui**: System UI customization

### Utilities
- **@react-native-async-storage/async-storage**: Key-value storage for session persistence
- **react-native-keyboard-controller**: Advanced keyboard handling
- **react-native-safe-area-context**: Safe area insets
- **react-native-worklets**: JavaScript worklets for animations

### No Backend API
- Application is fully client-side with local SQLite storage
- No REST API or GraphQL integration
- No real-time backend (chat is local-only)
- Location services are client-side only