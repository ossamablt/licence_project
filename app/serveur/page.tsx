"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Search, Plus, Clock, ChefHat, Bell, CreditCard, Coffee, LogOut, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
}

interface Table {
  id: number
  number: number
  seats: number
  status: string
  orderId?: number
}

interface TableOrder {
  id: number
  tableNumber: number
  user_id: number
  type: string
  time: string
  status: "En attente" | "En préparation" | "Prête" | "Payée" | "Annulée"
  items: OrderItem[]
  total: number
  notifiedKitchen?: boolean
  notifiedCashier?: boolean
}

interface OrderItem {
  id: number
  menuItemId: number
  name: string
  price: number
  quantity: number
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
  const [packs, setPacks] = useState<any[]>([])
  const [ws] = useState(() => new WebSocket('ws://localhost:3001'))

  // Category mapping for the database
  const categoryMap: { [key: number]: string } = {
    1: "Burgers",
    2: "Tacos",
    3: "Frites",
    4: "Pizzas",
    5: "Sushis",
    6: "Desserts",
    7: "Boissons",
  }

  // Load initial data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")
    if (!isLoggedIn || userRole !== "Serveur") {
      router.push("/")
      return
    }
    loadData()
  }, [])

  //get item name 
  const getItemNameById = useCallback(async (itemId: number) => {
    try {
      const response = await api.get(`/menuItems/${itemId}`);
      if (response.data && response.data.menu_item) {
        return response.data.menu_item.name;
      }
      return `Item #${itemId}`;
    } catch (error) {
      console.error("Error fetching item name:", error);
      return `Item #${itemId}`;
    }
  }, [])
  
  // Load data from API service
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Get tables
      const tablesResponse = await api.get("/tables")
      if (tablesResponse.data?.tables) {
        setTables(tablesResponse.data.tables.map((table: any) => ({
          id: table.id,
          number: table.num_table,
          seats: table.capacity,
          status: table.status,
          orderId: table.order_id
        })))
      }

      // Get menu items
      const menuItemsResponse = await api.get("/menuItems")
      if (menuItemsResponse.data && menuItemsResponse.data["Menu Items"]) {
        const menuItemsData = menuItemsResponse.data["Menu Items"].map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: item.price,
          category: categoryMap[item.catégory_id] || "Autre",
          imageUrl: item.imageUrl || "/placeholder.svg?height=100&width=100",
        }))
        setMenuItems(menuItemsData)
      }

      // Get orders
      const ordersResponse = await api.get("/orders")
      if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
        const ordersWithItems = await Promise.all(
          ordersResponse.data.orders
            .filter((order: any) => order.status !== "Annulée")
            .map(async (order: any) => {
              try {
                const orderItems = await Promise.all(
                  order.order_details.map(async (detail: any, index: number) => {
                    const itemName = await getItemNameById(detail.item_id)
                    return {
                      id: index + 1,
                      menuItemId: detail.item_id,
                      name: itemName,
                      price: detail.price,
                      quantity: detail.quantity,
                    }
                  })
                )

                return {
                  id: order.id,
                  tableNumber: order.table_id,
                  time: new Date(order.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                  status: order.status,
                  items: orderItems,
                  total: orderItems.reduce((sum: number, item) => sum + (item.price * item.quantity), 0),
                  notifiedKitchen: order.notified_kitchen || false,
                  notifiedCashier: order.notified_cashier || false,
                }
              } catch (error) {
                console.error("Error processing order:", error)
                return null
              }
            })
        )

        const validOrders = ordersWithItems.filter((order): order is TableOrder => order !== null)
        setOrders(validOrders)
      }

      // Get packs
      const packsResponse = await api.get("/packs")
      if (packsResponse.data?.packs) {
        setPacks(packsResponse.data.packs)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [getItemNameById])

  // Polling pour les commandes (toutes les 5 secondes)
  useEffect(() => {
    const ordersInterval = setInterval(() => {
      loadData()
    }, 5000)

    return () => clearInterval(ordersInterval)
  }, [loadData])

  // Polling pour les tables (toutes les 10 secondes)
  useEffect(() => {
    const loadTables = async () => {
      try {
        const tablesResponse = await api.get("/tables")
        if (tablesResponse.data?.tables) {
          setTables(tablesResponse.data.tables.map((table: any) => ({
            id: table.id,
            number: table.num_table,
            seats: table.capacity,
            status: table.status,
            orderId: table.order_id
          })))
        }
      } catch (error) {
        console.error("Error loading tables:", error)
      }
    }

    const tablesInterval = setInterval(loadTables, 10000)
    return () => clearInterval(tablesInterval)
  }, [])

  // Polling pour les statuts des commandes (toutes les 3 secondes)
  useEffect(() => {
    const loadOrderStatuses = async () => {
      try {
        const ordersResponse = await api.get("/orders")
        if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
          setOrders(prevOrders => {
            const updatedOrders = prevOrders.map(prevOrder => {
              const updatedOrder = ordersResponse.data.orders.find(
                (order: any) => order.id === prevOrder.id
              )
              if (updatedOrder) {
                return {
                  ...prevOrder,
                  status: updatedOrder.status,
                  notifiedKitchen: updatedOrder.notified_kitchen || false,
                  notifiedCashier: updatedOrder.notified_cashier || false,
                }
              }
              return prevOrder
            })
            return updatedOrders
          })
        }
      } catch (error) {
        console.error("Error loading order statuses:", error)
      }
    }

    const statusInterval = setInterval(loadOrderStatuses, 3000)
    return () => clearInterval(statusInterval)
  }, [])

  // WebSocket handling for real-time updates
  useEffect(() => {
    ws.onopen = () => {
      console.log('WebSocket Connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      switch (data.type) {
        case 'ORDER_UPDATED':
          setOrders(prev => 
            prev.map(order => order.id === data.order.id ? data.order : order)
          )
          break
        case 'ORDER_CREATED':
          setOrders(prev => [...prev, data.order])
          break
        case 'ORDER_DELETED':
          setOrders(prev => prev.filter(order => order.id !== data.orderId))
          break
        case 'TABLE_UPDATED':
          setTables(prev => 
            prev.map(table => table.id === data.table.id ? data.table : table)
          )
          break
        case 'MENU_ITEM_UPDATED':
          setMenuItems(prev => 
            prev.map(item => item.id === data.item.id ? data.item : item)
          )
          break
        case 'PACK_UPDATED':
          setPacks(prev => 
            prev.map(pack => pack.id === data.pack.id ? data.pack : pack)
          )
          break
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error)
    }

    return () => {
      ws.close()
    }
  }, [ws])

  // Start new order
  const startNewOrder = () => {
    setIsTableSelectionOpen(true)
  }

  // Select table for new order
  const selectTableForOrder = (table: Table) => {
    if (table.status === "occupied") {
      const existingOrder = orders.find(o => o.tableNumber === table.number);
      if (existingOrder) {
        setNewOrder(existingOrder);
        setIsNewOrderDialogOpen(true);
      }
      return;
    }

    setSelectedTable(table);
    setNewOrder({
      id: 0,
      tableNumber: table.number,
      user_id: Number(localStorage.getItem("userId")) || 1,
      type: "A place",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: "En attente",
      items: [],
      total: 0,
    });
    setIsNewOrderDialogOpen(true);
  }

  // Modify order function
  const modifyOrder = useCallback(async (orderId: number) => {
    try {
      const orderToModify = orders.find(order => order.id === orderId)
      if (!orderToModify) {
        toast({
          title: "Erreur",
          description: "Commande non trouvée",
          variant: "destructive",
        })
        return
      }

      // Trouver la table associée
      const tableForOrder = tables.find(table => table.number === orderToModify.tableNumber)
      if (!tableForOrder) {
        toast({
          title: "Erreur",
          description: "Table non trouvée pour cette commande",
          variant: "destructive",
        })
        return
      }

      // Set the table and order with original items
      setSelectedTable(tableForOrder)
      setNewOrder({
        ...orderToModify,
        items: orderToModify.items.map(item => ({
          ...item,
          id: item.menuItemId // Utiliser menuItemId comme ID unique
        }))
      })

      // Open the order dialog
      setIsNewOrderDialogOpen(true)
    } catch (error) {
      console.error("Error preparing order modification:", error)
      toast({
        title: "Erreur",
        description: "Impossible de modifier la commande",
        variant: "destructive",
      })
    }
  }, [orders, tables])

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
      // Add new item with menuItemId as ID
      const newItem: OrderItem = {
        id: item.id, // Utiliser l'ID du menuItem comme ID unique
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

  // Send order to kitchen
  const sendOrderToKitchen = useCallback(async () => {
    if (!newOrder || !selectedTable) {
      toast({
        title: "Erreur",
        description: "Informations de commande incomplètes",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderPayload = {
        table_id: selectedTable.id,
        type: "A table",
        status: "En attente",
        orderDetails: newOrder.items.map((item) => ({
          item_id: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      let response: any;
      if (newOrder.id && typeof newOrder.id === "number") {
        // Modification de commande existante
        response = await api.put(`/orders/${newOrder.id}`, orderPayload);
        
        if (response.status === 200) {
          // Mise à jour optimiste correcte
          setOrders(prev => prev.map(order => 
            order.id === newOrder.id ? {
              ...order,
              items: newOrder.items.map(item => ({
                ...item,
                id: item.menuItemId
              })),
              total: newOrder.total
            } : order
          ));

          // Mettre à jour la table
          await api.put(`/tables/${selectedTable.id}`, {
            status: "occupied",
            order_id: newOrder.id
          });

          // Envoyer la mise à jour via WebSocket
          ws.send(JSON.stringify({ 
            type: 'ORDER_UPDATED',
            order: {
              ...newOrder,
              items: newOrder.items.map(item => ({
                ...item,
                id: item.menuItemId
              }))
            }
          }));

          // Fermer le dialogue
          setIsNewOrderDialogOpen(false);
          setNewOrder(null);
          setSelectedTable(null);

          toast({
            title: "Succès",
            description: "Commande modifiée avec succès",
          });
        }
      } else {
        // Nouvelle commande
        response = await api.post("/orders", orderPayload);
        if (response.status === 201) {
          const orderId = response.data.id;
          
          // Mettre à jour la table
          await api.put(`/tables/${selectedTable.id}`, {
            status: "occupied",
            order_id: orderId
          });

          // Ajouter la nouvelle commande à l'état
          setOrders(prev => [...prev, {
            ...newOrder,
            id: orderId,
            items: newOrder.items.map(item => ({
              ...item,
              id: item.menuItemId
            }))
          }]);

          // Envoyer la mise à jour via WebSocket
          ws.send(JSON.stringify({ 
            type: 'ORDER_CREATED',
            order: {
              ...newOrder,
              id: orderId,
              items: newOrder.items.map(item => ({
                ...item,
                id: item.menuItemId
              }))
            }
          }));

          // Fermer le dialogue
          setIsNewOrderDialogOpen(false);
          setNewOrder(null);
          setSelectedTable(null);

          toast({
            title: "Succès",
            description: "Commande créée avec succès",
          });
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la commande à la cuisine",
        variant: "destructive",
      });
    }
  }, [newOrder, selectedTable, ws]);

  // Cancel order function
  const cancelOrder = useCallback(async (orderId: number) => {
    try {
      const orderToCancel = orders.find(order => order.id === orderId)
      if (!orderToCancel) {
        toast({
          title: "Erreur",
          description: "Commande non trouvée",
          variant: "destructive",
        })
        return
      }

      const response = await api.patch(`/orders/cancel/${orderId}`)
      
    } catch (error) {
      console.error("Error canceling order:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'annuler la commande",
        variant: "destructive",
      })
    }
  }, [orders, ws])

  // Update the deleteOrder function to use cancelOrder
  const deleteOrder = async (orderId: number) => {
    await cancelOrder(orderId)
  }

  // Calculate total
  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  // Notify kitchen
  const notifyKitchen = async (orderId: number) => {
    try {
      const response = await api.post(`/orders/${orderId}/notify-kitchen`)
      if (response.data && response.data.success) {
        // Update order status locally
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: "En préparation", notifiedKitchen: true } : order,
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
      const response = await api.post(`/orders/${orderId}`)

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
      order.items.some((item) => typeof item.name === "string" && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.tableNumber.toString().includes(searchTerm),
  )

  // Filter menu items by category
  const filteredMenuItems =
    selectedCategory === "all" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "En préparation":
        return "bg-blue-100 text-blue-800"
      case "Prête":
        return "bg-green-100 text-green-800"
      case "En attente":
        return "bg-yellow-100 text-yellow-800"
      case "Payée":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "En préparation":
        return "En préparation"
      case "Prête":
        return "Prêt"
      case "En attente":
        return "En attente"
      case "Payée":
        return "Terminé"
      default:
        return status
    }
  }

  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "available":
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
      case "available": return "Libre"
      case "occupied": return "Occupée"
      case "reserved": return "Réservée"
      default: return status
    }
  }

  // Add pack to order
  const addPackToOrder = (pack: any) => {
    if (!newOrder) return

    // Create order items from pack details
    const packItems = pack.pack_details.map((detail: any) => {
      const menuItem = detail.menuItem
      return {
        id: detail.item_id, // Utiliser l'ID du menuItem comme ID unique
        menuItemId: detail.item_id,
        name: menuItem ? menuItem.name : `Item #${detail.item_id}`,
        price: menuItem ? menuItem.price : 0,
        quantity: detail.quantity
      }
    })

    // Add all pack items to the order
    const updatedItems = [...newOrder.items, ...packItems]

    setNewOrder({
      ...newOrder,
      items: updatedItems,
      total: calculateTotal(updatedItems)
    })

    toast({
      title: "Pack ajouté",
      description: `${pack.name} ajouté à la commande`,
    })
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
                <AvatarImage src="/server.jpg" />
                <AvatarFallback className="bg-orange-100 text-orange-700">SV</AvatarFallback>
              </Avatar>
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
                      order.status === "En préparation"
                        ? "bg-blue-500"
                        : order.status === "Prête"
                        ? "bg-green-500"
                        : order.status === "Payée"
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
                        {order.status}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteOrder(order.id)}
                      >
                        Annuler
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={async () => {
                          // Prevent duplicate dialogs or glitches by ensuring only one dialog is open and order state is set correctly
                          setIsNewOrderDialogOpen(false);
                          setTimeout(async () => {
                            await modifyOrder(order.id);
                          }, 0);
                        }}
                      >
                        Modifier
                      </Button>
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
                  onClick={() => {
                    if (table.status === "occupied") {
                      const order = orders.find(o => o.tableNumber === table.number);
                      if (order) modifyOrder(order.id);
                    } else {
                      selectTableForOrder(table);
                    }
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <h3 className="text-lg font-bold mb-1">Table {table.number}</h3>
                    <p className="text-sm text-neutral-600 mb-2">{table.seats} places</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                       
                        table.status === "available"
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
                      table.status === "available"
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
            <DialogDescription>Sélectionnez les articles et packs pour la commande</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6">
            {/* Menu Items and Packs */}
            <div className="space-y-4">
              <Tabs defaultValue="menu" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="menu">Menu</TabsTrigger>
                  <TabsTrigger value="packs">Packs</TabsTrigger>
                </TabsList>

                {/* Menu Items Tab */}
                <TabsContent value="menu">
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
                </TabsContent>

                {/* Packs Tab */}
                <TabsContent value="packs">
                  <div className="space-y-4">
                    <h3 className="font-medium">Packs</h3>
                    <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2">
                      {packs
                        .filter((pack) => pack.is_available)
                        .map((pack) => (
                          <Card
                            key={pack.id}
                            className="cursor-pointer hover:border-orange-300 transition-colors"
                            onClick={() => {
                              if (!newOrder) {
                                toast({
                                  title: "Erreur",
                                  description: "Veuillez d'abord sélectionner une table",
                                  variant: "destructive"
                                })
                                return
                              }
                              addPackToOrder(pack)
                            }}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <img
                                src={pack.imageUrl || "/placeholder.svg"}
                                alt={pack.name}
                                className="w-12 h-12 rounded-md object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">{pack.name}</h4>
                                <p className="text-sm text-neutral-500">{pack.description}</p>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-medium">{formatPrice(pack.price)}</span>
                                <Badge className="bg-orange-500 mt-1">{pack.pack_details.length} articles</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Current Order */}
            <div className="space-y-4">
              <h3 className="font-medium">Commande en cours</h3>
              {newOrder && (
                <div className="space-y-4">
                  <div className="border rounded-lg divide-y max-h-[50vh] overflow-y-auto">
                    {newOrder.items.length > 0 ? (
                      newOrder.items.map((item) => (
                        <div key={item.id} className="p-3 flex justify-between items-start group">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-neutral-500">Quantité: {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                const updatedItems = newOrder.items.filter(i => i.id !== item.id);
                                setNewOrder({
                                  ...newOrder,
                                  items: updatedItems,
                                  total: calculateTotal(updatedItems)
                                });
                                toast({
                                  title: "Article supprimé",
                                  description: `${item.name} a été retiré de la commande`,
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
              onClick={async () => {
                const prevTableId = selectedTable?.id;
                await sendOrderToKitchen();
                if (prevTableId) {
                  setTables((prev) =>
                    prev.map((t) =>
                      t.id === prevTableId
                        ? { ...t, status: "occupied" }
                        : t
                    )
                  );
                }
                setIsNewOrderDialogOpen(false);
              }}
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