import { Event, Chat, Message } from "@/types";

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Noite de Jazz ao Vivo",
    description: "Uma noite especial com os melhores músicos de jazz da cidade. Venha curtir boa música, drinks especiais e um ambiente aconchegante.",
    businessId: "b1",
    businessName: "Blue Note Bar",
    businessAvatar: undefined,
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
    ],
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    location: {
      address: "Rua Augusta, 1234 - São Paulo",
      latitude: -23.5505,
      longitude: -46.6333,
    },
    category: "music",
    likes: 142,
    isLiked: false,
    isSaved: false,
    distance: 1.2,
    comments: [],
  },
  {
    id: "2",
    title: "Festival de Comida de Rua",
    description: "Os melhores food trucks da cidade reunidos em um só lugar! Hambúrgueres, tacos, pizza, sobremesas e muito mais.",
    businessId: "b2",
    businessName: "Food Park SP",
    businessAvatar: undefined,
    images: [
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    ],
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    location: {
      address: "Parque Ibirapuera - São Paulo",
      latitude: -23.5875,
      longitude: -46.6576,
    },
    category: "food",
    likes: 89,
    isLiked: true,
    isSaved: true,
    distance: 2.5,
    comments: [],
  },
  {
    id: "3",
    title: "Corrida Noturna 5K",
    description: "Participe da nossa corrida noturna! Percurso iluminado, kit de corrida e medalha para todos os participantes.",
    businessId: "b3",
    businessName: "Run Club SP",
    businessAvatar: undefined,
    images: [
      "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800",
    ],
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: {
      address: "Parque Villa-Lobos - São Paulo",
      latitude: -23.5475,
      longitude: -46.7203,
    },
    category: "sports",
    likes: 234,
    isLiked: false,
    isSaved: false,
    distance: 3.8,
    comments: [],
  },
];

export const mockChats: Chat[] = [
  {
    id: "c1",
    contactId: "b1",
    contactName: "Blue Note Bar",
    contactAvatar: undefined,
    lastMessage: "Confirma presença para hoje à noite?",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    unreadCount: 1,
    isBusinessContact: true,
  },
  {
    id: "c2",
    contactId: "u1",
    contactName: "Maria Santos",
    contactAvatar: undefined,
    lastMessage: "Vamos juntos no evento de sexta?",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    isBusinessContact: false,
  },
];

export const mockMessages: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      chatId: "c1",
      senderId: "b1",
      text: "Oi! Tudo bem?",
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      isSent: false,
    },
    {
      id: "m2",
      chatId: "c1",
      senderId: "current",
      text: "Oi! Tudo ótimo, e você?",
      timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      isSent: true,
    },
    {
      id: "m3",
      chatId: "c1",
      senderId: "b1",
      text: "Confirma presença para hoje à noite?",
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isSent: false,
    },
  ],
};
