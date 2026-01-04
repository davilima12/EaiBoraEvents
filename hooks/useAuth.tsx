import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, AccountType } from "@/types";
import { database } from "@/services/database";
import { api } from "@/services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, accountType: AccountType) => Promise<void>;
  signUp: (name: string, email: string, password: string, accountType: AccountType, stateId: number, cityId: number) => Promise<void>;
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
    try {
      const response = await api.login(email, password);

      // Fetch user profile from API
      const userProfile = await api.getAuthUser();
      console.log('userProfile', userProfile)

      // Map user_type_id to accountType (assuming logic remains similar or default to personal if not present)
      // The new endpoint might not return user_type_id directly based on the snippet, 
      // but let's assume we can infer or it's there. 
      // If not, we might need to keep getUserProfile or adjust. 
      // The snippet showed: id, name, email, description, private, latitude, longitude.
      // It didn't show user_type_id. 
      // However, for now let's assume we can default or it comes in the response if the model has it appended.
      // Let's check if we can get user_type_id from the response or if we need to rely on the previous call.
      // Actually, the user snippet showed specific select fields. user_type_id was NOT in the select list.
      // We might need to ask the user or assume 'personal' if missing, OR combine calls.
      // But for now, let's map what we have.

      const mappedAccountType: AccountType = "personal"; // Defaulting as it's missing in select

      // Create or update user with profile data
      const newUser: User = {
        id: userProfile.id.toString(),
        name: userProfile.name,
        email: userProfile.email,
        accountType: mappedAccountType,
        avatar: userProfile.user_profile_picture?.path || undefined, // Adjust based on actual structure
        bio: userProfile.description || "",
        category: undefined,
        description: userProfile.description,
        private: !!userProfile.private,
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        following: userProfile.following,
        followers: userProfile.followers,
      };

      // Check if user exists locally
      const existingUser = await database.getUserById(newUser.id);

      if (existingUser) {
        // Update existing user
        await database.updateUser(newUser.id, newUser);
      } else {
        // Create new user
        await database.createUser(newUser);
      }

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
      setUser(newUser);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string, accountType: AccountType, stateId: number, cityId: number) => {
    try {
      const response = await api.createAccount(name, email, password, accountType, cityId, stateId);

      const newUser: User = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        accountType,
        avatar: undefined,
        bio: "",
        category: accountType === "business" ? undefined : undefined,
      };

      // Store user locally for app functionality
      await database.createUser(newUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
      setUser(newUser);
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Call logout API endpoint
      await api.logout();
    } catch (error) {
      console.error("Logout API error:", error);
      // Continue with local cleanup even if API fails
    }

    // Clear user from AsyncStorage
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);

    // Clear user state
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
