export type AccountType = "personal" | "business";

export type MediaType = "image" | "video";

export interface MediaItem {
  type: MediaType;
  uri: string;
  thumbnail?: string;
  duration?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  avatar?: string;
  bio?: string;
  category?: string;
  description?: string;
  private?: boolean;
  latitude?: number;
  longitude?: number;
  following?: { id: number; name: string; user_profile_picture?: any }[];
  followers?: { id: number; name: string; user_profile_picture?: any }[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  businessId: string;
  businessName: string;
  businessAvatar?: string;
  images: string[];
  media: MediaItem[];
  date: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  category: EventCategory;
  likes: number;
  isLiked: boolean;
  isSaved: boolean;
  distance: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  contactId: string;
  contactName: string;
  contactAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isBusinessContact: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  isSent: boolean;
}

export type EventCategory =
  | "music"
  | "food"
  | "sports"
  | "nightlife"
  | "art"
  | "networking"
  | "outdoors"
  | "other";

export const EVENT_CATEGORIES: { id: EventCategory; label: string; icon: string }[] = [
  { id: "music", label: "Música", icon: "headphones" },
  { id: "food", label: "Gastronomia", icon: "coffee" },
  { id: "sports", label: "Esportes", icon: "activity" },
  { id: "nightlife", label: "Balada", icon: "moon" },
  { id: "art", label: "Arte", icon: "feather" },
  { id: "networking", label: "Networking", icon: "users" },
  { id: "outdoors", label: "Ar Livre", icon: "sun" },
  { id: "other", label: "Outros", icon: "star" },
];

// API Types for Event Creation
export interface PostType {
  id: number;
  name: string;
  icon: string;
}

export interface CreateEventPayload {
  photos: string[];
  type_post_id: number;
  address: string;
  zip_code: string;
  neighborhood: string;
  number: string;
  citie_id: number;
  state_id: number;
  start_event: string;
  end_event: string;
  name: string;
  description?: string;
}

export interface CreateEventResponse {
  id: number;
  name: string;
  description?: string;
  type_post_id: number;
  address: string;
  zip_code: string;
  neighborhood: string;
  number: string;
  citie_id: number;
  state_id: number;
  start_event: string;
  end_event: string;
  created_at: string;
  updated_at: string;
}

export interface ApiPostPhoto {
  id: number;
  post_id: number;
  path_photo: string;
  type: "image" | "video";
  created_at: string;
  updated_at: string;
}

export interface ApiPost {
  id: number;
  name: string;
  description: string;
  address: string;
  zip_code: string;
  neighborhood: string;
  number: string;
  citie_id: number;
  state_id: number;
  start_event: string;
  end_event: string;
  latitude: number | null;
  longitude: number | null;
  user: {
    id: number;
    name: string;
    user_profile_picture: string | null;
  };
  type_post: {
    id: number;
    name: string;
    icon: string;
  };
  photos: ApiPostPhoto[];
  like_post: any[]; // Define better if structure is known
  comments_chained: any[]; // Define better if structure is known
  distance: number | null;
}
