"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OlirabLogo } from "@/components/olirab-logo"
import { motion } from "framer-motion"
import { User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    console.log("Login started...")

    if (!username || !password) {
      setError("Veuillez remplir tous les champs")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await api.post("/login", {
        "userName": username,
        "password": password,
      })
      if (response.status !== 200) {
        setError("Erreur de connexion")
        setIsSubmitting(false)
        return
      }



      let data = response.data




      console.log("Login successful:", response.data)

      localStorage.setItem("token", data.token)
      localStorage.setItem("userRole", data.user.role)
      localStorage.setItem("username", data.user.userName)
      localStorage.setItem("isLoggedIn", "true")

      // Role-based redirection
      switch (data.user.role) {
        case "Serveur":
          router.push("/serveur")
          break
        case "Caissier":
          router.push("/cachier")
          break
        case "Cuisinier":
          router.push("/kitchen")
          break
        case "Gérant":
          router.push("/admin")
          break
        default:
          router.push("/")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError(err.message || "Erreur de connexion")
      }
      setIsSubmitting(false)
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
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>

            {error && <div className="text-sm text-red-500 text-center">{error}</div>}
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-[#FF6B35] hover:bg-[#e55a29]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  )
}
