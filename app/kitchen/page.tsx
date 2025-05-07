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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"
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
  status: "En attente" | "En préparation" | "Prête" | "Payée"
  items: {
    id: number
    name: string
    quantity: string
  }[]
  notifiedKitchen: boolean
  notifiedCashier: boolean
  estimation_time?: string
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

    if (!isLoggedIn || userRole !== "Cuisinier") {
      router.push("/")
      return
    }

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
          order.id === data.id ? { ...order, status: "En préparation", notifiedKitchen: true } : order,
        ),
      )

      toast({
        title: "Notification cuisine",
        description: `Commande Table ${data.tableNumber} à préparer`,
      })
    })

    // Load initial orders
    setLoading(true)
    getOrders()
    setLoading(false)

    // Setup polling
    const pollingInterval = setInterval(getOrders, 5000)
    
    // Cleanup
    return () => {
      notificationService.unsubscribe("order.new", newOrderSubscription)
      notificationService.unsubscribe("kitchen.notification", kitchenNotificationSubscription)
      notificationService.disconnect()
      clearInterval(pollingInterval)
    }
  }, [router])

  const getOrders = async () => {
    try {
      const menuResponse = await api.get("/menuItems");
      const menuItems = menuResponse.data?.["Menu Items"] || [];
      
      const response = await api.get("/orders");
      
      if (response.status !== 200) throw new Error("Failed to fetch orders");

      const newOrders: Order[] = (response.data?.orders || []).map((o: any) => {
        const items = Array.isArray(o.order_details) ? o.order_details : [];
        
        // Détecter les nouvelles commandes
        const isNewOrder = !orders.some(existingOrder => existingOrder.id === o.id);
        
        return {
          id: o.id,
          tableNumber: o.table_id,
          time: new Date(o.date).toLocaleTimeString("fr-FR", { 
            hour: "2-digit", 
            minute: "2-digit" 
          }),
          status: o.status,
          items: items.map((item: any) => ({
            id: item.id,
            name: menuItems.find((menu: any) => menu.id === item.item_id)?.name || `Item #${item.item_id}`,
            quantity: item.quantity || "1",
          })),
          notifiedKitchen: o.notified_kitchen || true,
          notifiedCashier: o.notified_cashier || false,
          estimation_time: o.estimation_time,
        };
      });

      // Mettre à jour seulement si il y a des changements
      if (JSON.stringify(newOrders) !== JSON.stringify(orders)) {
        setOrders(newOrders);
        setSharedOrders(newOrders);
        
        // Notification pour nouvelles commandes
        const newPendingOrders = newOrders.filter(order => 
          order.status === "En attente" && 
          !orders.some(existing => existing.id === order.id)
        );
        
        if (newPendingOrders.length > 0) {
          setNewOrderNotification(true);
          toast({
            title: "Nouvelles commandes",
            description: `${newPendingOrders.length} nouvelle(s) commande(s) en attente`,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive",
      });
    }
  };
  
  

  useEffect(() => {
    getOrders();
    console.log("Orders fetched:", orders);
  }, []);
  

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: "En attente" | "En préparation" | "Prête" | "Payée") => {
    try {
      const payload = {
        status: newStatus,
        notified_kitchen: true
      };

      const { data } = await api.patch(`/orders/${orderId}`, payload);

      // Mise à jour optimiste
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus, notifiedKitchen: true }
            : order
        )
      );

      toast({
        title: "Statut mis à jour",
        description: `La commande est maintenant ${newStatus.toLowerCase()}`,
      });

      if (newStatus === "En préparation") {
        setNewOrderNotification(false);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la commande",
        variant: "destructive",
      });
    }
  };

  // Add delete order function
  const deleteOrder = async (orderId: number) => {
    try {
      const response = await api.delete(`/orders/${orderId}`);
      
      if (response.data?.success) {
        // Remove the order from local state
        setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
        
        toast({
          title: "Commande supprimée",
          description: "La commande a été supprimée avec succès",
        });
      } else {
        throw new Error("Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande",
        variant: "destructive",
      });
    }
  };

  // Filter orders by status
  const pendingOrders = orders.filter((order) => order.status === "En attente" && order.notifiedKitchen);
  const preparingOrders = orders.filter((order) => order.status === "En préparation" && order.notifiedKitchen);
  const readyOrders = orders.filter((order) => order.status === "Prête" && order.notifiedKitchen);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "En préparation":
        return "bg-blue-100 text-blue-800";
      case "Prête":
        return "bg-green-100 text-green-800";
      case "En attente":
        return "bg-yellow-100 text-yellow-800";
      case "Payée":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      <header className="bg-orange-50 border-b border-orange-200 px-4 py-3">
        <div className="container mx-auto flex justify-between items-center">
          <OlirabLogo size="md" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Bienvenue</span>
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/cuisinier.jpg" />
               
              </Avatar>
              </div>
              <span className="font-medium">{localStorage.getItem("username")}</span>
              
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
                          {order.estimation_time && (
                            <span className="ml-2 text-orange-500">
                              ⏱ {order.estimation_time} min
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex flex-col">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-neutral-500 mt-1">Quantité: {item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        onClick={() => updateOrderStatus(order.id, "En préparation")}
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
                          {order.estimation_time && (
                            <span className="ml-2 text-orange-500">
                              ⏱ {order.estimation_time} min
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex flex-col">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-neutral-500 mt-1">Quantité: {item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={() => updateOrderStatus(order.id, "Prête")}
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
                          {order.estimation_time && (
                            <span className="ml-2 text-orange-500">
                              ⏱ {order.estimation_time} min
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex flex-col">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-neutral-500 mt-1">Quantité: {item.quantity}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          // First mark as completed
                          await updateOrderStatus(order.id, "Payée");
                          // Then delete the order
                          await deleteOrder(order.id);
                        }}
                      >
                        Marquer comme terminé et supprimer
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

