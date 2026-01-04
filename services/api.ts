import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccountType, PostType, CreateEventPayload, CreateEventResponse, ApiPost } from "@/types";

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

export interface UserSearchResult {
    id: number;
    name: string;
    email: string;
    user_type_id: number;
    user_profile_base64?: string;
    citie_id: number;
    state_id: number;
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

    async getUserProfile(userId?: number): Promise<any> {
        const token = await getAuthToken();

        if (!token) {
            throw new Error("Token não encontrado");
        }

        const url = userId ? `${API_URL}/user/profile/${userId}` : `${API_URL}/user/profile`;

        const response = await fetch(url, {
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

    async getAuthUser(): Promise<any> {
        const token = await getAuthToken();

        if (!token) {
            throw new Error("Token não encontrado");
        }

        const response = await fetch(`${API_URL}/user/auth-user`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Erro ao buscar dados do usuário");
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

    async logout(): Promise<void> {
        const token = await getAuthToken();

        if (token) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch (error) {
                console.warn('Error calling logout API:', error);
                // Continue with local cleanup even if API call fails
            }
        }

        // Clear the token from AsyncStorage
        await clearAuthToken();
    },

    async getPostTypes(): Promise<PostType[]> {
        const response = await fetch(`${API_URL}/post/post-type`, {
            method: "GET",
            headers: {
                Accept: "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao buscar categorias");
        }

        return data;
    },

    async createEvent(payload: CreateEventPayload, photoUris: string[]): Promise<CreateEventResponse> {
        const token = await getAuthToken();

        if (!token) {
            throw new Error("Token não encontrado");
        }

        const formData = new FormData();

        // Add photos to FormData
        for (let i = 0; i < photoUris.length; i++) {
            const uri = photoUris[i];
            const filename = uri.split('/').pop() || `media_${i}`;
            const match = /\.(\w+)$/.exec(filename);
            let type = match ? `image/${match[1]}` : 'image/jpeg';

            // Adjust mime type for videos
            if (filename.endsWith('.mp4')) {
                type = 'video/mp4';
            } else if (filename.endsWith('.mov')) {
                type = 'video/quicktime';
            }

            formData.append('photos[]', {
                uri,
                name: filename,
                type,
            } as any);
        }

        // Add other fields
        formData.append('type_post_id', payload.type_post_id.toString());
        formData.append('address', payload.address);
        formData.append('zip_code', payload.zip_code);
        formData.append('neighborhood', payload.neighborhood);
        formData.append('number', payload.number);
        formData.append('citie_id', payload.citie_id.toString());
        formData.append('state_id', payload.state_id.toString());
        formData.append('start_event', payload.start_event);
        formData.append('end_event', payload.end_event);
        formData.append('name', payload.name);
        if (payload.description) {
            formData.append('description', payload.description);
        }

        const response = await fetch(`${API_URL}/post/create`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao criar evento");
        }

        return data;
    },

    async getPosts(latitude?: number, longitude?: number, name?: string, typePostId?: number): Promise<ApiPost[]> {
        const token = await getAuthToken();

        // Build URL with query parameters if lat/lng provided
        let url = `${API_URL}/post`;
        const params = new URLSearchParams();
        console.log("latitude", latitude)
        if (latitude !== undefined && longitude !== undefined) {
            params.append('latitude', latitude.toString());
            params.append('longitude', longitude.toString());
        }

        if (name) {
            params.append('name', name);
        }

        if (typePostId !== undefined) {
            params.append('type_post_id', typePostId.toString());
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();
        // console.log(data[0])
        if (!response.ok) {
            throw new Error(data.message || "Erro ao buscar posts");
        }

        return data;
    },

    async getPostById(id: number): Promise<ApiPost> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/post/${id}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao buscar detalhes do post");
        }

        return data;
    },

    async likePost(postId: number): Promise<void> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/post/liked/${postId}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ type_like_id: 1 }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erro ao curtir post");
        }
    },

    async unlikePost(postId: number): Promise<void> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/post/removed-liked/${postId}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erro ao remover curtida");
        }
    },

    async commentOnPost(postId: number, text: string, replyToId?: number): Promise<void> {
        const token = await getAuthToken();
        const body: any = { comment: text };
        if (replyToId) {
            body.post_comment_id = replyToId;
        }

        const response = await fetch(`${API_URL}/post/comment/${postId}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erro ao comentar");
        }
    },
    async likeComment(commentId: number): Promise<void> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/post/liked-comment/${commentId}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao curtir comentário');
        }
    },

    async unlikeComment(commentId: number): Promise<void> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/post/liked-comment/${commentId}`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao remover curtida do comentário');
        }
    },



    async deleteComment(commentId: number): Promise<void> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/removed-comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao remover comentário');
        }
    },

    async searchUsers(name: string): Promise<UserSearchResult[]> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/user?search=${encodeURIComponent(name)}`, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao buscar usuários");
        }

        return data;
    },

    async followUser(followedId: number): Promise<any> {
        const token = await getAuthToken();
        const response = await fetch(`${API_URL}/user/follow`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ followed_id: followedId }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Erro ao seguir usuário");
        }

        return data;
    },
};
