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

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for the animation
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Simple validation
    if (!username || !password) {
      setError("Veuillez remplir tous les champs")
      return
    }

    // Mock login logic
    const validCredentials = {
      serveur: { password: "serveur123", role: "serveur" },
      caissier: { password: "caissier123", role: "cashier" },
      cuisine: { password: "cuisine123", role: "kitchen" },
      admin: { password: "admin123", role: "admin" },
    }

    // Check if username exists
    const userKey = Object.keys(validCredentials).find((key) => key === username.toLowerCase())

    if (userKey) {
      const credentials = validCredentials[userKey as keyof typeof validCredentials]

      if (credentials.password === password) {
        localStorage.setItem("userRole", credentials.role)
        localStorage.setItem("username", username)
        localStorage.setItem("isLoggedIn", "true")

        // Redirect based on role
        switch (credentials.role) {
          case "server":
            router.push("/server")
            break
          case "cashier":
            router.push("/cachier")
            break
          case "kitchen":
            router.push("/kitchen")
            break
          case "admin":
            router.push("/admin") // Redirect admin to the original admin interface
            break
          default:
            router.push("/")
        }
      } else {
        setError("Mot de passe incorrect")
      }
    } else {
      setError("Nom d'utilisateur non reconnu")
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

