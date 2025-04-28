"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OlirabLogo } from "@/components/olirab-logo"
import { Clock, CheckCircle, AlertCircle, ChefHat, LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import notificationService from "@/lib/notificationService"
import { getSharedOrders, setSharedOrders } from "@/lib/notificationService"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders?status=pending&with=orderDetails');
        if (!response.ok) throw new Error('Échec de la récupération');
        
        const ordersData = await response.json();
    
        const transformedOrders = ordersData.map((order: any) => ({
          id: order.id,
          tableNumber: order.table?.num_table || "N/A",
          type: order.type,
          status: order.status,
          total: order.total_price,
          createdAt: new Date(order.date).toLocaleTimeString(),
          items: order.order_details.map((detail: any) => ({
            id: detail.id,
            name: detail.menu_item.name,
            quantity: detail.quantity,
            price: detail.price,
            specialRequest: detail.special_request || ""
          })),
          ...(order.type === "livraison" && {
            deliveryAddress: order.delivry_adress,
            deliveryPhone: order.delivry_phone
          })
        }));
    
        setOrders(transformedOrders);
        setSharedOrders(transformedOrders);
    
      } catch (error) {
        console.error("Erreur cuisine:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les commandes",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Rafraîchissement automatique
    useEffect(() => {
      const interval = setInterval(fetchOrders, 10000);
      return () => clearInterval(interval);
    }, []);

    const handleNewOrder = (data: Order) => {
      setOrders(prevOrders => {
        if (!prevOrders.some(order => order.id === data.id)) {
          return [
            ...prevOrders,
            {
              ...data,
              time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
              items: data.items || [],
              total: data.total || 0,
              notifiedKitchen: true,
              notifiedCashier: false,
            }
          ]
        }
        return prevOrders
      })
      setNewOrderNotification(true)
      toast({
        title: "Nouvelle commande",
        description: `Table ${data.tableNumber}: ${data.items?.length || 1} article(s)`,
      })
    }

    const handleKitchenNotification = (data: Order) => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === data.id ? { ...order, status: "preparing", notifiedKitchen: true } : order
        )
      )
      toast({
        title: "Notification cuisine",
        description: `Commande Table ${data.tableNumber} à préparer`,
      })
    }

    const initialize = async () => {
      // if (!isLoggedIn || userRole !== "kitchen") {
      //   router.push("/login")
      //   return
      // }

      notificationService.connect()
      const newOrderSub = notificationService.subscribe("order.new", handleNewOrder)
      const kitchenNotifSub = notificationService.subscribe("kitchen.notification", handleKitchenNotification)
      
      await fetchOrders()

      return { newOrderSub, kitchenNotifSub }
    }

    const subs = initialize()

    return () => {
      subs.then(({ newOrderSub, kitchenNotifSub }) => {
        notificationService.unsubscribe("order.new", newOrderSub)
        notificationService.unsubscribe("kitchen.notification", kitchenNotifSub)
        notificationService.disconnect()
      })
    }
  }, [router])

  const updateOrderStatus = async (orderId: number, newStatus: "pending" | "preparing" | "ready" | "completed") => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Échec de la mise à jour')

      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )
      setSharedOrders(
        orders.map((order: Order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      )

      if (newStatus === "ready") {
        const orderToNotify = orders.find(order => order.id === orderId)
        if (orderToNotify) {
          notificationService.publish("order.updated", { ...orderToNotify, status: newStatus }, "server")
        }
      }

      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant ${getStatusText(newStatus).toLowerCase()}`,
      })

      if (newStatus === "preparing") setNewOrderNotification(false)
    } catch (error) {
      console.error("Erreur de mise à jour:", error)
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du statut",
        variant: "destructive"
      })
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing": return "En préparation"
      case "ready": return "Prêt"
      case "pending": return "En attente"
      case "completed": return "Terminé"
      default: return status
    }
  }

  // Filtrage des commandes
  const pendingOrders = orders.filter(order => order.status === "pending" && order.notifiedKitchen)
  const preparingOrders = orders.filter(order => order.status === "preparing")
  const readyOrders = orders.filter(order => order.status === "ready")

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
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/cuisiner.jpeg?height=40&width=40" />
               
              </Avatar>
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

