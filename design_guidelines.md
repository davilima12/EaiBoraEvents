# Design Guidelines: eai bora

## Architecture Decisions

### Authentication
**Auth Required**: Yes
- The app has explicit social features (users, posts, chat, comments)
- Backend API integration for event data, geolocation, and real-time chat
- Two user types: Individual users and Business accounts

**Implementation**:
- SSO with Apple Sign-In (iOS) and Google Sign-In
- Sign-up flow must distinguish between:
  - **Personal Account**: Individual users discovering events
  - **Business Account**: Companies posting events
- Login/signup screens with privacy policy & terms links
- Account screen includes:
  - Log out with confirmation alert
  - Delete account nested under Settings > Account > Delete with double confirmation

### Navigation Structure
**Root Navigation**: Tab Bar (4 tabs)
- **Feed**: Event posts from nearby businesses (Home icon)
- **Explore**: Search and filter events by distance/category (Search icon)
- **Chat**: Messages with users and businesses (Message Square icon)
- **Profile**: User profile, saved events, settings (User icon)
- **Floating Action Button (FAB)**: Create event post (only visible for business accounts, Plus icon)

## Screen Specifications

### 1. Feed Screen
**Purpose**: Main discovery feed showing nearby event posts in chronological order

**Layout**:
- Header: Transparent, custom header
  - Left: App logo "eai bora" in display font
  - Right: Filter button (Sliders icon) for distance/category
- Main content: ScrollView with infinite scroll
  - Event cards in Instagram-style format:
    - Photo/video carousel at top (swipeable)
    - Business profile picture + name + distance badge
    - Event title (bold, large)
    - Event date/time + location pin
    - Like button + comment count
    - Short description (3 lines max, expandable)
  - Pull-to-refresh functionality
- Safe area insets: 
  - Top: headerHeight + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

### 2. Explore Screen
**Purpose**: Search and filter events by location, date, and category

**Layout**:
- Header: Default navigation with integrated search bar
  - Search placeholder: "Buscar eventos..."
  - Right: Map view toggle (Map icon)
- Main content: Scrollable list
  - Category chips (horizontal scroll): Music, Food, Sports, Art, Nightlife
  - Distance slider: "Eventos até X km"
  - Grid view of event thumbnails (2 columns)
    - Event image with overlay gradient
    - Date badge (top-left corner)
    - Title and distance (bottom overlay)
- Safe area insets:
  - Top: Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

### 3. Chat Screen
**Purpose**: Real-time messaging between users and businesses

**Layout**:
- Header: Default navigation
  - Title: "Mensagens"
  - Right: New chat button (Edit icon)
- Main content: FlatList of conversations
  - Each conversation item:
    - Avatar (user or business logo)
    - Name
    - Last message preview (1 line)
    - Timestamp
    - Unread badge (if applicable)
  - Empty state: "Nenhuma conversa ainda"
- Safe area insets:
  - Top: Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

### 4. Chat Detail Screen (Modal Stack)
**Purpose**: Individual conversation thread

**Layout**:
- Header: Default navigation
  - Left: Back button
  - Title: Contact name
  - Right: Info button (More Vertical icon)
- Main content: Inverted FlatList (messages)
  - Message bubbles:
    - Sent: Right-aligned, primary color
    - Received: Left-aligned, gray
  - Input bar (floating at bottom):
    - Text input + attach button + send button
    - Keyboard-aware scrolling
- Safe area insets:
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.xl (keyboard offset)

### 5. Profile Screen
**Purpose**: User profile, saved events, and settings

**Layout**:
- Header: Transparent, custom header
  - Right: Settings button (Settings icon)
- Main content: ScrollView
  - Profile section:
    - Avatar (customizable, large circular)
    - Display name (editable)
    - Bio (for business accounts: category tags)
  - Tabs: "Salvos" | "Participando" (for users) OR "Meus Eventos" (for businesses)
  - Grid of event thumbnails (3 columns)
- Safe area insets:
  - Top: headerHeight + Spacing.xl
  - Bottom: tabBarHeight + Spacing.xl

### 6. Event Detail Screen (Modal)
**Purpose**: Full event information and RSVP

**Layout**:
- Header: Default navigation with large image header
  - Left: Close button (X icon)
  - Right: Share + Save buttons
- Main content: ScrollView
  - Hero image/video (full width)
  - Event title (large, bold)
  - Business info card (avatar, name, follow button)
  - Date/time section (Calendar icon)
  - Location section (Map Pin icon) with mini map preview
  - Description (full text)
  - "Tenho Interesse" button (primary, full-width, sticky)
  - Comments section (optional, expandable)
- Safe area insets:
  - Bottom: insets.bottom + Spacing.xl

### 7. Create Event Screen (Business Only, Modal)
**Purpose**: Businesses create event posts

**Layout**:
- Header: Default navigation
  - Left: Cancel (confirmation alert if form is dirty)
  - Title: "Novo Evento"
  - Right: Post button (disabled until form is valid)
- Main content: Scrollable form
  - Photo/video upload section (grid, max 10)
  - Event title input (required)
  - Date/time picker (required)
  - Location picker (map integration, required)
  - Category selector (chips)
  - Description textarea
- Safe area insets:
  - Top: Spacing.xl
  - Bottom: insets.bottom + Spacing.xl

## Design System

### Color Palette
- **Primary**: Vibrant purple (#7C3AED) - energy and nightlife
- **Secondary**: Electric blue (#3B82F6) - trust and connectivity
- **Accent**: Coral (#FF6B6B) - warmth and social interaction
- **Background**: Deep gray (#0F0F0F) for dark mode, White (#FFFFFF) for light mode
- **Surface**: #1A1A1A (dark) / #F5F5F5 (light)
- **Text Primary**: #FFFFFF (dark) / #0F0F0F (light)
- **Text Secondary**: #A3A3A3 (dark) / #737373 (light)
- **Success**: #10B981 (saved/attending)
- **Error**: #EF4444

### Typography
- **Display**: Bold, used for app logo and event titles (24-32pt)
- **Heading**: Semibold, used for section headers (18-20pt)
- **Body**: Regular, used for descriptions and content (14-16pt)
- **Caption**: Regular, used for metadata (12pt)

### Visual Design
- **Icons**: Feather icons from @expo/vector-icons for all UI elements
- **Event Cards**: Rounded corners (12px), subtle elevation
- **Buttons**: 
  - Primary action buttons: Full width, rounded (8px), primary color with white text
  - Secondary buttons: Outlined, same border radius
  - Icon buttons: No background, icon only
- **Floating Action Button** (Business accounts):
  - Position: Bottom-right corner
  - Size: 56x56px circular
  - Color: Primary gradient
  - Icon: Plus (white)
  - Shadow: shadowOffset {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2
- **Tab Bar**: 
  - Icons only (no labels)
  - Active state: Primary color
  - Inactive state: Text secondary color
- **Interaction Feedback**: All touchable elements use opacity change (activeOpacity: 0.7)

### Required Assets
1. **App Logo**: "eai bora" wordmark for header (generate with energetic, modern font)
2. **Event Category Icons** (8 custom icons):
   - Music (headphones)
   - Food & Drink (utensils)
   - Sports (activity)
   - Nightlife (moon)
   - Art & Culture (palette)
   - Networking (users)
   - Outdoors (sun)
   - Other (star)
3. **User Avatars** (6 preset options for personalization):
   - Vibrant gradient circles with initials
   - Abstract geometric patterns
   - Matching the purple/blue/coral color scheme
4. **Empty State Illustrations**:
   - No events nearby (location pin with dashed radius)
   - No saved events (bookmark with sparkles)
   - No messages (speech bubble with dots)

### Accessibility
- Minimum touch target: 44x44px
- Color contrast ratio: WCAG AA compliant (4.5:1 for text)
- Support for dynamic type (scalable fonts)
- Descriptive labels for screen readers on all interactive elements
- Alternative text for all event images