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
import { Search, Plus, Clock, ChefHat, Bell, CreditCard, Coffee, LogOut } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"
import type { MenuItem as BaseMenuItem, Table, OrderItem } from "@/lib/sharedDataService"

type MenuItem = BaseMenuItem & {
  imageUrl?: string
}

interface TableOrder {
  id: number
  tableNumber: number
  time: string
  status: "pending" | "preparing" | "ready" | "completed"
  items: OrderItem[]
  total: number
  notifiedKitchen: boolean
  notifiedCashier: boolean
}

export default function ServerInterface() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tables")
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Category mapping for the database
 
const categoryMap: { [key: number]: string } = {
  1: "Burgers",
  2: "Tacos",
  3: "Frites",
  4: "Pizzas",
  5: "suchis",
  6: "Desserts",
  7: "Boissons",
 
}

  // Check authentication and load initial data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    
    // if (!isLoggedIn || userRole !== "server") {
    //   router.push("/login")
    //   return
    // }
    // Load initial data
    loadData()

    // Set up polling for data refresh
    const intervalId = setInterval(() => {
      loadData()
    }, 5000) // Poll every 5 seconds

    return () => {
      clearInterval(intervalId) // Clean up on unmount
    }
  }, [router])

  // Load data from API service
  const loadData = async () => {
    setLoading(true)
    try {
      // Get tables
      try {
        const tablesResponse = await api.get("/tables")
        if (tablesResponse.data && Array.isArray(tablesResponse.data.tables)) {
          setTables(
            tablesResponse.data.tables.map((table: any) => ({
              id: table.id,
              number: table.number,
              seats: table.capacity,
              status: table.status || "free",
              orderId: table.order_id || null,
            })),
          )
        } else {
          console.warn("Could not load tables from API, using mock data")
          // Fallback to mock data
          const { getTables } = require("@/lib/sharedDataService")
          setTables(getTables())
          toast({
            title: "Mode démo",
            description: "Utilisation des données de démonstration pour les tables",
          })
        }
      } catch (error) {
        console.warn("Error loading tables:", error)
        // Fallback to mock data
        const { getTables } = require("@/lib/sharedDataService")
        setTables(getTables())
      }

      // Get menu items
      try {
        const menuItemsResponse = await api.get("/menuItems")
        if (menuItemsResponse.data && menuItemsResponse.data["Menu Items"]) {
          setMenuItems(
            menuItemsResponse.data["Menu Items"].map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description || "",
              price: item.price,
              category: categoryMap[item.catégory_id] || "Autre",
              imageUrl: item.imageUrl || "/placeholder.svg?height=100&width=100",
            })),
          )
        } else {
          console.warn("Could not load menu items from API, using mock data")
          // Fallback to mock data
          const { getMenuItems } = require("@/lib/sharedDataService")
          setMenuItems(getMenuItems())
          toast({
            title: "Mode démo",
            description: "Utilisation des données de démonstration pour le menu",
          })
        }
      } catch (error) {
        console.warn("Error loading menu items:", error)
        // Fallback to mock data
        const { getMenuItems } = require("@/lib/sharedDataService")
        setMenuItems(getMenuItems())
      }

      // Get orders orderPayload 
      try {
        const ordersResponse = await api.get("/orders")
        if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
          setOrders(
            ordersResponse.data.orders.map((order: any) => {
              const orderItems = order.order_details.map((detail: any, index: number) => {
                const menuItem = menuItems.find((item) => item.id === detail.menu_item_id)
                return {
                  id: index + 1,
                  menuItemId: detail.menu_item_id,
                  name: menuItem ? menuItem.name : `Item #${detail.menu_item_id}`,
                  price: detail.price,
                  quantity: detail.quantity,
                }
              })

              return {
                id: order.id,
                tableNumber: order.table_id,
                time: new Date(order.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                status: order.status,
                items: orderItems,
                total: order.total_price,
                notifiedKitchen: order.notified_kitchen || false,
                notifiedCashier: order.notified_cashier || false,
              }
            }),
          )
        } else {
          console.warn("Could not load orders from API, using mock data")
          // For now, we'll just use an empty array
          setOrders([])
        }
      } catch (error) {
        console.warn("Error loading orders:", error)
        // For now, we'll just use an empty array
        setOrders([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      // Fallback to mock data
      const { getTables, getMenuItems } = require("@/lib/sharedDataService")
      setTables(getTables())
      setMenuItems(getMenuItems())
      setOrders([])
      toast({
        title: "Mode démo",
        description: "Utilisation des données de démonstration (API non disponible)",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Start new order
  const startNewOrder = () => {
    setIsTableSelectionOpen(true)
  }

  // Select table for new order
  const selectTableForOrder = async (table: Table) => {
    setSelectedTable(table)

    // If table has an existing order, load it
    if (table.orderId) {
      try {
        // Try to fetch the order from the API
        const orderResponse = await api.get(`/orders/${table.orderId}`)
        if (orderResponse.data && orderResponse.data.order) {
          const order = orderResponse.data.order
          const orderItems = order.order_details.map((detail: any, index: number) => {
            const menuItem = menuItems.find((item) => item.id === detail.menu_item_id)
            return {
              id: index + 1,
              menuItemId: detail.menu_item_id,
              name: menuItem ? menuItem.name : `Item #${detail.menu_item_id}`,
              price: detail.price,
              quantity: detail.quantity,
            }
          })

          setNewOrder({
            id: order.id,
            tableNumber: table.number,
            time: new Date(order.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            status: order.status,
            items: orderItems,
            total: order.total_price,
            notifiedKitchen: order.notified_kitchen || false,
            notifiedCashier: order.notified_cashier || false,
          })
        } else {
          // Create new order if no order found
          setNewOrder({
            id: Math.floor(Math.random() * 10000),
            tableNumber: table.number,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            status: "pending",
            items: [],
            total: 0,
            notifiedKitchen: false,
            notifiedCashier: false,
          })
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        // Create new order if error
        setNewOrder({
          id: Math.floor(Math.random() * 10000),
          tableNumber: table.number,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          status: "pending",
          items: [],
          total: 0,
          notifiedKitchen: false,
          notifiedCashier: false,
        })
      }
    } else {
      // Create new order for new table
      setNewOrder({
        id: Math.floor(Math.random() * 10000),
        tableNumber: table.number,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        status: "pending",
        items: [],
        total: 0,
        notifiedKitchen: false,
        notifiedCashier: false,
      })
    }

    setIsTableSelectionOpen(false)
    setIsNewOrderDialogOpen(true)
  }

  // Add item to order
  const addItemToOrder = (item: MenuItem) => {
    if (!newOrder) return

    const existingItem = newOrder.items.find((orderItem) => orderItem.menuItemId === item.id)

    if (existingItem) {
      // Increment quantity if item already exists
      const updatedItems = newOrder.items.map((orderItem) =>
        orderItem.menuItemId === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem,
      )

      setNewOrder({
        ...newOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      })
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: newOrder.items.length + 1,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }

      const updatedItems = [...newOrder.items, newItem]

      setNewOrder({
        ...newOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      })
    }

    toast({
      title: "Article ajouté",
      description: `${item.name} ajouté à la commande`,
    })
  }

  // Calculate total
  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  // Send order to kitchen
  const sendOrderToKitchen = async () => {
    if (!newOrder || !selectedTable) {
      toast({
        title: "Erreur",
        description: "Informations de commande incomplètes",
        variant: "destructive",
      })
      return
    }

    if (newOrder.items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter des articles à la commande",
        variant: "destructive",
      })
      return
    }

    try {
      // Create the order payload with all required fields
      const orderPayload = {
        user_id: localStorage.getItem("userId") || 1,
        date: new Date().toISOString(),
        table_id: selectedTable.id,
        status: "pending",
        total_price: newOrder.total,
        type: "sur place",
        esstimation_time: 30, // Add default estimation time
        delivry_adress: "", // Empty string if not applicable
        delivry_phone: "", // Empty string if not applicable
        order_details: newOrder.items.map((item) => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
      }

      // Send the order to the API 
      const response = await api.post("/orders", orderPayload)

      if (response.data && response.data.success) {
        toast({
          title: "Commande envoyée",
          description: "La commande a été envoyée à la cuisine",
        })

        // Update tables
        setTables(
          tables.map((t) =>
            t.id === selectedTable.id ? { ...t, status: "occupied", orderId: response.data.order_id } : t,
          ),
        )

        // Reset current order
        setNewOrder(null)
        setSelectedTable(null)
        setIsNewOrderDialogOpen(false)

        // Refresh data
        loadData()
      } else {
        toast({
          title: "Erreur",
          description: response.data?.message || "Impossible de créer la commande",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur",
        variant: "destructive",
      })
    }
  }

  // Notify kitchen
  const notifyKitchen = async (orderId: number) => {
    try {
      const response = await api.post(`/orders/${orderId}/notify-kitchen`)

      if (response.data && response.data.success) {
        // Update order status locally
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: "preparing", notifiedKitchen: true } : order,
          ),
        )

        toast({
          title: "Cuisine notifiée",
          description: "La cuisine a été notifiée de préparer la commande",
        })
      } else {
        toast({
          title: "Erreur",
          description: response.data?.message || "Impossible de notifier la cuisine",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error notifying kitchen:", error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur",
        variant: "destructive",
      })
    }
  }

  // Notify cashier
  const notifyCashier = async (orderId: number) => {
    try {
      const response = await api.post(`/orders/${orderId}/notify-cashier`)

      if (response.data && response.data.success) {
        // Update order status locally
        setOrders(orders.map((order) => (order.id === orderId ? { ...order, notifiedCashier: true } : order)))

        toast({
          title: "Caissier notifié",
          description: "Le caissier a été notifié pour encaisser la commande",
        })
      } else {
        toast({
          title: "Erreur",
          description: response.data?.message || "Impossible de notifier le caissier",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error notifying cashier:", error)
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter au serveur",
        variant: "destructive",
      })
    }
  }

  // Filter orders based on search term
  const filteredOrders = orders.filter(
    (order) =>
      order.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.tableNumber.toString().includes(searchTerm),
  )

  // Filter menu items by category
  const filteredMenuItems =
    selectedCategory === "all" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

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

  if (loading && tables.length === 0) {
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
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-orange-100 text-orange-700">SV</AvatarFallback>
              </Avatar>
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
                            <p className="text-sm text-neutral-500">Quantité: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</span>
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

              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    onClick={() => setSelectedCategory("all")}
                    className="whitespace-nowrap"
                    size="sm"
                  >
                    Tous
                  </Button>
                  {Array.from(new Set(menuItems.map((item) => item.category))).map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      onClick={() => setSelectedCategory(category)}
                      className="whitespace-nowrap"
                      size="sm"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                {filteredMenuItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => addItemToOrder(item)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      <img
                        src={item.imageUrl || "/placeholder.svg?height=100&width=100"}
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
                            <p className="text-sm text-neutral-500">Quantité: {item.quantity}</p>
                          </div>
                          <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
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

      {/* Logout confirmation dialog  */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
