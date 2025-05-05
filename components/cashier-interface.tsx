"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"
import {
  CalendarIcon,
  Clock,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
  Pencil,
  Plus,
  Minus,
  Send,
  CreditCard,
  DollarSign,
  Printer,
  Package,
} from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import {
  getCashierOrders,
  getOrderByTableId,
  processPayment,
  createOrder,
  notifyKitchen,
  getMenuItems,
  getTables,
  type Order,
  type Table as TableType,
  type OrderItem,
 
} from "@/lib/sharedDataService"
import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface TableInterface {
  id: number
  num_table: number
  capacity: number
  created_at: string | null
  updated_at: string | null
  number: number
  seats: number
  status: "free" | "occupied" | "reserved"
}

interface Reservation {
  id: number
  client_name: string
  client_phone: string
  date: string // Format: YYYY-MM-DD
  hour: string // Format: HH:mm:ss
  duration: string // Assuming it's a string like "2.00"
  status: string // e.g., "pending"
  tables_id: number
  created_at: string
  table: TableInterface
}

interface PackDetail {
  item_id: number
  quantity: number
  menuItem?: MenuItem
}

interface Pack {
  id: number
  name: string
  description: string
  price: number
  is_available: boolean
  imageUrl?: string
  pack_details: PackDetail[]
}

const categoryMap: { [key: number]: string } = {
  1: "Burgers",
  2: "Tacos",
  3: "Frites",
  4: "Pizzas",
  5: "suchis",
  6: "Desserts",
  7: "Boissons",
 
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  catégory_id: number
  isAvailable: boolean
  imageUrl: string
}

export default function CashierInterface() {
  // Gestion des états
  const [activeTab, setActiveTab] = useState<"commandes" | "tables" | "planning" | "menu" | "packs">("commandes")
  const [loading, setLoading] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [newOrder, setNewOrder] = useState<{
    type: "sur place" | "à emporter" | "livraison"
    tableId?: number
    tableNumber?: number
    items: OrderItem[]
    total: number
  }>({
    type: "à emporter",
    items: [],
    total: 0,
  })
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("carte")
  const [amountReceived, setAmountReceived] = useState<string>("")
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [reservationTime, setReservationTime] = useState<string>("19:00")
  const [reservationName, setReservationName] = useState<string>("")
  const [reservationGuests, setReservationGuests] = useState<string>("2")
  const [reservationPhone, setReservationPhone] = useState<string>("")
  const [reservationNote, setReservationNote] = useState<string>("")
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isEditingReservation, setIsEditingReservation] = useState(false)
  const [tables, setTables] = useState<TableInterface[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [newOrderNotification, setNewOrderNotification] = useState(false)
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [customerAddress, setCustomerAddress] = useState<string>("")
  const [orderToProcess, setOrderToProcess] = useState<Order | null>(null)
  const [todayReservations, setTodayReservations] = useState<Reservation[] | undefined>(undefined)
  const [reservationsbyDate, setReservationsbyDate] = useState<Reservation[] | undefined>(undefined)
  const [editTableDialogOpen, setEditTableDialogOpen] = useState(false)
  const [tableFormData, setTableFormData] = useState<{
    id?: number
    num_table: number
    capacity: number
  }>({
    num_table: 1,
    capacity: 2,
  })
  const [searchTerm, setSearchTerm] = useState<string>("")

  const receiptRef = useRef<HTMLDivElement>(null)

  // Fetch today's reservations
  const fetchTodayReservations = async () => {
    try {
      const today = new Date()
      const formattedDate = formatLocalDate(today)
      
      const response = await api.get(`/reservation?date=${formattedDate}`)
      if (response.data?.reservations) {
        setTodayReservations(response.data.reservations)
      } else {
        setTodayReservations([])
      }
    } catch (error) {
      console.error("Échec de récupération des réservations:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations du jour",
        variant: "destructive",
      })
      setTodayReservations([])
    }
  }

  // Update the useEffect for loading initial data
  useEffect(() => {
    loadData()
    const today = new Date()
    setDate(today) // Set initial date to today
    fetchTodayReservations()
    fetchReservationsbyDate(today) // Load today's reservations for planning
    // No polling/interval here
  }, [])

  // Update the fetchReservationsbyDate function
  const fetchReservationsbyDate = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split("T")[0]
      console.log("Fetching reservations for:", formattedDate)

      const response = await api.get(`/reservation?date=${formattedDate}`)
      console.log("Response:", response.data.reservations)

      if (response.data && response.data.reservations) {
        setReservationsbyDate(response.data.reservations)
        
        // If the date is today, also update todayReservations
        if (date.toDateString() === new Date().toDateString()) {
          setTodayReservations(response.data.reservations)
        }
      } else {
        setReservationsbyDate([])
      }
    } catch (error) {
      console.error("Échec de récupération des réservations:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les réservations",
        variant: "destructive",
      })
      setReservationsbyDate([])
    }
  }

  // Update the useEffect for date changes
  useEffect(() => {
    if (date && activeTab === "planning") {
      fetchReservationsbyDate(date)
    }
  }, [date, activeTab])

  // fetch tables
  const fetchTables = async () => {
    try {
      const response = await api.get("/tables")
      if (response.data && response.data.tables) {
        setTables(response.data.tables)
        console.log("Tables:", response.data.tables)
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des tables:", error)
      // Fallback to mock data from sharedDataService
     
      const mockTables = getTables().map((table: { id: number; number: number; seats: number }) => ({
        id: table.id,
        num_table: table.number,
        capacity: table.seats,
        created_at: null,
        updated_at: null,
        number: table.number,
        seats: table.seats,
        status: "free" as "free",
      }))
      setTables(mockTables)
      toast({
        title: "Mode démo",
        description: "Utilisation des données de démonstration pour les tables",
      })
    }
  }

  useEffect(() => {
    fetchTables()
  }, [])


  const deleteTable = async (tableId: number) => {
    try {
      await api.delete(`/tables/${tableId}`);
      fetchTables(); // Refresh table list
      toast({
        title: "Succès",
        description: "Table supprimée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la table:", error);
      toast({
        title: "Erreur",
        description: "Échec de la suppression de la table",
        variant: "destructive",
      });
    }
  };


  // Charger les données depuis le service partagé
  const loadData = async () => {
    setLoading(true)
    try {
      // Get orders from API
      const ordersResponse = await api.get("/orders")
      if (ordersResponse.data && Array.isArray(ordersResponse.data.orders)) {
        const processedOrders = ordersResponse.data.orders.map((order: any) => {
          const orderItems = order.order_details.map((detail: any, index: number) => {
            const menuItem = menuItems.find((item) => item.id === detail.item_id)
            return {
              id: index + 1,
              menuItemId: detail.item_id,
              name: menuItem ? menuItem.name : `Item #${detail.item_id}`,
              price: detail.price,
              quantity: detail.quantity,
            }
          })

          return {
            id: order.id,
            tableId: order.table_id,
            tableNumber: order.table_id,
            type: order.type || "sur place",
            status: order.status,
            items: orderItems,
            total: orderItems.reduce((sum: number, item: { price: number; quantity: number }) => sum + (item.price * item.quantity), 0),
            createdAt: order.date,
            notifiedKitchen: order.notified_kitchen || false,
            notifiedCashier: order.notified_cashier || false,
          }
        })
        setOrders(processedOrders)
      }

      // Get menu items
      try {
        const response = await api.get("/menuItems")
        if (response.data && response.data["Menu Items"]) {
          setMenuItems(
            response.data["Menu Items"].map((item: any) => ({
              ...item,
              imageUrl: item.imageUrl || "/placeholder.svg",
            })),
          )
        } else {
          throw new Error("Invalid menu items response format")
        }
      } catch (error) {
        console.error("Error loading menu items:", error)
        toast({ 
          title: "Erreur", 
          description: "Échec du chargement des plats", 
          variant: "destructive" 
        })
      }

      // Get packs with their details
      const packsResponse = await api.get("/packs")
      if (packsResponse.data && Array.isArray(packsResponse.data.packs)) {
        const menuItemsMap = new Map(menuItems.map(item => [item.id, item]))
        
        const loadedPacks = packsResponse.data.packs.map((pack: any) => {
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
      console.error("Error loading data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ajouter un article à la commande en cours
  const addItemToOrder = (item: MenuItem) => {
    const existingItem = newOrder.items.find((orderItem) => orderItem.menuItemId === item.id)

    if (existingItem) {
      // Incrémenter la quantité si l'article existe déjà
      const updatedItems = newOrder.items.map((orderItem) =>
        orderItem.menuItemId === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem,
      )

      setNewOrder({
        ...newOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      })
    } else {
      // Ajouter un nouvel article
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
  }

  // Mettre à jour la quantité d'un article
  const updateItemQuantity = (itemId: number, change: number) => {
    const updatedItems = newOrder.items
      .map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
      .filter((item) => item.quantity > 0) // Supprimer les articles avec quantité 0

    setNewOrder({
      ...newOrder,
      items: updatedItems,
      total: calculateTotal(updatedItems),
    })
  }

  // Calculer le total
  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Formater le prix
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  // Traiter le paiement
  const handleProcessPayment = () => {
    if (!orderToProcess) return

    processPayment(orderToProcess.id)
    setPaymentDialogOpen(false)
    setReceiptDialogOpen(true)
    loadData()
  }

  // Imprimer le reçu
  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write("<html><head><title>Ticket de caisse</title>")
        printWindow.document.write("<style>")
        printWindow.document.write(`
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 10px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 5px 0; }
          .total { font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        `)
        printWindow.document.write("</style></head><body>")
        printWindow.document.write(receiptRef.current.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()
        printWindow.print()
      }
    }

    // Réinitialiser les états
    setCurrentOrder(null)
    setSelectedTable(null)
    setReceiptDialogOpen(false)
    setAmountReceived("")
    setOrderToProcess(null)
    setNewOrder({
      type: newOrder.type,
      items: [],
      total: 0,
    })
    setCustomerPhone("")
    setCustomerName("")
    setCustomerAddress("")
    loadData()
  }

  // Calculer la monnaie à rendre
  const calculateChange = (): number => {
    if (!orderToProcess) return 0
    const received = Number.parseFloat(amountReceived) || 0
    return Math.max(0, received - orderToProcess.total)
  }

  // Sélectionner une table
  const selectTable = (table: TableType) => {
    setSelectedTable(table)
    setActiveTab("commandes")

    // Récupérer les commandes de la table
    const tableOrders = orders.filter(order => order.tableId === table.id)
    if (tableOrders.length > 0) {
      setCurrentOrder(tableOrders[0])
      setOrderToProcess(tableOrders[0])
      
      // Si une commande est prête, ouvrir directement la boîte de dialogue de paiement
      if (tableOrders.some(order => order.status === "ready" && !order.notifiedCashier)) {
        setPaymentDialogOpen(true)
      }
    } else {
      setCurrentOrder(null)
      setNewOrder({
        type: "sur place",
        tableId: table.id,
        tableNumber: table.number,
        items: [],
        total: 0,
      })
    }
  }

  // Créer et envoyer une nouvelle commande à la cuisine et traiter le paiement
  const handleCreateAndPayOrder = () => {
    if (newOrder.items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter des articles à la commande",
        variant: "destructive",
      })
      return
    }

    if (newOrder.type === "livraison" && (!customerPhone || !customerName || !customerAddress)) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir les informations du client pour la livraison",
        variant: "destructive",
      })
      return
    }

    const createdOrder = createOrder({
      ...newOrder,
      status: "pending",
    })

    notifyKitchen(createdOrder.id)

    toast({
      title: "Commande créée",
      description: "La commande a été envoyée à la cuisine",
    })

    setOrderToProcess(createdOrder)
    setPaymentDialogOpen(true)
  }

  // Réinitialiser le formulaire de réservation
  const resetReservationForm = () => {
    setReservationName("")
    setReservationGuests("2")
    setDate(new Date())
    setReservationTime("19:00")
    setReservationPhone("")
    setReservationNote("")
    setSelectedReservation(null)
    setIsEditingReservation(false)
  }

  // Ajouter ou modifier une réservation
  const handleReservationSubmit = async () => {
    if (!date || !reservationName || !reservationTime) return

    // Check if the date is in the past
    const reservationDate = new Date(date)
    reservationDate.setHours(
      Number.parseInt(reservationTime.split(":")[0]),
      Number.parseInt(reservationTime.split(":")[1]),
    )

    if (reservationDate < new Date()) {
      toast({
        title: "Date invalide",
        description: "Vous ne pouvez pas faire une réservation dans le passé",
        variant: "destructive",
      })
      return
    }

    try {
      const reservationData = {
        client_name: reservationName,
        number_of_persones: Number.parseInt(reservationGuests),
        date: date.toISOString().split("T")[0],
        hour: reservationTime,
        client_phone: reservationPhone,
        note: reservationNote,
        tables_id: selectedTable?.id || null,
        duration: 2,
      }

      if (isEditingReservation && selectedReservation) {
        await api.put(`/reservation/${selectedReservation.id}`, reservationData)
        // Add success alert
        const toast = document.createElement("div")
        toast.textContent = "Réservation modifiée avec succès."
        toast.style.position = "fixed"
        toast.style.bottom = "32px"
        toast.style.right = "32px"
        toast.style.background = "#f97316"
        toast.style.color = "#fff"
        toast.style.padding = "14px 24px"
        toast.style.borderRadius = "8px"
        toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"
        toast.style.fontSize = "1rem"
        toast.style.zIndex = "9999"
        toast.style.opacity = "0"
        toast.style.transition = "opacity 0.3s"
        document.body.appendChild(toast)
        setTimeout(() => { toast.style.opacity = "1" }, 10)
        setTimeout(() => {
          toast.style.opacity = "0"
          setTimeout(() => document.body.removeChild(toast), 300)
        }, 2000)
      } else {
        await api.post("/reservation", reservationData)
        // Add success alert
        const toast = document.createElement("div")
        toast.textContent = "Réservation ajoutée avec succès."
        toast.style.position = "fixed"
        toast.style.bottom = "32px"
        toast.style.right = "32px"
        toast.style.background = "#f97316"
        toast.style.color = "#fff"
        toast.style.padding = "14px 24px"
        toast.style.borderRadius = "8px"
        toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"
        toast.style.fontSize = "1rem"
        toast.style.zIndex = "9999"
        toast.style.opacity = "0"
        toast.style.transition = "opacity 0.3s"
        document.body.appendChild(toast)
        setTimeout(() => { toast.style.opacity = "1" }, 10)
        setTimeout(() => {
          toast.style.opacity = "0"
          setTimeout(() => document.body.removeChild(toast), 300)
        }, 2000)
      }

      // Refresh both today's reservations and the selected date's reservations
      fetchTodayReservations()
      if (date) {
        fetchReservationsbyDate(date)
      }

      resetReservationForm()
      setReservationDialogOpen(false)
    } catch (error) {
      console.error("Erreur lors de l'opération sur la réservation:", error)
      toast({
        title: "Erreur",
        description: "Échec de l'opération sur la réservation",
        variant: "destructive",
      })
    }
  }

  // Modifier une réservation
  const editReservation = async (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setReservationName(reservation.client_name)
    setDate(typeof reservation.date === "string" ? new Date(reservation.date) : reservation.date)
    setReservationTime(reservation.hour)
    setReservationPhone(reservation.client_phone)
    setIsEditingReservation(true)
    setReservationDialogOpen(true)
  }

  // Supprimer une réservation
  const deleteReservation = async (id: number) => {
    try {
      await api.delete(`/reservation/${id}`)
      fetchTodayReservations()
      toast({
        title: "Succès",
        description: "Réservation supprimée avec succès",
      })
    } catch (error) {
      console.error("Erreur lors de la suppression de la réservation:", error)
      toast({
        title: "Erreur",
        description: "Échec de la suppression de la réservation",
        variant: "destructive",
      })
    }
  }

  // Obtenir la couleur du statut de la table
  const getTableStatusColor = (status: string) => {
    console.log("Status received:", status); // Debug line
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

  // Obtenir le texte du statut de la table
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

  // Update the filteredMenuItems to match the menu management implementation
  const filteredMenuItems = menuItems.filter((item) => {
    const categoryName = categoryMap[item.catégory_id] || ""
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || categoryName === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "commandes" | "tables" | "planning" | "menu" | "packs")} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 w-full bg-orange-50">
          <TabsTrigger
            value="commandes"
            className={`flex items-center gap-2 border-b-2 ${
              activeTab === "commandes"
                ? "border-orange-500 text-orange-700"
                : "border-transparent hover:border-orange-400"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Commandes
            {newOrderNotification && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">Nouveau</span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="tables"
            className={`flex items-center gap-2 border-b-2 ${
              activeTab === "tables"
                ? "border-orange-500 text-orange-700"
                : "border-transparent hover:border-orange-400"
            }`}
          >
            <Utensils className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className={`flex items-center gap-2 border-b-2 ${
              activeTab === "planning"
                ? "border-orange-500 text-orange-700"
                : "border-transparent hover:border-orange-400"
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            Planning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commandes" className="flex-1 flex flex-col md:flex-row gap-4 mt-4">
          {/* Articles du menu */}
          <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-auto">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold">Menu</h3>
                <div className="flex gap-2 ">
                  <Select 
                    value={newOrder.type}
                    onValueChange={(value: "sur place" | "à emporter" | "livraison") =>
                      setNewOrder({ ...newOrder, type: value })
                    }
                       >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Type de commande" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sur place">Sur place</SelectItem>
                      <SelectItem value="à emporter">À emporter</SelectItem>
                      <SelectItem value="livraison">Livraison</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newOrder.type === "livraison" && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <h4 className="font-medium mb-2">Informations de livraison</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="customer-name">Nom du client</Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Nom du client"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-phone">Téléphone</Label>
                      <Input
                        id="customer-phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="06 XX XX XX XX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-address">Adresse</Label>
                      <Input
                        id="customer-address"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Adresse de livraison"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className="whitespace-nowrap"
                >
                  Tous
                </Button>
                {Array.from(new Set(menuItems.map((item) => categoryMap[item.catégory_id]))).filter(Boolean).map((category) => (
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredMenuItems.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => addItemToOrder(item)}
                >
                  <div className="relative h-44 w-full">
                    <Image
                      src={item.imageUrl || "/placeholder.svg?height=128&width=200"}
                      alt={item.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <p className="text-lg font-bold text-blue-600">{formatPrice(item.price)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Commande en cours */}
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Nouvelle commande</h3>
              <div className="text-sm text-gray-500">
                {newOrder.type === "sur place"
                  ? "Sur place"
                  : newOrder.type === "à emporter"
                    ? "À emporter"
                    : "Livraison"}
              </div>
            </div>

            {selectedTable && newOrder.type === "sur place" && (
              <div className="mb-4 p-2 bg-blue-50 rounded-md flex items-center justify-between">
                <div>
                  <span className="font-medium">Table {selectedTable.number}</span>
                  <span className="text-sm text-gray-500 ml-2">({selectedTable.seats} places)</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-auto">
              {newOrder.items.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-center">Qté</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateItemQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatPrice(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>Aucun article dans la commande</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total</span>
                <span>{formatPrice(newOrder.total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setNewOrder({
                      ...newOrder,
                      items: [],
                      total: 0,
                    })
                  }
                  disabled={newOrder.items.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Annuler
                </Button>

                <Button className="w-full" disabled={newOrder.items.length === 0} onClick={handleCreateAndPayOrder}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer et Payer
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tables" className="flex-1 mt-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Plan des tables</h3>
              <div className="text-sm text-gray-500">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span> Libre
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mx-1 ml-3"></span> Occupée
                <span className="inline-block w-3 h-3 rounded-full bg-amber-500 mx-1 ml-3"></span> Réservée
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => {
                const tableOrders = orders.filter(order => order.tableId === table.id)
                const hasActiveOrder = tableOrders.some(order => order.status === "ready")
                const isOccupied = tableOrders.some(order => order.status !== "paid")

                return (
                  <Card
                    key={table.id}
                    className={`cursor-pointer hover:border-blue-300 transition-colors relative ${
                      isOccupied ? "border-blue-300 bg-blue-50" : "border-gray-300 bg-gray-50"
                    }`}
                    onClick={() => selectTable(table)}
                  >
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm flex justify-between items-center">
                        <span>Table {table.num_table}</span>
                        <Badge className={isOccupied ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                          {isOccupied ? "Occupée" : "Libre"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-1">
                      <p className="text-lg font-bold text-blue-600">{table.capacity} places</p>
                      {isOccupied && (
                        <div className="mt-2 space-y-2">
                          <Button
                            className="w-full bg-green-500 hover:bg-green-600 text-white text-xs py-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              const readyOrder = tableOrders.find(order => 
                                order.status === "ready" && !order.notifiedCashier
                              )
                              if (readyOrder) {
                                setOrderToProcess(readyOrder)
                                setPaymentDialogOpen(true)
                              } else {
                                selectTable(table)
                              }
                            }}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {hasActiveOrder ? "Encaisser" : "Voir commandes"}
                          </Button>
                          {tableOrders.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {tableOrders.length} commande{tableOrders.length > 1 ? 's' : ''} en cours
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Add Table Button */}
            <Button
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                setSelectedTable(null)
                setEditTableDialogOpen(true)
              }}
            >
              <Plus size={18} className="mr-2" />
              Ajouter une table
            </Button>

            <div className="mt-6 border-t pt-4">
              <h4 className="font-medium mb-3">Réservations du jour</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayReservations ? (
                  todayReservations.length > 0 ? (
                    todayReservations.map((reservation) => (
                      <div key={reservation.id} className="border rounded-md p-3 bg-blue-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div>
                              <span className="font-medium">{reservation.client_name}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{reservation.hour}</span>
                              {reservation.tables_id && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>Table {reservation.tables_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => editReservation(reservation)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-red-500"
                              onClick={() => deleteReservation(reservation.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-4 text-gray-500">
                      Aucune réservation pour aujourd'hui
                    </div>
                  )
                ) : (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    Chargement des réservations...
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="flex-1 mt-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-bold mb-4">Planning des réservations</h3>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <Card>
                  <CardHeader>
                    <CardTitle>Calendrier</CardTitle>
                    <CardDescription>Sélectionnez une date pour voir les réservations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate)
                          if (newDate) {
                            fetchReservationsbyDate(newDate)
                          }
                        }}
                        className="rounded-md border"
                        locale={fr}
                      />
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">
                        Réservations pour {date ? format(date, "dd MMMM yyyy", { locale: fr }) : "aujourd'hui"}
                      </h4>
                      <div className="space-y-2" id="date-reservations">
                        {reservationsbyDate && reservationsbyDate.length > 0 ? (
                          reservationsbyDate.map((reservation) => (
                            <div key={reservation.id} className="p-2 border rounded-md flex justify-between items-center">
                              <div>
                                <div className="font-medium">{reservation.client_name}</div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <span className="mr-1">⏱</span>
                                  <span>{reservation.hour}</span>
                                  {reservation.tables_id && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span>Table {reservation.tables_id}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => editReservation(reservation)}
                                >
                                  Modifier
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => deleteReservation(reservation.id)}
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-center py-2">
                            Aucune réservation pour cette date
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-full md:w-1/2">
                <Card>
                  <CardHeader>
                    <CardTitle>Nouvelle réservation</CardTitle>
                    <CardDescription>Ajouter une réservation au planning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reservation-name">Nom du client</Label>
                          <Input
                            id="reservation-name"
                            placeholder="Nom du client"
                            value={reservationName}
                            onChange={(e) => setReservationName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reservation-guests">Nombre de personnes</Label>
                          <Input
                            id="reservation-guests"
                            type="number"
                            placeholder="2"
                            value={reservationGuests}
                            onChange={(e) => setReservationGuests(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                initialFocus
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dialog-time">Heure</Label>
                          <Input
                            id="dialog-time"
                            type="time"
                            value={reservationTime}
                            onChange={(e) => setReservationTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reservation-phone">Téléphone</Label>
                        <Input
                          id="reservation-phone"
                          placeholder="06 XX XX XX XX"
                          value={reservationPhone}
                          onChange={(e) => setReservationPhone(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reservation-note">Note</Label>
                        <Input
                          id="reservation-note"
                          placeholder="Informations supplémentaires"
                          value={reservationNote}
                          onChange={(e) => setReservationNote(e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-black text-white cursor-pointer" onClick={handleReservationSubmit}>
                      {isEditingReservation ? "Modifier la réservation" : "Ajouter la réservation"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogue de paiement */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Paiement</DialogTitle>
            <DialogDescription>
              Montant total: {orderToProcess ? formatPrice(orderToProcess.total) : formatPrice(0)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-method">Méthode de paiement</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method">
                    <SelectValue placeholder="Choisir une méthode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carte">Carte bancaire</SelectItem>
                    <SelectItem value="espèces">Espèces</SelectItem>
                    <SelectItem value="chèque">Chèque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMethod === "espèces" && (
                <div className="space-y-2">
                  <Label htmlFor="amount-received">Montant reçu</Label>
                  <Input
                    id="amount-received"
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            {paymentMethod === "espèces" && amountReceived && (
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="flex justify-between">
                  <span>Montant reçu:</span>
                  <span>{formatPrice(Number.parseFloat(amountReceived) || 0)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Monnaie à rendre:</span>
                  <span>{formatPrice(calculateChange())}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleProcessPayment}>
              {paymentMethod === "carte" ? (
                <>
                  <CreditCard className="h-4 w-4 mr-2 " />
                  Payer par carte
                </>
              ) : paymentMethod === "espèces" ? (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Encaisser
                </>
              ) : (
                "Valider le paiement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue du ticket */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket de paiement</DialogTitle>
            <DialogDescription>Paiement effectué avec succès</DialogDescription>
          </DialogHeader>

          <div className="border rounded-md p-4 my-4">
            <div ref={receiptRef}>
              <div className="header">
                <div className="flex justify-center mb-2">
                  <Image
                    src="/ll.png"
                    alt="OLIRAB FAST FOOD Logo"
                    width={60}
                    height={60}
                    className="mx-auto"
                    priority
                  />
                </div>
                <h3 className="text-lg font-bold">OLIRAB FAST FOOD</h3>
                <p>50 Rue de jijel, ben ch3ibon  </p>
                <p>Tel: 01 23 45 67 89</p>
                <p>{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
              </div>

              <div className="divider"></div>

              <div>
                <p>Type: {orderToProcess?.type}</p>
                {selectedTable && <p>Table: {selectedTable.number}</p>}
                <p>Commande #{orderToProcess?.id}</p>
              </div>

              <div className="divider"></div>

              {orderToProcess?.items.map((item) => (
                <div key={item.id} className="item">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}

              <div className="divider"></div>

              <div className="total">
                <div className="item">
                  <span>TOTAL</span>
                  <span>{orderToProcess ? formatPrice(orderToProcess.total) : formatPrice(0)}</span>
                </div>

                <div className="item">
                  <span>Paiement par {paymentMethod}</span>
                  <span>{orderToProcess ? formatPrice(orderToProcess.total) : formatPrice(0)}</span>
                </div>

                {paymentMethod === "espèces" && amountReceived && (
                  <>
                    <div className="item">
                      <span>Montant reçu</span>
                      <span>{formatPrice(Number.parseFloat(amountReceived) || 0)}</span>
                    </div>
                    <div className="item">
                      <span>Monnaie rendue</span>
                      <span>{formatPrice(calculateChange())}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="divider"></div>

              <div className="footer">
                 <div className="border p-1.5 rounded">
                    <Image
                      src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://olirab-fastfood.com/menu"
                      alt="QR Code Menu"
                      width={80}
                      height={80}
                      className="print:w-16 print:h-16"
                    />
                  </div>
                <p>Merci de votre visite!</p>
                <p>TVA: FR 12 345 678 901</p>

               
              </div>
             
                
            </div>
          </div>

          <DialogFooter >
            <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
              Fermer
            </Button>
            <Button onClick={printReceipt} className="bg-green-500 hover:bg-green-600 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Imprimer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue de réservation */}
      <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingReservation ? "Modifier la réservation" : "Nouvelle réservation"}</DialogTitle>
            <DialogDescription>
              {isEditingReservation
                ? "Modifiez les détails de la réservation"
                : "Remplissez les informations pour créer une nouvelle réservation"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-name">Nom du client</Label>
                <Input
                  id="dialog-name"
                  placeholder="Nom du client"
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-guests">Nombre de personnes</Label>
                <Input
                  id="dialog-guests"
                  type="number"
                  placeholder="2"
                  value={reservationGuests}
                  onChange={(e) => setReservationGuests(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-amber-100">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus locale={fr} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-time">Heure</Label>
                <Input
                  id="dialog-time"
                  type="time"
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-phone">Téléphone</Label>
              <Input
                id="dialog-phone"
                placeholder="06 XX XX XX XX"
                value={reservationPhone}
                onChange={(e) => setReservationPhone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-note">Note</Label>
              <Input
                id="dialog-note"
                placeholder="Informations supplémentaires"
                value={reservationNote}
                onChange={(e) => setReservationNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetReservationForm()
                setReservationDialogOpen(false)
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleReservationSubmit} className="bg-red-400">
              {isEditingReservation ? "Enregistrer les modifications" : "Ajouter la réservation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={editTableDialogOpen} onOpenChange={setEditTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTable ? "Modifier la table" : "Ajouter une table"}</DialogTitle>
            <DialogDescription>
              {selectedTable
                ? "Modifiez les informations de la table"
                : "Remplissez les informations pour ajouter une nouvelle table"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="table-number">Numéro de table</Label>
                <Input
                  id="table-number"
                  type="number"
                  value={tableFormData.num_table}
                  onChange={(e) => setTableFormData({ ...tableFormData, num_table: Number(e.target.value) })}
                  min="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table-capacity">Capacité (places)</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  value={tableFormData.capacity}
                  onChange={(e) => setTableFormData({ ...tableFormData, capacity: Number(e.target.value) })}
                  min="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            {selectedTable && (
              <Button 
                variant="destructive"
                onClick={async () => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cette table ?")) {
                    await deleteTable(selectedTable.id);
                    setEditTableDialogOpen(false);
                  }
                }}
                className="mr-auto bg-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setEditTableDialogOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600"
              onClick={async () => {
                try {
                  if (selectedTable) {
                    // Mise à jour de la table existante
                    await api.put(`/tables/${selectedTable.id}`, {
                        num_table: tableFormData.num_table,
                        capacity: tableFormData.capacity
                    });
                    // Add success alert for table update
                    const toast = document.createElement("div")
                    toast.textContent = "Table mise à jour avec succès."
                    toast.style.position = "fixed"
                    toast.style.bottom = "32px"
                    toast.style.right = "32px"
                    toast.style.background = "#f97316"
                    toast.style.color = "#fff"
                    toast.style.padding = "14px 24px"
                    toast.style.borderRadius = "8px"
                    toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"
                    toast.style.fontSize = "1rem"
                    toast.style.zIndex = "9999"
                    toast.style.opacity = "0"
                    toast.style.transition = "opacity 0.3s"
                    document.body.appendChild(toast)
                    setTimeout(() => { toast.style.opacity = "1" }, 10)
                    setTimeout(() => {
                      toast.style.opacity = "0"
                      setTimeout(() => document.body.removeChild(toast), 300)
                    }, 2000)
                  } else {
                    // Création d'une nouvelle table
                    await api.post("/tables", {
                        num_table: tableFormData.num_table,
                        capacity: tableFormData.capacity,
                        status: "free"
                    });
                    // Add success alert for new table
                    const toast = document.createElement("div")
                    toast.textContent = "Table ajoutée avec succès."
                    toast.style.position = "fixed"
                    toast.style.bottom = "32px"
                    toast.style.right = "32px"
                    toast.style.background = "#f97316"
                    toast.style.color = "#fff"
                    toast.style.padding = "14px 24px"
                    toast.style.borderRadius = "8px"
                    toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"
                    toast.style.fontSize = "1rem"
                    toast.style.zIndex = "9999"
                    toast.style.opacity = "0"
                    toast.style.transition = "opacity 0.3s"
                    document.body.appendChild(toast)
                    setTimeout(() => { toast.style.opacity = "1" }, 10)
                    setTimeout(() => {
                      toast.style.opacity = "0"
                      setTimeout(() => document.body.removeChild(toast), 300)
                    }, 2000)
                  }
                  
                  fetchTables(); // Rafraîchir la liste des tables
                  setEditTableDialogOpen(false);
                  setTableFormData({ num_table: 1, capacity: 2 }); // Réinitialiser le formulaire

                } catch (error) {
                  console.error("Erreur lors de l'opération sur la table:", error);
                  toast({
                    title: "Erreur",
                    description: "Échec de l'opération sur la table",
                    variant: "destructive",
                  });
                }
              }}
            >
              {selectedTable ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
