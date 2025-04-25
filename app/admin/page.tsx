"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  ChefHat,
  CreditCard,
  Coffee,
  Package,
  Bell,
  Info,
  AlertTriangle,
  Menu,
  X,
  LogOut,
  UtensilsCrossed,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OlirabLogo } from "@/components/olirab-logo"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { EmployeeManagement } from "@/components/employee-management"
import { StockManagement } from "@/components/stock-management"
import { AccountingManagement } from "@/components/accounting-management"
import { MenuManagement } from "@/components/menu-management"

interface Notification {
  id: number
  type: "warning" | "info" | "error"
  message: string
  date: string
  read: boolean
}

export default function RestaurantManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<"employees" | "stock" | "accounting" | "menu">("employees")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    // if (!isLoggedIn || userRole !== "Gérant") {
    //   router.push("/");
    // }
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

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/login")
  }
  return (
    <div className="flex h-screen bg-orange-50/50 text-gray-800 relative">
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
          <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Menu</p>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${
              activeSection === "employees"
                ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
                : "text-gray-600 hover:bg-orange-50/50"
            }`}
            onClick={() => {
              setActiveSection("employees")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <User className="h-4 w-4" />
            Employés
          </div>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${
              activeSection === "stock"
                ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
                : "text-gray-600 hover:bg-orange-50/50"
            }`}
            onClick={() => {
              setActiveSection("stock")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <Package className="h-4 w-4" />
            Stock
          </div>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${
              activeSection === "accounting"
                ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
                : "text-gray-600 hover:bg-orange-50/50"
            }`}
            onClick={() => {
              setActiveSection("accounting")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <CreditCard className="h-4 w-4" />
            Comptabilité
          </div>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${
              activeSection === "menu"
                ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
                : "text-gray-600 hover:bg-orange-50/50"
            }`}
            onClick={() => {
              setActiveSection("menu")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <UtensilsCrossed className="h-4 w-4" />
            Menu des Plats
          </div>
          <div className="mt-4 border-t pt-4">
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
            <div
              className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
              onClick={() => router.push("/cashier")}
            >
              <CreditCard className="h-4 w-4" />
              Caisse
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className={`flex-1 p-4 md:p-8 overflow-auto ${isMobile ? "ml-0" : ""} pt-16 md:pt-8`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-400 text-sm">Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {activeSection === "employees"
                ? "Gestion des Employés"
                : activeSection === "stock"
                  ? "Gestion du Stock"
                  : activeSection === "menu"
                    ? "Menu des Plats"
                    : "Comptabilité"}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllNotificationsAsRead}>
                        Tout marquer comme lu
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-3 border-b hover:bg-gray-50 cursor-default">
                          <div className="flex gap-3 items-start">
                            <div
                              className={`p-2 rounded-full 
                              ${
                                notification.type === "error"
                                  ? "bg-red-100 text-red-600"
                                  : notification.type === "warning"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-orange-100 text-orange-600"
                              }`}
                            >
                              {notification.type === "error" ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : notification.type === "warning" ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : (
                                <Info className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.read ? "font-bold" : ""}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">Aucune notification</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <p className="text-gray-600">Bienvenue</p>
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/admin.jpeg?height=40&width=40" />
                <AvatarFallback className="bg-orange-100 text-orange-700">MZ</AvatarFallback>
              </Avatar>
              <span className="font-medium">{localStorage.getItem("username") || "Gérant"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirmation(true)} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {activeSection === "employees" ? (
          <EmployeeManagement />
        ) : activeSection === "stock" ? (
          <StockManagement />
        ) : activeSection === "menu" ? (
          <MenuManagement />
        ) : (
          <AccountingManagement />
        )}
      </div>

      {/* Click outside to close notifications */}
      {notificationsOpen && <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />}

      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
