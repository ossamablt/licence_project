"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChefHat, CreditCard, Coffee, Package, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OlirabLogo } from "@/components/olirab-logo"
import { CashierInterface } from "@/components/cashier-interface"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

export default function CashierPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    if (!isLoggedIn || userRole !== "cashier") {
      router.push("/login")
      return
    }

    setLoading(false)
  }, [router])

  // Check if screen is mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

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
    <div className="flex h-screen bg-blue-50/50 text-gray-800 relative">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button variant="outline" size="icon" className="bg-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 fixed md:static z-20 h-full w-64 bg-white shadow-md`}
      >
        <div className="p-6 border-b">
          <OlirabLogo size="lg" />
        </div>
        <div className="mt-4">
          <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Interfaces</p>
          <div
            className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
            onClick={() => router.push("/server")}
          >
            <Coffee className="h-4 w-4" />
            Serveur
          </div>
          <div
            className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
            onClick={() => router.push("/kitchen")}
          >
            <ChefHat className="h-4 w-4" />
            Cuisine
          </div>
          <div className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 bg-orange-50 border-l-4 border-orange-500 text-orange-700">
            <CreditCard className="h-4 w-4" />
            Caisse
          </div>
          <div
            className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
            onClick={() => router.push("/admin")}
          >
            <Package className="h-4 w-4" />
            Administration
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? "ml-0" : ""}`}>
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-4 py-3">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">Interface Caissier</h1>
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
      </div>

      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}

