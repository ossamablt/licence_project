"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OlirabLogo } from "@/components/olirab-logo"
import { Search, Plus, Clock, ChefHat, Bell, User, CreditCard, Coffee, LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import notificationService from "@/lib/notificationService"
import { mockTables, mockMenuItems } from "@/lib/mockData"
import { getSharedOrders, setSharedOrders } from "@/lib/notificationService"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  image: string
  options?: {
    name: string
    choices: string[]
  }[]
}

interface TableOrder {
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

interface Table {
  id: number
  number: number
  seats: number
  status: "free" | "occupied" | "reserved"
  order?: TableOrder
}

export default function ServerInterface() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("orders")
  const [orders, setOrders] = useState<TableOrder[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [newOrder, setNewOrder] = useState<TableOrder | null>(null)
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false)
  const [isTableSelectionOpen, setIsTableSelectionOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

  // Check authentication and load initial data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    if (!isLoggedIn || userRole !== "server") {
      router.push("/login")
      return
    }

    // Connect to notification service
    notificationService.connect()

    // Subscribe to order updates
    const orderUpdateSubscription = notificationService.subscribe("order.updated", (data) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === data.id ? { ...order, status: data.status } : order)),
      )
    })

    // Load data
    setLoading(true)

    // Get orders from shared state
    const sharedOrders = getSharedOrders()
    setOrders(sharedOrders)

    // Set tables and menu items from mock data
    setTables(mockTables)
    setMenuItems(mockMenuItems)

    setLoading(false)

    // Cleanup
    return () => {
      notificationService.unsubscribe("order.updated", orderUpdateSubscription)
      notificationService.disconnect()
    }
  }, [router])

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/login")
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter(
    (order) =>
      order.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.tableNumber.toString().includes(searchTerm),
  )

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "bg-blue-100 text-blue-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price)
  }

  // Start new order
  const startNewOrder = () => {
    setIsTableSelectionOpen(true)
  }

  // Select table for new order
  const selectTableForOrder = (table: Table) => {
    if (table.status === "occupied") {
      // Find existing order for this table
      const existingOrder = orders.find((order) => order.tableNumber === table.number)
      if (existingOrder) {
        setNewOrder(existingOrder)
        setSelectedTable(table)
        setIsTableSelectionOpen(false)
        setIsNewOrderDialogOpen(true)
        return
      }
    }

    setSelectedTable(table)
    setNewOrder({
      id: Math.max(...orders.map((o) => o.id), 0) + 1,
      tableNumber: table.number,
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: "pending",
      items: [],
      total: 0,
      notifiedKitchen: false,
      notifiedCashier: false,
    })
    setIsTableSelectionOpen(false)
    setIsNewOrderDialogOpen(true)

    // Update table status
    setTables(tables.map((t) => (t.id === table.id ? { ...t, status: "occupied" } : t)))
  }

  // Add item to order
  const addItemToOrder = (item: MenuItem) => {
    if (!newOrder) return

    const newItem = {
      id: newOrder.items.length + 1,
      name: item.name,
      size: "medium",
      options: {},
      price: item.price,
    }

    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem],
      total: newOrder.total + item.price,
    })
  }

  // Send order to kitchen
  const sendOrderToKitchen = () => {
    if (!newOrder) return

    const existingOrderIndex = orders.findIndex((o) => o.id === newOrder.id)
    let updatedOrders

    if (existingOrderIndex >= 0) {
      // Update existing order
      updatedOrders = [...orders]
      updatedOrders[existingOrderIndex] = {
        ...newOrder,
        status: "pending",
        notifiedKitchen: false,
      }
    } else {
      // Create new order
      updatedOrders = [...orders, newOrder]
    }

    setOrders(updatedOrders)
    setSharedOrders(updatedOrders)

    // Notify kitchen via notification service
    notificationService.publish("order.new", newOrder, "kitchen")

    // Reset new order state
    setNewOrder(null)
    setSelectedTable(null)
    setIsNewOrderDialogOpen(false)

    // Show success toast
    toast({
      title: "Commande envoyée",
      description: "La commande a été envoyée avec succès",
    })
  }

  // Notify kitchen
  const notifyKitchen = (orderId: number) => {
    // Update order status
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: "preparing", notifiedKitchen: true } : order,
    )

    setOrders(updatedOrders)
    setSharedOrders(updatedOrders)

    // Notify kitchen via notification service
    const orderToNotify = orders.find((order) => order.id === orderId)
    if (orderToNotify) {
      notificationService.publish("kitchen.notification", orderToNotify, "kitchen")
    }

    // Show success toast
    toast({
      title: "Cuisine notifiée",
      description: "La cuisine a été notifiée de préparer la commande",
    })
  }

  // Notify cashier
  const notifyCashier = (orderId: number) => {
    // Update order status
    const updatedOrders = orders.map((order) => (order.id === orderId ? { ...order, notifiedCashier: true } : order))

    setOrders(updatedOrders)
    setSharedOrders(updatedOrders)

    // Notify cashier via notification service
    const orderToNotify = orders.find((order) => order.id === orderId)
    if (orderToNotify) {
      notificationService.publish("cashier.notification", orderToNotify, "cashier")
    }

    // Show success toast
    toast({
      title: "Caissier notifié",
      description: "Le caissier a été notifié pour encaisser la commande",
    })
  }

  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "free":
        return "bg-green-100 border-green-300"
      case "occupied":
        return "bg-blue-100 border-blue-300"
      case "reserved":
        return "bg-yellow-100 border-yellow-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  // Get table status text
  const getTableStatusText = (status: string) => {
    switch (status) {
      case "free":
        return "Libre"
      case "occupied":
        return "Occupée"
      case "reserved":
        return "Réservée"
      default:
        return status
    }
  }

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
            <div className="relative">
              <Input
                placeholder="Rechercher commandes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
            </div>
            <Button onClick={startNewOrder} className="bg-blue-500 hover:bg-blue-600">
              <Plus size={18} className="mr-2" />
              Nouvelle Commande
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Bienvenue</span>
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="font-medium">Serveur</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirmation(true)} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Coffee className="h-4 w-4 mr-2" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <ChefHat className="h-4 w-4 mr-2" />
              Tables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${
                      order.status === "preparing"
                        ? "bg-blue-500"
                        : order.status === "ready"
                          ? "bg-green-500"
                          : order.status === "completed"
                            ? "bg-gray-500"
                            : "bg-yellow-500"
                    }`}
                  />
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Table {order.tableNumber}</CardTitle>
                        <div className="flex items-center text-sm text-neutral-500 mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          {order.time}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-neutral-500">
                              {Object.entries(item.options)
                                .map(([key, value]) => `${value}`)
                                .join(" • ")}
                            </p>
                          </div>
                          <span className="text-sm font-medium">{formatPrice(item.price)}</span>
                        </div>
                      ))}
                      <div className="pt-3 border-t mt-3">
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {order.status === "pending" && !order.notifiedKitchen && (
                        <Button variant="outline" className="w-full" onClick={() => notifyKitchen(order.id)}>
                          <ChefHat className="h-4 w-4 mr-2" />
                          Notifier la cuisine
                        </Button>
                      )}

                      {order.status === "ready" && !order.notifiedCashier && (
                        <Button variant="outline" className="w-full" onClick={() => notifyCashier(order.id)}>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Notifier le caissier
                        </Button>
                      )}

                      {order.status === "ready" && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            // Notify the customer
                            toast({
                              title: "Client notifié",
                              description: "Le client a été notifié que sa commande est prête",
                            })
                          }}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Notifier le client
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredOrders.length === 0 && (
                <div className="col-span-3 bg-white rounded-lg shadow-sm p-8 text-center">
                  <Coffee className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <h3 className="text-lg font-medium mb-2">Aucune commande</h3>
                  <p className="text-neutral-500">
                    Créez une nouvelle commande en cliquant sur le bouton "Nouvelle Commande"
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tables" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => (
                <Card
                  key={table.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${getTableStatusColor(table.status)}`}
                  onClick={() => selectTableForOrder(table)}
                >
                  <CardContent className="p-4 text-center">
                    <h3 className="text-lg font-bold mb-1">Table {table.number}</h3>
                    <p className="text-sm text-neutral-600 mb-2">{table.seats} places</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        table.status === "free"
                          ? "bg-green-200 text-green-800"
                          : table.status === "occupied"
                            ? "bg-blue-200 text-blue-800"
                            : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {getTableStatusText(table.status)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Table Selection Dialog */}
      <Dialog open={isTableSelectionOpen} onOpenChange={setIsTableSelectionOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sélectionner une table</DialogTitle>
            <DialogDescription>Choisissez une table pour la nouvelle commande</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
            {tables.map((table) => (
              <Card
                key={table.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${getTableStatusColor(table.status)}`}
                onClick={() => selectTableForOrder(table)}
              >
                <CardContent className="p-4 text-center">
                  <h3 className="text-lg font-bold mb-1">Table {table.number}</h3>
                  <p className="text-sm text-neutral-600 mb-2">{table.seats} places</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      table.status === "free"
                        ? "bg-green-200 text-green-800"
                        : table.status === "occupied"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {getTableStatusText(table.status)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTableSelectionOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={isNewOrderDialogOpen} onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Commande - Table {selectedTable?.number}</DialogTitle>
            <DialogDescription>Sélectionnez les articles pour la commande</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Menu Items */}
            <div className="space-y-4">
              <h3 className="font-medium">Menu</h3>
              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                {menuItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => addItemToOrder(item)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <img
                        src={item.image || "/placeholder.svg?height=100&width=100"}
                        alt={item.name}
                        className="w-12 h-12 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-neutral-500">{item.category}</p>
                      </div>
                      <span className="font-medium">{formatPrice(item.price)}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Current Order */}
            <div className="space-y-4">
              <h3 className="font-medium">Commande en cours</h3>
              {newOrder && (
                <div className="space-y-4">
                  <div className="border rounded-lg divide-y max-h-[50vh] overflow-y-auto">
                    {newOrder.items.length > 0 ? (
                      newOrder.items.map((item) => (
                        <div key={item.id} className="p-3 flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-neutral-500">
                              {Object.entries(item.options)
                                .map(([key, value]) => `${value}`)
                                .join(" • ")}
                            </p>
                          </div>
                          <span className="font-medium">{formatPrice(item.price)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-neutral-500">Aucun article sélectionné</div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total</span>
                      <span>{formatPrice(newOrder.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewOrderDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={sendOrderToKitchen}
              disabled={!newOrder || newOrder.items.length === 0}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Enregistrer la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}

