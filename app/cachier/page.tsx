"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OlirabLogo } from "@/components/olirab-logo"
import CashierInterface from "@/components/cashier-interface"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

export default function CashierPage() {
  const router = useRouter()
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    //if (!isLoggedIn || userRole !== "cashier") {
    // router.push("/login")
    // return
    //7}

    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50/50">
        <div className="text-center">
          <OlirabLogo size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-blue-50/50 text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <OlirabLogo size="sm" />
            <h1 className="text-xl font-bold">Interface Caissier</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Bienvenue</span>
              <Avatar className="h-8 w-8 border-2 border-orange-100">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="bg-orange-100 text-orange-700">CA</AvatarFallback>
              </Avatar>
              <span className="font-medium">Caissier</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirmation(true)} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Cashier Interface */}
      <div className="flex-1 overflow-auto p-4">
        <CashierInterface />
      </div>

      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
