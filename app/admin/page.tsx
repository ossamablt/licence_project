"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios, { AxiosError } from "axios"

// API URL Configuration - Easy to change in one place
const API_URL = "https://f8e1-105-111-15-81.ngrok-free.app/api";

// Type definitions for better error handling
interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface UserData {
  id: number;
  role: string;
  userName: string;
  employe_id: number;
}

interface LoginResponse {
  token: string; // Required for token-based authentication
  user: UserData;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Attach token and verify with the backend
          const response = await axios.get<UserData>(`${API_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data) {
            redirectUserByRole(response.data.role);
          }
        } catch (err) {
          console.error("Authentication check failed:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("username");
          localStorage.removeItem("isLoggedIn");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const redirectUserByRole = (role: string) => {
    const normalizedRole = role.toLowerCase();
    switch (normalizedRole) {
      case "serveur":
        router.push("/server");
        break;
      case "caissier":
        router.push("/cashier");
        break;
      case "cuisine":
        router.push("/kitchen");
        break;
      case "admin":
        router.push("/admin");
        break;
      default:
        router.push("/");
        console.warn("Unknown role:", role);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);

      // Send login request
      const response = await axios.post<LoginResponse>(`${API_URL}/login`, {
        "userName": username,
        "password": password,
      });

      if (!response.data || !response.data.token) {
        throw new Error("Réponse du serveur invalide");
      }

      const { token, user } = response.data;

      if (!user || !user.role) {
        throw new Error("Informations d'utilisateur incomplètes");
      }

      // Store token and user info
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("username", username);
      localStorage.setItem("isLoggedIn", "true");

      // Set token for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      redirectUserByRole(user.role);
    } catch (err) {
      console.error("Login error:", err);

      const error = err as Error | AxiosError<ApiErrorResponse>;

      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.response?.status === 401) {
          setError("Nom d'utilisateur ou mot de passe incorrect");
        } else if (error.response?.status === 422) {
          setError("Données de connexion invalides");
        } else if (error.response) {
          setError(`Erreur du serveur (${error.response.status})`);
        } else if (error.request) {
          setError("Aucune réponse du serveur. Vérifiez votre connexion internet.");
        } else {
          setError(error.message || "Une erreur s'est produite lors de la connexion");
        }
      } else {
        setError((error as Error).message || "Une erreur inattendue s'est produite");
      }
    } finally {
      setLoading(false);
    }
  };
}