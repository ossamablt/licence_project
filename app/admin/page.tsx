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
import api from "@/lib/api"

interface Notification {
  id: string
  type: "low_stock" | "expiring_soon"
  message: string
  created_at: string
  read_at: string | null
  data: {
    product_id: number
    product_name: string
    expiry_date?: string
  }
}

export default function RestaurantManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<"employees" | "stock" | "accounting" | "menu">("employees")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const [isMobile, setIsMobile] = useState(false)

  // Handle screen resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Check login and role
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    if (!isLoggedIn || userRole !== "Gérant") {
      router.push("/")
    }
  }, [router])

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications")
      setNotifications(response.data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Mark a notification as read
  const markNotificationAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/mark-read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      )
    } catch (error) {
      console.error("Error marking notification read:", error)
    }
  }

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await api.post("/notifications/mark-all-read")
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

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
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 fixed md:static z-20 h-full w-64 bg-white shadow-md`}>
        <div className="p-6 border-b">
          <OlirabLogo size="lg" />
        </div>
        <div className="mt-4">
          <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Menu</p>
          {["employees", "stock", "accounting", "menu"].map(section => (
            <div
              key={section}
              className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${
                activeSection === section
                  ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
                  : "text-gray-600 hover:bg-orange-50/50"
              }`}
              onClick={() => {
                setActiveSection(section as any)
                if (isMobile) setSidebarOpen(false)
              }}
            >
              {section === "employees" && <User className="h-4 w-4" />}
              {section === "stock" && <Package className="h-4 w-4" />}
              {section === "accounting" && <CreditCard className="h-4 w-4" />}
              {section === "menu" && <UtensilsCrossed className="h-4 w-4" />}
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </div>
          ))}
          <div className="mt-4 border-t pt-4">
            <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Interfaces</p>
            <div className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50" onClick={() => router.push("/server")}>
              <Coffee className="h-4 w-4" />
              Serveur
            </div>
            <div className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50" onClick={() => router.push("/kitchen")}>
              <ChefHat className="h-4 w-4" />
              Cuisine
            </div>
            <div className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50" onClick={() => router.push("/cashier")}>
              <CreditCard className="h-4 w-4" />
              Caissier
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {activeSection === "employees" && "Gestion des Employés"}
            {activeSection === "stock" && "Gestion du Stock"}
            {activeSection === "accounting" && "Gestion Comptable"}
            {activeSection === "menu" && "Gestion du Menu"}
          </h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">{unreadCount}</span>
              )}
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <p className="text-gray-600">Bienvenue</p>
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/admin.jpeg?height=40&width=40" />
                <AvatarFallback className="bg-orange-100 text-orange-700">MZ</AvatarFallback>
              </Avatar>
              <span className="font-medium">{localStorage.getItem("username") || "Gérant"}</span>
            </div>
            <Button variant="destructive" onClick={() => setShowLogoutConfirmation(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Sections */}
        {activeSection === "employees" && <EmployeeManagement />}
        {activeSection === "stock" && <StockManagement />}
        {activeSection === "accounting" && <AccountingManagement />}
        {activeSection === "menu" && <MenuManagement />}

        {/* Notifications Drawer */}
        {notificationsOpen && (
          <div className="absolute top-20 right-20 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">Notifications</h2>
              <Button size="sm" variant="ghost" onClick={markAllNotificationsAsRead}>
                Mark all as read
              </Button>
            </div>
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex gap-3 items-start">
                    <div
                      className={`p-2 rounded-full ${
                        notification.type === "low_stock" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${!notification.read_at ? "font-bold" : ""}`}>
                        {notification.message}
                      </p>
                      {notification.data.expiry_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expiration: {new Date(notification.data.expiry_date).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            )}
          </div>
        )}
      </div>

      {/* Logout Dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
