import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountType } from "@/types";

const API_URL = "http://192.168.15.3:8000/api";
const TOKEN_KEY = "@eaibora:auth_token";

interface State {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
    state_id: number;
}

interface CreateAccountResponse {
    user: {
        id: number;
        name: string;
        email: string;
        user_type_id: number;
        citie_id: number;
        state_id: number;
        created_at: string;
        updated_at: string;
    };
    token: string;
}

interface LoginResponse {
    user: {
        id: number;
        name: string;
        email: string;
        user_type_id: number;
        citie_id: number;
        state_id: number;
    };
    token: string;
}

// Token management functions
export const setAuthToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

export const clearAuthToken = async (): Promise<void> => {
    await AsyncStorage.removeItem(TOKEN_KEY);
};

export const api = {
    async login(email: string, password: string): Promise<LoginResponse> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao fazer login");
        }
        console.log(data)
        // Store the token
        if (data.token) {
            await setAuthToken(data.token);
        }

        return data;
    },

    async getUserProfile(): Promise<{
        id: number;
        name: string;
        email: string;
        user_type_id: number;
        citie_id: number;
        state_id: number;
    }> {
        const token = await getAuthToken();

        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await fetch(`${API_URL}/user/profile`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao buscar perfil");
        }

        return data;
    },

    async getStates(): Promise<State[]> {
        const response = await fetch(`${API_URL}/states`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao buscar estados");
        }

        return data;
    },

    async getCities(stateId: number): Promise<City[]> {
        const response = await fetch(`${API_URL}/cities?state_id=${stateId}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao buscar cidades");
        }

        return data;
    },

    async createAccount(
        name: string,
        email: string,
        password: string,
        accountType: AccountType,
        citieId: number,
        stateId: number
    ): Promise<CreateAccountResponse> {
        const user_type_id = accountType === "personal" ? 1 : 2;

        const response = await fetch(`${API_URL}/user-sample/create-account`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                name,
                email,
                password,
                user_type_id,
                citie_id: citieId,
                state_id: stateId,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao criar conta");
        }

        // Store the token from account creation
        if (data.token) {
            await setAuthToken(data.token);
        }

        return data;
    },
};
