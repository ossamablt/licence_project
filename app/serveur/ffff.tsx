"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OlirabLogo } from "@/components/olirab-logo"
import { ChefHat, User, LogOut, X, Grid3X3, Utensils } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  getMenuItems,
  getTables,
  createOrder,
  notifyKitchen,
  getOrderByTableId,
  type Table,
} from "@/lib/sharedDataService"
import api from "@/lib/api"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  catégory_id: number
  is_available: boolean
  imageUrl: string
  category: string
}

interface OrderItem {
  id: number
  menuItemId: number
  name: string
  price: number
  quantity: number
}
const categoryMap: { [key: number]: string } = {
  1: "Burgers",
  2: "Accompagnements",
  3: "Boissons",
  4: "Desserts",
  5: "Menus",
}
//Serveur
export default function ServerInterface() {
  const router = useRouter()
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentOrder, setCurrentOrder] = useState<{
    items: OrderItem[]
    total: number
  }>({
    items: [],
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [activeView, setActiveView] = useState<"tables" | "menu">("tables")

  // Check authentication and load initial data
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    // Load initial data
    loadData()

    // Set up polling for data refresh
    const intervalId = setInterval(() => {
      loadData()
    }, 3000) // Poll every 3 seconds for real-time updates

    return () => {
      clearInterval(intervalId) // Clean up on unmount
    }
  }, [router])

  // Load data from shared service
 const loadData = async () => {
    try {
      const response = await api.get("/menuItems")
      setMenuItems(response.data["Menu Items"].map((item: any) => ({
        ...item,
        category: categoryMap[item.catégory_id] || "Autre",
        imageUrl: item.imageUrl || "/placeholder.svg"
      })))
      setLoading(false)
    } catch (error) {
      toast({ title: "Erreur", description: "Échec du chargement du menu", variant: "destructive" })
      setLoading(false)
    }
  }
   const addItemToOrder = (item: MenuItem) => {
      const existingItem = currentOrder.items.find(orderItem => orderItem.menuItemId === item.id)
      const updatedItems = existingItem
        ? currentOrder.items.map(orderItem =>
            orderItem.menuItemId === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem
          )
        : [...currentOrder.items, {
            id: currentOrder.items.length + 1,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
          }]
  
      setCurrentOrder({
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      })
  
      toast({ title: "Article ajouté", description: `${item.name} ajouté à la commande` })
    }
  

  // Check if screen is mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Select a table
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table)

    // If table has an existing order, load it
    if (table.orderId) {
      const existingOrder = getOrderByTableId(table.id)
      if (existingOrder) {
        setCurrentOrder({
          items: existingOrder.items,
          total: existingOrder.total,
        })
      } else {
        setCurrentOrder({ items: [], total: 0 })
      }
    } else {
      // Reset current order for new table
      setCurrentOrder({ items: [], total: 0 })
    }

    // Switch to menu view after selecting a table
    if (isMobile) {
      setActiveView("menu")
    }
  }
  const sendOrderToKitchen = async () => {
    if (currentOrder.items.length === 0) {
      toast({ title: "Erreur", description: "Veuillez ajouter des articles", variant: "destructive" })
      return
    }

    try {
      await api.post("/orders", {
        items: currentOrder.items,
        total: currentOrder.total,
        status: "pending"
      })

      toast({ title: "Commande envoyée", description: "La commande a été envoyée à la cuisine" })
      setCurrentOrder({ items: [], total: 0 })
      loadData()
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de l'envoi de la commande", variant: "destructive" })
    }
  }
  const removeItemFromOrder = (itemId: number) => {
    const updatedItems = currentOrder.items.filter(item => item.id !== itemId)
    setCurrentOrder({
      items: updatedItems,
      total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
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
  // Filter menu items by category
  const filteredMenuItems =
    selectedCategory === "all" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

  // Get table status color
  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "free":
        return "border-green-300 bg-green-50"
      case "occupied":
        return "border-blue-300 bg-blue-50"
      case "reserved":
        return "border-amber-300 bg-amber-50"
      default:
        return "border-gray-300 bg-gray-50"
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
    <div className="flex h-screen bg-gray-100 text-gray-800 relative">
      {/* Main content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
          <OlirabLogo size="lg" />
            <h1 className="text-3xl font-bold text-gray-800">Serveur</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={activeView === "tables" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("tables")}
                className="rounded-md"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Tables
              </Button>
              <Button
                variant={activeView === "menu" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("menu")}
                className="rounded-md"
              >
                <Utensils className="h-4 w-4 mr-1" />
                Menu
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                 <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/server.jpeg?height=40&width=40" />
               
              </Avatar>
              </div>
              </div>
              <span className="font-medium hidden md:inline">Serveur</span>
            </div>

            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirmation(true)} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - Tables or Menu */}
          <div className="flex-1 p-4 overflow-auto">
            {activeView === "tables" ? (
              <>
                <h2 className="text-lg font-bold mb-4">Tables</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {tables.map((table) => (
                    <Card
                      key={table.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${getTableStatusColor(table.status)} ${
                        selectedTable?.id === table.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => handleSelectTable(table)}
                    >
                      <CardHeader className="p-3 pb-0">
                        <CardTitle className="text-center">Table {table.number}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 text-center">
                        <p className="text-sm">{table.seats} places</p>
                        <p
                          className={`text-xs font-medium mt-1 ${
                            table.status === "free"
                              ? "text-green-600"
                              : table.status === "occupied"
                                ? "text-blue-600"
                                : "text-amber-600"
                          }`}
                        >
                          {getTableStatusText(table.status)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-4">Menu</h2>
                <div className="mb-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <Button
                      variant={selectedCategory === "all" ? "default" : "outline"}
                      onClick={() => setSelectedCategory("all")}
                      className="whitespace-nowrap"
                    >
                      Tous
                    </Button>
                    {Array.from(new Set(menuItems.map((item) => item.category))).map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category)}
                        className="whitespace-nowrap"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredMenuItems.map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer hover:border-blue-300 transition-colors"
                      onClick={() => addItemToOrder(item)}
                    >
                      <div className="flex items-center p-3">
                        <div className="flex-1">
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-lg font-bold text-blue-600">{formatPrice(item.price)}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right panel - Current Order */}
          <div className="w-80 bg-white border-l border-gray-200 p-4 flex flex-col h-full">
            <h2 className="text-lg font-bold mb-4">Commande en cours</h2>

            {selectedTable ? (
              <div className="mb-4 p-2 bg-blue-50 rounded-md">
                <p className="font-medium">Table {selectedTable.number}</p>
                <p className="text-sm text-gray-500">{selectedTable.seats} places</p>
              </div>
            ) : (
              <div className="mb-4 p-2 bg-amber-50 rounded-md">
                <p className="text-amber-700">Veuillez sélectionner une table</p>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              {currentOrder.items.length > 0 ? (
                <div className="space-y-2">
                  {currentOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 border-b group">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <p className="mr-2">{formatPrice(item.price * item.quantity)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeItemFromOrder(item.id)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p>Aucun article sélectionné</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total</span>
                <span>{formatPrice(currentOrder.total)}</span>
              </div>
              <Button className="w-full" disabled={currentOrder.items.length === 0} onClick={sendOrderToKitchen}>
                <ChefHat className="h-4 w-4 mr-2" />
                Envoyer à la cuisine
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
