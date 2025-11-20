import * as SQLite from "expo-sqlite";
import { Event, Chat, Message, User } from "@/types";

const DB_NAME = "eaibora.db";

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error("Database not initialized");

    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        accountType TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        category TEXT,
        latitude REAL,
        longitude REAL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        businessId TEXT NOT NULL,
        businessName TEXT NOT NULL,
        businessAvatar TEXT,
        images TEXT NOT NULL,
        media TEXT,
        date TEXT NOT NULL,
        address TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        category TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (businessId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS event_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(eventId, userId),
        FOREIGN KEY (eventId) REFERENCES events(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS event_saves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        eventId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(eventId, userId),
        FOREIGN KEY (eventId) REFERENCES events(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        eventId TEXT NOT NULL,
        userId TEXT NOT NULL,
        userName TEXT NOT NULL,
        userAvatar TEXT,
        text TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (eventId) REFERENCES events(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        userId1 TEXT NOT NULL,
        userId2 TEXT NOT NULL,
        lastMessage TEXT,
        lastMessageTime TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(userId1, userId2),
        FOREIGN KEY (userId1) REFERENCES users(id),
        FOREIGN KEY (userId2) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chatId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        text TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chatId) REFERENCES chats(id),
        FOREIGN KEY (senderId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS message_read_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        readAt TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(messageId, userId),
        FOREIGN KEY (messageId) REFERENCES messages(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
      CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
      CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chatId, createdAt);
      CREATE INDEX IF NOT EXISTS idx_comments_event ON comments(eventId, createdAt);
    `);
  }

  async createUser(user: User): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    await this.db.runAsync(
      `INSERT INTO users (id, name, email, accountType, avatar, bio, category, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.id, user.name, user.email, user.accountType, user.avatar || null, user.bio || null, 
       user.category || null, null, null]
    );
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.db) throw new Error("Database not initialized");
    
    const result = await this.db.getFirstAsync<User>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    
    return result || null;
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error("Database not initialized");
    
    const result = await this.db.getFirstAsync<User>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    
    return result || null;
  }

  async updateUserLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    await this.db.runAsync(
      "UPDATE users SET latitude = ?, longitude = ? WHERE id = ?",
      [latitude, longitude, userId]
    );
  }

  async updateUser(userId: string, updates: { name?: string; bio?: string; avatar?: string; category?: string }): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push("name = ?");
      values.push(updates.name);
    }
    if (updates.bio !== undefined) {
      fields.push("bio = ?");
      values.push(updates.bio);
    }
    if (updates.avatar !== undefined) {
      fields.push("avatar = ?");
      values.push(updates.avatar);
    }
    if (updates.category !== undefined) {
      fields.push("category = ?");
      values.push(updates.category);
    }
    
    if (fields.length === 0) return;
    
    values.push(userId);
    await this.db.runAsync(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
  }

  async createEvent(event: Omit<Event, "likes" | "isLiked" | "isSaved" | "comments" | "distance">): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    await this.db.runAsync(
      `INSERT INTO events (id, title, description, businessId, businessName, businessAvatar, 
        images, media, date, address, latitude, longitude, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event.id, event.title, event.description, event.businessId, event.businessName,
       event.businessAvatar || null, JSON.stringify(event.images), JSON.stringify(event.media),
       event.date, event.location.address, event.location.latitude, event.location.longitude, event.category]
    );
  }

  async getEvents(userId: string, userLat?: number, userLon?: number): Promise<Event[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    const events = await this.db.getAllAsync<any>(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM event_likes WHERE eventId = e.id) as likes,
        EXISTS(SELECT 1 FROM event_likes WHERE eventId = e.id AND userId = ?) as isLiked,
        EXISTS(SELECT 1 FROM event_saves WHERE eventId = e.id AND userId = ?) as isSaved
       FROM events e
       ORDER BY e.createdAt DESC`,
      [userId, userId]
    );

    return events.map((e) => {
      const images = JSON.parse(e.images);
      const media = e.media ? JSON.parse(e.media) : images.map((uri: string) => ({
        type: "image" as const,
        uri,
      }));
      
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        businessId: e.businessId,
        businessName: e.businessName,
        businessAvatar: e.businessAvatar,
        images,
        media,
        date: e.date,
        location: {
          address: e.address,
          latitude: e.latitude,
          longitude: e.longitude,
        },
        category: e.category,
        likes: e.likes,
        isLiked: Boolean(e.isLiked),
        isSaved: Boolean(e.isSaved),
        comments: [],
        distance: userLat && userLon ? this.calculateDistance(userLat, userLon, e.latitude, e.longitude) : 0,
      };
    });
  }

  async getEventById(eventId: string, userId: string): Promise<Event | null> {
    if (!this.db) throw new Error("Database not initialized");
    
    const e = await this.db.getFirstAsync<any>(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM event_likes WHERE eventId = e.id) as likes,
        EXISTS(SELECT 1 FROM event_likes WHERE eventId = e.id AND userId = ?) as isLiked,
        EXISTS(SELECT 1 FROM event_saves WHERE eventId = e.id AND userId = ?) as isSaved
       FROM events e
       WHERE e.id = ?`,
      [userId, userId, eventId]
    );

    if (!e) return null;

    const comments = await this.getComments(eventId);
    const images = JSON.parse(e.images);
    const media = e.media ? JSON.parse(e.media) : images.map((uri: string) => ({
      type: "image" as const,
      uri,
    }));

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      businessId: e.businessId,
      businessName: e.businessName,
      businessAvatar: e.businessAvatar,
      images,
      media,
      date: e.date,
      location: {
        address: e.address,
        latitude: e.latitude,
        longitude: e.longitude,
      },
      category: e.category,
      likes: e.likes,
      isLiked: Boolean(e.isLiked),
      isSaved: Boolean(e.isSaved),
      comments,
      distance: 0,
    };
  }

  async toggleLike(eventId: string, userId: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    
    const liked = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM event_likes WHERE eventId = ? AND userId = ?",
      [eventId, userId]
    );

    if (liked && liked.count > 0) {
      await this.db.runAsync(
        "DELETE FROM event_likes WHERE eventId = ? AND userId = ?",
        [eventId, userId]
      );
      return false;
    } else {
      await this.db.runAsync(
        "INSERT INTO event_likes (eventId, userId) VALUES (?, ?)",
        [eventId, userId]
      );
      return true;
    }
  }

  async toggleSave(eventId: string, userId: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");
    
    const saved = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM event_saves WHERE eventId = ? AND userId = ?",
      [eventId, userId]
    );

    if (saved && saved.count > 0) {
      await this.db.runAsync(
        "DELETE FROM event_saves WHERE eventId = ? AND userId = ?",
        [eventId, userId]
      );
      return false;
    } else {
      await this.db.runAsync(
        "INSERT INTO event_saves (eventId, userId) VALUES (?, ?)",
        [eventId, userId]
      );
      return true;
    }
  }

  async getSavedEvents(userId: string): Promise<Event[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    const events = await this.db.getAllAsync<any>(
      `SELECT e.*, 
        (SELECT COUNT(*) FROM event_likes WHERE eventId = e.id) as likes,
        EXISTS(SELECT 1 FROM event_likes WHERE eventId = e.id AND userId = ?) as isLiked,
        1 as isSaved
       FROM events e
       INNER JOIN event_saves es ON e.id = es.eventId
       WHERE es.userId = ?
       ORDER BY es.createdAt DESC`,
      [userId, userId]
    );

    return events.map((e) => {
      const images = JSON.parse(e.images);
      const media = e.media ? JSON.parse(e.media) : images.map((uri: string) => ({
        type: "image" as const,
        uri,
      }));
      
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        businessId: e.businessId,
        businessName: e.businessName,
        businessAvatar: e.businessAvatar,
        images,
        media,
        date: e.date,
        location: {
          address: e.address,
          latitude: e.latitude,
          longitude: e.longitude,
        },
        category: e.category,
        likes: e.likes,
        isLiked: Boolean(e.isLiked),
        isSaved: true,
        comments: [],
        distance: 0,
      };
    });
  }

  async addComment(eventId: string, userId: string, userName: string, userAvatar: string | undefined, text: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const id = Math.random().toString(36).substring(7);
    await this.db.runAsync(
      "INSERT INTO comments (id, eventId, userId, userName, userAvatar, text) VALUES (?, ?, ?, ?, ?, ?)",
      [id, eventId, userId, userName, userAvatar || null, text]
    );
  }

  async getComments(eventId: string): Promise<Array<{ id: string; userId: string; userName: string; userAvatar?: string; text: string; timestamp: string }>> {
    if (!this.db) throw new Error("Database not initialized");
    
    const comments = await this.db.getAllAsync<any>(
      "SELECT * FROM comments WHERE eventId = ? ORDER BY createdAt DESC",
      [eventId]
    );

    return comments.map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.userName,
      userAvatar: c.userAvatar,
      text: c.text,
      timestamp: c.createdAt,
    }));
  }

  async getOrCreateChat(userId1: string, userId2: string): Promise<string> {
    if (!this.db) throw new Error("Database not initialized");
    
    const [user1, user2] = [userId1, userId2].sort();
    
    const existing = await this.db.getFirstAsync<{ id: string }>(
      "SELECT id FROM chats WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)",
      [user1, user2, user2, user1]
    );

    if (existing) return existing.id;

    const chatId = Math.random().toString(36).substring(7);
    await this.db.runAsync(
      "INSERT INTO chats (id, userId1, userId2) VALUES (?, ?, ?)",
      [chatId, user1, user2]
    );

    return chatId;
  }

  async getChats(userId: string): Promise<Chat[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    const chats = await this.db.getAllAsync<any>(
      `SELECT c.*, 
        CASE WHEN c.userId1 = ? THEN u2.name ELSE u1.name END as contactName,
        CASE WHEN c.userId1 = ? THEN u2.avatar ELSE u1.avatar END as contactAvatar,
        CASE WHEN c.userId1 = ? THEN c.userId2 ELSE c.userId1 END as contactId,
        (SELECT COUNT(*) FROM messages m 
         LEFT JOIN message_read_status mrs ON m.id = mrs.messageId AND mrs.userId = ?
         WHERE m.chatId = c.id AND m.senderId != ? AND mrs.id IS NULL) as unreadCount
       FROM chats c
       INNER JOIN users u1 ON c.userId1 = u1.id
       INNER JOIN users u2 ON c.userId2 = u2.id
       WHERE c.userId1 = ? OR c.userId2 = ?
       ORDER BY c.lastMessageTime DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );

    return chats.map((c) => ({
      id: c.id,
      contactId: c.contactId,
      contactName: c.contactName,
      contactAvatar: c.contactAvatar,
      lastMessage: c.lastMessage || "",
      timestamp: c.lastMessageTime || c.createdAt,
      unreadCount: c.unreadCount,
    }));
  }

  async sendMessage(chatId: string, senderId: string, text: string): Promise<Message> {
    if (!this.db) throw new Error("Database not initialized");
    
    const id = Math.random().toString(36).substring(7);
    const timestamp = new Date().toISOString();
    
    await this.db.runAsync(
      "INSERT INTO messages (id, chatId, senderId, text, createdAt) VALUES (?, ?, ?, ?, ?)",
      [id, chatId, senderId, text, timestamp]
    );

    await this.db.runAsync(
      "UPDATE chats SET lastMessage = ?, lastMessageTime = ? WHERE id = ?",
      [text, timestamp, chatId]
    );

    return {
      id,
      chatId,
      senderId,
      text,
      timestamp,
      isSent: true,
    };
  }

  async getMessages(chatId: string): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized");
    
    const messages = await this.db.getAllAsync<any>(
      "SELECT * FROM messages WHERE chatId = ? ORDER BY createdAt ASC",
      [chatId]
    );

    return messages.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      text: m.text,
      timestamp: m.createdAt,
      isSent: true,
    }));
  }

  async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const unreadMessages = await this.db.getAllAsync<{ id: string }>(
      `SELECT m.id FROM messages m
       LEFT JOIN message_read_status mrs ON m.id = mrs.messageId AND mrs.userId = ?
       WHERE m.chatId = ? AND m.senderId != ? AND mrs.id IS NULL`,
      [userId, chatId, userId]
    );

    for (const msg of unreadMessages) {
      await this.db.runAsync(
        "INSERT OR IGNORE INTO message_read_status (messageId, userId) VALUES (?, ?)",
        [msg.id, userId]
      );
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async seedMockData(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");
    
    const eventCount = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM events"
    );

    if (eventCount && eventCount.count > 0) return;

    const mockEvents = [
      {
        id: "1",
        title: "Noite de Jazz ao Vivo",
        description: "Uma noite especial com os melhores músicos de jazz da cidade.",
        businessId: "mock-business-1",
        businessName: "Blue Note Bar",
        images: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"],
        media: [
          {
            type: "video" as const,
            uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800",
          },
          {
            type: "image" as const,
            uri: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800",
          },
        ],
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          address: "Rua Augusta, 1234 - São Paulo",
          latitude: -23.5505,
          longitude: -46.6333,
        },
        category: "music" as const,
      },
      {
        id: "2",
        title: "Festival de Comida de Rua",
        description: "Os melhores food trucks da cidade reunidos em um só lugar!",
        businessId: "mock-business-2",
        businessName: "Food Park SP",
        images: ["https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800"],
        media: [
          {
            type: "video" as const,
            uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            thumbnail: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
          },
          {
            type: "image" as const,
            uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
          },
        ],
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          address: "Parque Ibirapuera - São Paulo",
          latitude: -23.5875,
          longitude: -46.6576,
        },
        category: "food" as const,
      },
      {
        id: "3",
        title: "Corrida Noturna 5K",
        description: "Participe da nossa corrida noturna!",
        businessId: "mock-business-3",
        businessName: "Run Club SP",
        images: ["https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800"],
        media: [
          {
            type: "image" as const,
            uri: "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800",
          },
          {
            type: "video" as const,
            uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=800",
          },
        ],
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: {
          address: "Parque Villa-Lobos - São Paulo",
          latitude: -23.5475,
          longitude: -46.7203,
        },
        category: "sports" as const,
      },
    ];

    for (const event of mockEvents) {
      await this.createEvent(event);
    }

    const chatCount = await this.db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM chats"
    );

    if (chatCount && chatCount.count === 0) {
      const mockChats = [
        {
          id: "chat-1",
          userId1: "mock-user",
          userId2: "mock-business-1",
          messages: [
            {
              id: "msg-1",
              senderId: "mock-business-1",
              text: "Olá! Obrigado pelo interesse no nosso evento de jazz!",
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "msg-2",
              senderId: "mock-user",
              text: "Oi! Ainda tem ingressos disponíveis?",
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "msg-3",
              senderId: "mock-business-1",
              text: "Sim! Temos ingressos disponíveis. Você pode reservar pelo nosso site.",
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
          ],
        },
        {
          id: "chat-2",
          userId1: "mock-user",
          userId2: "mock-business-2",
          messages: [
            {
              id: "msg-4",
              senderId: "mock-business-2",
              text: "Bora pro festival de comida de rua? 🎉",
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "msg-5",
              senderId: "mock-user",
              text: "Com certeza! Que horas começa?",
              createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "msg-6",
              senderId: "mock-business-2",
              text: "Começa às 11h e vai até às 22h. Teremos mais de 30 food trucks!",
              createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
            },
          ],
        },
        {
          id: "chat-3",
          userId1: "mock-user",
          userId2: "mock-business-3",
          messages: [
            {
              id: "msg-7",
              senderId: "mock-user",
              text: "Primeira vez participando! Preciso levar algo específico?",
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "msg-8",
              senderId: "mock-business-3",
              text: "Bem-vindo! Leve roupa confortável, tênis adequado e uma garrafa d'água.",
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
            },
          ],
        },
      ];

      for (const chat of mockChats) {
        const lastMessage = chat.messages[chat.messages.length - 1];
        
        await this.db.runAsync(
          `INSERT INTO chats (id, userId1, userId2, lastMessage, lastMessageTime) 
           VALUES (?, ?, ?, ?, ?)`,
          [chat.id, chat.userId1, chat.userId2, lastMessage.text, lastMessage.createdAt]
        );

        for (const message of chat.messages) {
          await this.db.runAsync(
            "INSERT INTO messages (id, chatId, senderId, text, createdAt) VALUES (?, ?, ?, ?, ?)",
            [message.id, chat.id, message.senderId, message.text, message.createdAt]
          );
        }
      }
    }
  }
}

export const database = new DatabaseService();
