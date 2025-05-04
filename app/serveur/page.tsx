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
import { get } from "http"
import { Badge } from "@/components/ui/badge"

type MenuItem = BaseMenuItem & {
  imageUrl?: string
}

interface TableOrder {
  id: number
  tableNumber: number
  user_id: number
  type: string
  time: string
  status: "En attente" | "En préparation" | "Prête" | "Payée"
  items: orderItems[]
  total: number

}
export interface orderItems {
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
    if (!isLoggedIn || userRole !== "Serveur") {
      router.push("/")
      return
    }
    // Load initial data
    loadData()
    console.log("Loading data...")
    
  }, [router])


  //get item name 
   async function getItemNameById(itemId : BigInteger) {
    try {
      const response = await api.get(`/menuItems/${itemId}`);
      return response.data.menu_item.name;
    } catch (error) {
      console.error("Error fetching item name:", error);
      return null;
    }
  }
  
  // Load data from API service
  const loadData = async () => {
    setLoading(true)
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
          toast({
            title: "Mode démo",
            description: "Utilisation des données de démonstration pour le menu",
          })
        }
      } catch (error) {
        console.warn("Error loading menu items:", error)
      }

      // Get packs with their details
      try {
        const packsResponse = await api.get("/packs")
        if (packsResponse.data && Array.isArray(packsResponse.data.packs)) {
          // First, get all menu items to map pack details
          const menuItemsMap = new Map(menuItems.map(item => [item.id, item]))
          
          const loadedPacks = packsResponse.data.packs.map((pack: any) => {
            // Map pack details to include menu item information
            const packDetails = pack.pack_details.map((detail: any) => ({
              item_id: detail.item_id,
              quantity: detail.quantity,
              menuItem: menuItemsMap.get(detail.item_id)
            }))

            return {
              id: pack.id,
              name: pack.name,
              description: pack.description || "",
              price: pack.price,
              is_available: pack.is_available,
              imageUrl: pack.imageUrl || "/placeholder.svg",
              pack_details: packDetails
            }
          })

          setPacks(loadedPacks)
        }
      } catch (error) {
        console.warn("Error loading packs:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les packs",
          variant: "destructive"
        })
      }

      // Get orders
      try {
        const ordersResponse = await api.get("/orders")
        if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
          const ordersWithItems = await Promise.all(
            ordersResponse.data.orders.map(async (order: any) => {
              const orderItems = await Promise.all(
                order.order_details.map(async (detail: any, index: number) => {
                  const itemName = await getItemNameById(detail.item_id)
                  return {
                    id: index + 1,
                    menuItemId: detail.item_id,
                    name: itemName || `Item #${detail.item_id}`,
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
            })
          )
          setOrders(ordersWithItems)
        }
      } catch (error) {
        console.error("Error loading orders:", error)
        setOrders([])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données :", error)
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
        const orderResponse = await api.get(`/orders/${table.orderId}`);
        if (orderResponse.data?.order) {
          const order = orderResponse.data.order;
          const orderItems = order.order_details.map((detail: any, index: number) => {
            // 1. Vérification des clés alternatives de l'API
            const itemId = detail.item_id || detail.menu_item_id;
            
            // 2. Recherche de l'article dans le menu
            const menuItem = menuItems.find((item) => item.id == itemId); // == pour gérer les string/numbers
            
            // 3. Gestion des données manquantes
            const itemName = menuItem?.name || `Article #${itemId}`;
            const price = Number(detail.price) || 0;
            const quantity = Math.max(Number(detail.quantity) || 1);
    
            // 4. Validation des données
            if (!itemId) {
              console.error('ID d\'article manquant dans le détail de commande:', detail);
              return null;
            }
            // 5. Retourner l'objet formaté
            return {
              id: index + 1,
              menuItemId: itemId,
              name: itemName,
              price: price,
              quantity: quantity,
            };
          }).filter(Boolean); // Filtrer les entrées invalides
    
          // 6. Calcul du total sécurisé
          const total = orderItems.reduce((sum: number, item: orderItems) => sum + (item.price * item.quantity), 0);
    
         
      

          setNewOrder({
            id: order.id,
            tableNumber: table.number,
            user_id: order.user_id,
            type: order.type,
            time: new Date(order.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            status: order.status,
            items: orderItems,
            total: order.total_price,
          
          })
        } else {
          // Create new order if no order found
          setNewOrder({
            id: Math.floor(Math.random() * 10000),
            tableNumber: table.number,
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
            status: "En attente",
            items: [],
            type: "A place",
            user_id: 1,
            total: 0,
       
          })
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        // Create new order if error
        setNewOrder({
          id: Math.floor(Math.random() * 10000),
          tableNumber: table.number,
          user_id: Number(localStorage.getItem("userId")) || 1,
          type: "A place",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          status: "En attente",
          items: [],
          total: 0,
          
        })
      }
    } else {
      // Create new order for new table
      setNewOrder({
        id: Math.floor(Math.random() * 10000),
        tableNumber: table.number,
        time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        status: "En attente",
        items: [],
        type: "A place",
        user_id: Number(localStorage.getItem("userId")) || 1,
        total: 0,
    
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
      // Increment quantity if item alPrête exists
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

  const deleteOrder = async (orderId: number) => {
    try {
      // Send DELETE request to the API
      const response = await api.delete(`/orders/${orderId}`);
      if (response.data && response.data.success) {
        // Remove the order from the local state
        setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
  
        toast({
          title: "Commande supprimée",
          description: "La commande a été supprimée avec succès.",
        });
      } else {
        toast({
          title: "Erreur",
          description: response.data?.message || "Impossible de supprimer la commande.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la suppression de la commande.",
        variant: "destructive",
      });
    }
  };
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
        table_id: selectedTable.id,
        type: "A table",
        esstimation_time: "00:30:00",
        delivry_adress: null,
        delivry_phone: null,
        orderDetails: newOrder.items.map((item) => ({
          item_id: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
      }

      // Send the order to the API
      const response = await api.post("/orders", orderPayload)

      if (response.data?.success) {
        try {
          // 1. Mettre à jour la table DANS LA BASE DE DONNÉES d'abord
          const tableUpdate = await api.put(`/tables/${selectedTable.id}`, {
            status: "occupied",
            order_id: response.data.order_id,
          });
    
          // 2. Mettre à jour l'état local SEULEMENT si la BDD est mise à jour
          if (tableUpdate.data.success) {
            setTables(prev => prev.map(t => 
              t.id === selectedTable.id ? { 
                ...t, 
                status: "occupied",
                orderId: response.data.order_id 
              } : t
            ));
          }
    
          // 3. Fermer la dialog et reset les états
          setNewOrder(null);
          setSelectedTable(null);
          setIsNewOrderDialogOpen(false);
    
          // 4. Forcer un rechargement des données
          await loadData();
    
        } catch (err) {
          console.error("Erreur de mise à jour de la table:", err);
          toast({
            title: "Erreur critique",
            description: "La table n'a pas pu être marquée comme occupée",
            variant: "destructive"
          });
          // Annuler les changements locaux si l'update BDD échoue
          setTables(prev => prev.map(t => 
            t.id === selectedTable.id ? { ...t, status: "free" } : t
          ));
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la commande :", error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la commande à la cuisine",
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

  // Get status text in French
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
    if (!newOrder) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord sélectionner une table",
        variant: "destructive"
      })
      return
    }

    // Create order items from pack details
    const packItems = pack.pack_details.map((detail: any) => {
      const menuItem = detail.menuItem
      return {
        id: newOrder.items.length + 1,
        menuItemId: detail.item_id,
        name: menuItem ? menuItem.name : `Item #${detail.item_id}`,
        price: menuItem ? menuItem.price : 0,
        quantity: detail.quantity
      }
    })

    // Add all pack items to the order
    const updatedItems = [...newOrder.items, ...packItems]

    // Calculate the new total including the pack price
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    setNewOrder({
      ...newOrder,
      items: updatedItems,
      total: newTotal
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
              
                    <div className="flex gap-2 mt-4 bg-red-400 hover:accent-red-700 border-red-700 border rounded-[10px]">
                    {/* Add Delete Button */}
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => deleteOrder(order.id)}
                    >
                      Supprimer
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

      {/* Logout confirmation dialog  */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
