export type AccountType = "personal" | "business";

export interface User {
  id: string;
  name: string;
  email: string;
  accountType: AccountType;
  avatar?: string;
  bio?: string;
  category?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  businessId: string;
  businessName: string;
  businessAvatar?: string;
  images: string[];
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
