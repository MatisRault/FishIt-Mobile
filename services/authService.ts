import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_DE_BASE_URL } from '@/app/(auth)/config';

// Interface pour typer les données utilisateur (si vous utilisez TypeScript)
interface User {
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
}

// Création d'une instance axios configurée
const api = axios.create({
  baseURL: API_DE_BASE_URL,
});

// Intercepteur pour ajouter automatiquement le token aux requêtes
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Service d'authentification
 */
export const AuthService = {
  /**
   * Enregistre un nouvel utilisateur
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erreur lors de l\'inscription');
      }
      throw new Error('Erreur réseau');
    }
  },

  /**
   * Connecte un utilisateur
   */
  async login(credentials: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post('/login', credentials);
      
      // Sauvegarde le token dans AsyncStorage
      if (response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Identifiants invalides');
      }
      throw new Error('Erreur réseau');
    }
  },

  /**
   * Récupère l'utilisateur actuellement connecté
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token invalide ou expiré - on déconnecte l'utilisateur
          await AsyncStorage.removeItem('token');
        }
        throw new Error(error.response?.data?.message || 'Erreur d\'authentification');
      }
      throw new Error('Erreur réseau');
    }
  },

  /**
   * Met à jour les informations de l'utilisateur
   */
  async updateUser(updates: UpdateUserData): Promise<User> {
    try {
      const response = await api.put('/users', updates);
      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      }
      throw new Error('Erreur réseau');
    }
  },

  /**
   * Supprime le compte utilisateur
   */
  async deleteUser(): Promise<void> {
    try {
      await api.delete('/users');
      // On nettoie le token après suppression
      await AsyncStorage.removeItem('token');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
      throw new Error('Erreur réseau');
    }
  },

  /**
   * Déconnecte l'utilisateur (supprime le token)
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
  },

  /**
   * Vérifie si un utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  }
};