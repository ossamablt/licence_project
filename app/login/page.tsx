"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { OlirabLogo } from "@/components/olirab-logo"
import { motion } from "framer-motion"
import axios, { AxiosError } from "axios"

// API URL Configuration - Easy to change in one place
const API_URL = "https://f8e1-105-111-15-81.ngrok-free.app"
// For CSRF endpoint when using Sanctum
const SANCTUM_CSRF_URL = API_URL.replace(/\/api$/, "") + "/sanctum/csrf-cookie"

// Configure axios defaults
axios.defaults.withCredentials = true // Important for CSRF cookie

// Type definitions for better error handling
interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

interface UserData {
  role: string;
  username?: string;
  // Add other user properties as needed
}

interface LoginResponse {
  token: string;
  user: UserData;
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if the user is already authenticated
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          // Verify the token with your backend
          const response = await axios.get<UserData>(`${API_URL}/user`, {
            headers: { Authorization: `Bearer ${token}` }
          })

          if (response.data) {
            // Get user role from the response
            const userRole = response.data.role || "unknown"
            redirectUserByRole(userRole)
          }
        } catch (err) {
          console.error("Authentication check failed:", err)
          // Token is invalid or expired, clear it
          localStorage.removeItem("token")
          localStorage.removeItem("userRole")
          localStorage.removeItem("username")
          localStorage.removeItem("isLoggedIn")
        }
      }

      // Simulate loading time for the animation
      setTimeout(() => {
        setLoading(false)
      }, 2000)
    }

    checkAuth()
  }, [router])

  const redirectUserByRole = (role: string) => {
    // Convert roles to lowercase to ensure consistency
    const normalizedRole = role.toLowerCase()

    switch (normalizedRole) {
      case "serveur":
        router.push("/server")
        break
      case "caissier":
        router.push("/cashier")
        break
      case "cuisine":
        router.push("/kitchen")
        break
      case "admin":
        router.push("/admin")
        break
      default:
        router.push("/")
        console.warn("Unknown role:", role)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Simple validation
    if (!username || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    try {
      // First, get the CSRF cookie from Laravel
      await axios.get(SANCTUM_CSRF_URL)

      // Now, send login request - using both potential field name formats
      // Laravel typically uses 'email' rather than 'username', but we'll include both
      const response = await axios.post<LoginResponse>(`${API_URL}/login`, {
        email: username, // Try email as the field name
        name: username,  // Try name as the field name
        username: username, // Original username field
        password: password
      })

      // Check if response contains required data
      if (!response.data || !response.data.token) {
        throw new Error("Réponse du serveur invalide")
      }

      // Store token and user info
      const { token, user } = response.data

      if (!user || !user.role) {
        throw new Error("Informations d'utilisateur incomplètes")
      }

      localStorage.setItem("token", token)
      localStorage.setItem("userRole", user.role)
      localStorage.setItem("username", username)
      localStorage.setItem("isLoggedIn", "true")

      // Set token for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

      // Redirect based on role
      redirectUserByRole(user.role)
    } catch (err) {
      console.error("Login error:", err)

      // Type assertion for better error handling
      const error = err as Error | AxiosError<ApiErrorResponse>

      if (axios.isAxiosError(error)) {
        // Log the detailed error information for debugging
        console.log("Response data:", error.response?.data)
        console.log("Request data:", error.config?.data)

        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response?.data?.message) {
          setError(error.response.data.message)
        } else if (error.response?.status === 401) {
          setError("Nom d'utilisateur ou mot de passe incorrect")
        } else if (error.response?.status === 422) {
          // For validation errors, try to extract the first validation message
          const validationErrors = error.response?.data?.errors
          if (validationErrors && typeof validationErrors === 'object') {
            const firstError = Object.values(validationErrors)[0]
            if (Array.isArray(firstError) && firstError.length > 0) {
              setError(firstError[0])
            } else {
              setError("Données de connexion invalides")
            }
          } else {
            setError("Données de connexion invalides")
          }
        } else if (error.response) {
          setError(`Erreur du serveur (${error.response.status})`)
        } else if (error.request) {
          // The request was made but no response was received
          setError("Aucune réponse du serveur. Vérifiez votre connexion internet ou l'URL de l'API.")
        } else {
          // Something happened in setting up the request that triggered an Error
          setError(error.message || "Une erreur s'est produite lors de la connexion")
        }
      } else {
        // Handle non-Axios errors
        setError((error as Error).message || "Une erreur inattendue s'est produite")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <OlirabLogo size="lg" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8"
        >
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full bg-[#FF6B35]"
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "loop",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-neutral-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <motion.div
            className="flex justify-center mb-4"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <OlirabLogo size="lg" />
          </motion.div>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Connectez-vous pour accéder à votre espace</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
              />
            </div>

            {error && <div className="text-sm text-red-500 text-center">{error}</div>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-[#FF6B35] hover:bg-[#e55a29]">
              Se connecter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}