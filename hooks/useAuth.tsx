import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, AccountType } from "@/types";
import { database } from "@/services/database";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, accountType: AccountType) => Promise<void>;
  signUp: (name: string, email: string, password: string, accountType: AccountType) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@eaibora:user_id";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userId = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (userId) {
        const userData = await database.getUserById(userId);
        if (userData) {
          setUser(userData);
        } else {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string, accountType: AccountType) => {
    let existingUser = await database.getUserByEmail(email);
    
    if (!existingUser) {
      const mockUser: User = {
        id: Math.random().toString(36).substring(7),
        name: accountType === "business" ? "Bar do João" : "João Silva",
        email,
        accountType,
        avatar: undefined,
        bio: accountType === "business" ? "O melhor bar da região!" : "Adoro eventos ao ar livre",
        category: accountType === "business" ? "food" : undefined,
      };
      
      await database.createUser(mockUser);
      existingUser = mockUser;
    }
    
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, existingUser.id);
    setUser(existingUser);
  };

  const signUp = async (name: string, email: string, password: string, accountType: AccountType) => {
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      accountType,
      avatar: undefined,
      bio: "",
      category: accountType === "business" ? undefined : undefined,
    };
    
    await database.createUser(newUser);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
    setUser(newUser);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;
    
    try {
      await database.updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
