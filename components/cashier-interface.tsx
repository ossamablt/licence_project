"use client"
import React from "react";
import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import Image from "next/image"
import {
  CalendarIcon,
  Clock,
  CreditCard,
  DollarSign,
  Printer,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
  Pencil,
  Plus,
  Minus,
  Send,
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
  getTables,
  getOrderByTableId,
  processPayment,
  createOrder,
  notifyKitchen,
  getMenuItems,
  type Order,
  type Table as TableType,
  type OrderItem,
  type MenuItem,
} from "@/lib/sharedDataService"
import api from '@/lib/api';

const CashierInterface = () => {

  const [activeTab, setActiveTab] = useState("commandes")
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
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [isEditingReservation, setIsEditingReservation] = useState(false)
  const [reservations, setReservations] = useState([
    {
      id: 1,
      name: "Dupont",
      guests: 4,
      date: new Date(),
      time: "19:30",
      table: 3,
      phone: "06 12 34 56 78",
      note: "Près de la fenêtre",
    },
    { id: 2, name: "Martin", guests: 2, date: new Date(), time: "20:00", table: 8, phone: "06 23 45 67 89", note: "" },
    {
      id: 3,
      name: "Groupe Entreprise",
      guests: 8,
      date: new Date(),
      time: "12:30",
      table: 7,
      phone: "06 34 56 78 90",
      note: "Anniversaire d'entreprise",
    },
  ])
  const [tables, setTables] = useState<TableType[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [newOrderNotification, setNewOrderNotification] = useState(false)
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [customerAddress, setCustomerAddress] = useState<string>("")
  const [orderToProcess, setOrderToProcess] = useState<Order | null>(null)

  const receiptRef = useRef<HTMLDivElement>(null)

  // Load data on component mount and set up polling
  useEffect(() => {
    // Load initial data
    loadData()
    setMenuItems(getMenuItems())

    // Set up polling for data refresh
    const intervalId = setInterval(() => {
      loadData()
    }, 5000) // Poll every 5 seconds

    return () => {
      clearInterval(intervalId) // Clean up on unmount
    }
  }, [])

  // Load data from shared service
  const loadData = () => {
    const cashierOrders = getCashierOrders()
    const allTables = getTables()

    // Check for new orders
    if (orders.length > 0 && cashierOrders.length > orders.length) {
      setNewOrderNotification(true)
      toast({
        title: "Nouvelle commande à encaisser",
        description: "Une nouvelle commande est prête pour paiement",
      })
    }

    setOrders(cashierOrders)
    setTables(allTables)
  }

  // Add item to current order
  const addItemToOrder = (item: MenuItem) => {
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
  }

  // Update item quantity
  const updateItemQuantity = (itemId: number, change: number) => {
    const updatedItems = newOrder.items
      .map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
      .filter((item) => item.quantity > 0) // Remove items with quantity 0

    setNewOrder({
      ...newOrder,
      items: updatedItems,
      total: calculateTotal(updatedItems),
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

  // Process payment
  const handleProcessPayment = () => {
    if (!orderToProcess) return

    // Process payment in shared data
    processPayment(orderToProcess.id)

    // Show receipt dialog
    setPaymentDialogOpen(false)
    setReceiptDialogOpen(true)

    // Refresh data
    loadData()
  }

  // Print receipt
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

    // Reset current order
    setCurrentOrder(null)
    setSelectedTable(null)
    setReceiptDialogOpen(false)
    setAmountReceived("")
    setOrderToProcess(null)

    // Reset new order
    setNewOrder({
      type: newOrder.type,
      items: [],
      total: 0,
    })

    // Reset customer info
    setCustomerPhone("")
    setCustomerName("")
    setCustomerAddress("")

    // Refresh data
    loadData()
  }

  // Calculate change
  const calculateChange = (): number => {
    if (!orderToProcess) return 0
    const received = Number.parseFloat(amountReceived) || 0
    return Math.max(0, received - orderToProcess.total)
  }

  // Select a table
  const selectTable = (table: TableType) => {
    setSelectedTable(table)

    // If table has an order, load it
    if (table.orderId) {
      const order = getOrderByTableId(table.id)
      if (order) {
        setCurrentOrder(order)
        setActiveTab("commandes")
      }
    } else {
      setCurrentOrder(null)
      // Set up a new order for this table
      setNewOrder({
        type: "sur place",
        tableId: table.id,
        tableNumber: table.number,
        items: [],
        total: 0,
      })
    }
  }

  // Create and send a new order to kitchen and process payment
  const handleCreateAndPayOrder = () => {
    if (newOrder.items.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez ajouter des articles à la commande",
        variant: "destructive",
      })
      return
    }

    // For delivery orders, check if we have customer info
    if (newOrder.type === "livraison" && (!customerPhone || !customerName || !customerAddress)) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir les informations du client pour la livraison",
        variant: "destructive",
      })
      return
    }

    // Create the order
    const createdOrder = createOrder({
      ...newOrder,
      status: "pending",
    })

    // Notify kitchen
    notifyKitchen(createdOrder.id)

    toast({
      title: "Commande créée",
      description: "La commande a été envoyée à la cuisine",
    })

    // Set the order for payment and open payment dialog directly
    setOrderToProcess(createdOrder)
    setPaymentDialogOpen(true)
  }
  // Reset reservation form
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

  // Add or edit reservation
  const handleReservationSubmit = async () => {
    if (!date || !reservationName || !reservationTime) return

    if (isEditingReservation && selectedReservation) {
      // Update existing reservation
      setReservations(
        reservations.map((res) =>
          res.id === selectedReservation.id
            ? {
              ...res,
              name: reservationName,
              guests: Number.parseInt(reservationGuests),
              date: date,
              time: reservationTime,
              phone: reservationPhone,
              note: reservationNote,
            }
            : res,
        ),
      )
    } else {
      // Add new reservation
      const newReservation = {
        name: reservationName,
        guests: Number.parseInt(reservationGuests),
        date: date,
        time: reservationTime,
        table: selectedTable ? selectedTable.number : null,
        phone: reservationPhone,
        note: reservationNote,
      }
      try {
        const response = await api.post('/reservation', newReservation)
        console.log('Réservation ajoutée avec succès:', response.data)

        // Update state with server response instead of local data
        setReservations([...reservations, response.data])
      } catch (error) {
        console.error("Erreur lors de l'ajout de la réservation:", error)
        toast({
          title: "Erreur",
          description: "Échec de l'ajout de la réservation",
          variant: "destructive",
        })
      }

      // Reset form
      resetReservationForm()
      setReservationDialogOpen(false)
    }



    // Edit reservation
    const editReservation = (reservation: any) => {
      setSelectedReservation(reservation)
      setReservationName(reservation.name)
      setReservationGuests(reservation.guests.toString())
      setDate(reservation.date)
      setReservationTime(reservation.time)
      setReservationPhone(reservation.phone)
      setReservationNote(reservation.note)
      setIsEditingReservation(true)
      setReservationDialogOpen(true)
    }

    // Delete reservation
    const deleteReservation = (id: number) => {
      setReservations(reservations.filter((res) => res.id !== id))
    }

    // Get reservations for selected date
    const getReservationsForDate = (selectedDate: Date | undefined) => {
      if (!selectedDate) return []

      return reservations.filter((res) => {
        const resDate = new Date(res.date)
        return (
          resDate.getDate() === selectedDate.getDate() &&
          resDate.getMonth() === selectedDate.getMonth() &&
          resDate.getFullYear() === selectedDate.getFullYear()
        )
      })
    }

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

    // Filter menu items by category
    const filteredMenuItems =
      selectedCategory === "all" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

    const todayReservations = getReservationsForDate(new Date())

    return (
      <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="commandes" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Commandes
              {newOrderNotification && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">Nouveau</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="tables" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Tables
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Planning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commandes" className="flex-1 flex flex-col md:flex-row gap-4 mt-4">
            {/* Menu Items */}
            <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-auto">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold">Menu</h3>
                  <div className="flex gap-2">
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

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredMenuItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => addItemToOrder(item)}
                  >
                    <div className="relative h-32 w-full">
                      <Image
                        src={item.image || "/placeholder.svg"}
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

            {/* Current Order */}
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
                {tables.map((table) => (
                  <Card
                    key={table.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${getTableStatusColor(table.status)} ${selectedTable?.id === table.id ? "ring-2 ring-blue-500" : ""
                      }`}
                    onClick={() => selectTable(table)}
                  >
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-center">Table {table.number}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 text-center">
                      <p className="text-sm">{table.seats} places</p>
                      <p
                        className={`text-xs font-medium mt-1 ${table.status === "free"
                          ? "text-green-600"
                          : table.status === "occupied"
                            ? "text-blue-600"
                            : "text-amber-600"
                          }`}
                      >
                        {getTableStatusText(table.status)}
                      </p>
                      {table.status === "occupied" && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            selectTable(table)
                            const order = getOrderByTableId(table.id)
                            if (order) {
                              setOrderToProcess(order)
                              setPaymentDialogOpen(true)
                            }
                          }}
                        >
                          Encaisser
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-3">Réservations du jour</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {todayReservations.map((reservation) => (
                    <div key={reservation.id} className="border rounded-md p-3 bg-blue-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {reservation.name} ({reservation.guests} pers.)
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{reservation.time}</span>
                            {reservation.table && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Table {reservation.table}</span>
                              </>
                            )}
                          </div>
                          {reservation.note && <p className="text-xs text-gray-500 mt-1">{reservation.note}</p>}
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
                  ))}
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
                          onSelect={setDate}
                          className="rounded-md border"
                          locale={fr}
                        />
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">
                          Réservations pour {date ? format(date, "dd MMMM yyyy", { locale: fr }) : "aujourd'hui"}
                        </h4>
                        <div className="space-y-2">
                          {getReservationsForDate(date).length > 0 ? (
                            getReservationsForDate(date).map((reservation) => (
                              <div
                                key={reservation.id}
                                className="p-2 border rounded-md flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-medium">
                                    {reservation.name} ({reservation.guests} pers.)
                                  </p>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    <span>{reservation.time}</span>
                                    {reservation.table && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span>Table {reservation.table}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => editReservation(reservation)}>
                                    Modifier
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-500 text-center py-2">Aucune réservation pour cette date</p>
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
                            <Label htmlFor="reservation-time">Heure</Label>
                            <Input
                              id="reservation-time"
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
                      <Button className="w-full" onClick={handleReservationSubmit}>
                        {isEditingReservation ? "Modifier la réservation" : "Ajouter la réservation"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
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
                    <CreditCard className="h-4 w-4 mr-2" />
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

        {/* Receipt Dialog */}
        <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ticket de paiement</DialogTitle>
              <DialogDescription>Paiement effectué avec succès</DialogDescription>
            </DialogHeader>

            <div className="border rounded-md p-4 my-4">
              <div ref={receiptRef}>
                <div className="header">
                  <h3 className="text-lg font-bold">OLIRAB FAST FOOD</h3>
                  <p>123 Rue de Paris, 75001 Paris</p>
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
                  <p>Merci de votre visite!</p>
                  <p>TVA: FR 12 345 678 901</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setReceiptDialogOpen(false)}>
                Fermer
              </Button>
              <Button onClick={printReceipt}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer le ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reservation Dialog */}
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
              <Button onClick={handleReservationSubmit}>
                {isEditingReservation ? "Enregistrer les modifications" : "Ajouter la réservation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }







};

export default CashierInterface;