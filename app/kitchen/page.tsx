"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OlirabLogo } from "@/components/olirab-logo"
import { Clock, CheckCircle, AlertCircle, ChefHat, User, LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import notificationService from "@/lib/notificationService"
import { getSharedOrders, setSharedOrders } from "@/lib/notificationService"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

// Types
interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  image: string
  size?: string
  extras?: string[]
}

interface Order {
  id: number
  tableNumber: number
  time: string
  status: "pending" | "preparing" | "ready" | "completed"
  items: {
    id: number
    name: string
    size: string
    options: { [key: string]: string }
    price: number
  }[]
  total: number
  notifiedKitchen: boolean
  notifiedCashier: boolean
}

export default function KitchenInterface() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [newOrderNotification, setNewOrderNotification] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

  // Check authentication and load initial data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    // if (!isLoggedIn || userRole !== "kitchen") {
    //   router.push("/login")
    //   return
    // }

    // Connect to notification service
    notificationService.connect()

    // Subscribe to new orders
    const newOrderSubscription = notificationService.subscribe("order.new", (data) => {
      setOrders((prevOrders) => [
        ...prevOrders,
        {
          ...data,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          items: data.items || [],
          total: data.total || 0,
          notifiedKitchen: true,
          notifiedCashier: false,
        },
      ])
      setNewOrderNotification(true)

      toast({
        title: "Nouvelle commande",
        description: `Table ${data.tableNumber}: ${data.items?.length || 1} article(s)`,
      })
    })

    // Subscribe to kitchen notifications
    const kitchenNotificationSubscription = notificationService.subscribe("kitchen.notification", (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === data.id ? { ...order, status: "preparing", notifiedKitchen: true } : order,
        ),
      )

      toast({
        title: "Notification cuisine",
        description: `Commande Table ${data.tableNumber} à préparer`,
      })
    })

    // Load initial orders
    setLoading(true)
    // Get orders from shared state or mock data
    const sharedOrders = getSharedOrders()
    setOrders(sharedOrders)
    setLoading(false)

    // Cleanup
    return () => {
      notificationService.unsubscribe("order.new", newOrderSubscription)
      notificationService.unsubscribe("kitchen.notification", kitchenNotificationSubscription)
      notificationService.disconnect()
    }
  }, [router])

  // Update order status
  const updateOrderStatus = (orderId: number, newStatus: "pending" | "preparing" | "ready" | "completed") => {
    // Update local state
    const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))

    setOrders(updatedOrders)
    setSharedOrders(updatedOrders)

    // If order is ready, notify server
    if (newStatus === "ready") {
      const orderToNotify = orders.find((order) => order.id === orderId)
      if (orderToNotify) {
        notificationService.publish("order.updated", { ...orderToNotify, status: newStatus }, "server")
      }
    }

    // Show success toast
    toast({
      title: "Statut mis à jour",
      description: `La commande est maintenant ${getStatusText(newStatus).toLowerCase()}`,
    })

    // Reset notification flag if we're starting to prepare an order
    if (newStatus === "preparing") {
      setNewOrderNotification(false)
    }
  }

  // Get status text in French
  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "En préparation"
      case "ready":
        return "Prêt"
      case "pending":
        return "En attente"
      case "completed":
        return "Terminé"
      default:
        return status
    }
  }

  // Filter orders by status
  const pendingOrders = orders.filter((order) => order.status === "pending" && order.notifiedKitchen)
  const preparingOrders = orders.filter((order) => order.status === "preparing")
  const readyOrders = orders.filter((order) => order.status === "ready")

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
    <div className="min-h-screen bg-blue-50/50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <OlirabLogo size="md" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Bienvenue</span>
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium">Cuisine</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirmation(true)} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Orders */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
              Commandes en attente ({pendingOrders.length})
              {newOrderNotification && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">Nouveau</span>
              )}
            </h2>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Table {order.tableNumber}</CardTitle>
                        <div className="flex items-center text-sm text-neutral-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {order.time}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-neutral-500">
                              {Object.entries(item.options)
                                .map(([key, value]) => `${value}`)
                                .join(" • ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        onClick={() => updateOrderStatus(order.id, "preparing")}
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Commencer la préparation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingOrders.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center text-neutral-500">
                  Aucune commande en attente
                </div>
              )}
            </div>
          </div>

          {/* Preparing Orders */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <ChefHat className="h-5 w-5 mr-2 text-blue-500" />
              En préparation ({preparingOrders.length})
            </h2>
            <div className="space-y-4">
              {preparingOrders.map((order) => (
                <Card key={order.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Table {order.tableNumber}</CardTitle>
                        <div className="flex items-center text-sm text-neutral-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {order.time}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-neutral-500">
                              {Object.entries(item.options)
                                .map(([key, value]) => `${value}`)
                                .join(" • ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => updateOrderStatus(order.id, "ready")}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marquer comme prêt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {preparingOrders.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center text-neutral-500">
                  Aucune commande en préparation
                </div>
              )}
            </div>
          </div>

          {/* Ready Orders */}
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              Commandes prêtes ({readyOrders.length})
            </h2>
            <div className="space-y-4">
              {readyOrders.map((order) => (
                <Card key={order.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500" />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Table {order.tableNumber}</CardTitle>
                        <div className="flex items-center text-sm text-neutral-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {order.time}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-neutral-500">
                              {Object.entries(item.options)
                                .map(([key, value]) => `${value}`)
                                .join(" • ")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => updateOrderStatus(order.id, "completed")}
                      >
                        Marquer comme terminé
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {readyOrders.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center text-neutral-500">
                  Aucune commande prête
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}

