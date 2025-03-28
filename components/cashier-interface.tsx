"use client"

import { useState, useRef } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  Clock,
  CreditCard,
  DollarSign,
  Minus,
  Plus,
  Printer,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
  Pencil,
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Types
interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  image?: string
}

interface OrderItem {
  id: number
  menuItemId: number
  name: string
  price: number
  quantity: number
}

interface TableType {
  id: number
  number: number
  seats: number
  status: "libre" | "occupée" | "réservée"
  order?: Order
}

interface Order {
  id: number
  tableId?: number
  type: "sur place" | "à emporter" | "livraison"
  status: "en cours" | "prêt" | "terminé"
  items: OrderItem[]
  total: number
  createdAt: Date
}

// Sample data
const menuItems: MenuItem[] = [
  { id: 1, name: "Burger Classic", category: "Burgers", price: 8.5 },
  { id: 2, name: "Burger Cheese", category: "Burgers", price: 9.5 },
  { id: 3, name: "Burger Double", category: "Burgers", price: 12.0 },
  { id: 4, name: "Frites", category: "Accompagnements", price: 3.5 },
  { id: 5, name: "Onion Rings", category: "Accompagnements", price: 4.0 },
  { id: 6, name: "Salade", category: "Accompagnements", price: 4.5 },
  { id: 7, name: "Coca-Cola", category: "Boissons", price: 2.5 },
  { id: 8, name: "Eau", category: "Boissons", price: 1.5 },
  { id: 9, name: "Bière", category: "Boissons", price: 4.0 },
  { id: 10, name: "Glace", category: "Desserts", price: 3.5 },
  { id: 11, name: "Brownie", category: "Desserts", price: 4.5 },
  { id: 12, name: "Menu Enfant", category: "Menus", price: 7.5 },
  { id: 13, name: "Menu Classique", category: "Menus", price: 12.5 },
  { id: 14, name: "Menu Maxi", category: "Menus", price: 15.0 },
]

const tables: TableType[] = [
  { id: 1, number: 1, seats: 2, status: "libre" },
  { id: 2, number: 2, seats: 2, status: "occupée" },
  { id: 3, number: 3, seats: 4, status: "libre" },
  { id: 4, number: 4, seats: 4, status: "réservée" },
  { id: 5, number: 5, seats: 6, status: "libre" },
  { id: 6, number: 6, seats: 6, status: "libre" },
  { id: 7, number: 7, seats: 8, status: "occupée" },
  { id: 8, number: 8, seats: 2, status: "libre" },
]

const orders: Order[] = [
  {
    id: 1,
    tableId: 2,
    type: "sur place",
    status: "en cours",
    items: [
      { id: 1, menuItemId: 1, name: "Burger Classic", price: 8.5, quantity: 2 },
      { id: 2, menuItemId: 4, name: "Frites", price: 3.5, quantity: 2 },
      { id: 3, menuItemId: 7, name: "Coca-Cola", price: 2.5, quantity: 2 },
    ],
    total: 29.0,
    createdAt: new Date(),
  },
  {
    id: 2,
    tableId: 7,
    type: "sur place",
    status: "en cours",
    items: [
      { id: 1, menuItemId: 13, name: "Menu Classique", price: 12.5, quantity: 4 },
      { id: 2, menuItemId: 9, name: "Bière", price: 4.0, quantity: 4 },
    ],
    total: 66.0,
    createdAt: new Date(),
  },
  {
    id: 3,
    type: "à emporter",
    status: "prêt",
    items: [
      { id: 1, menuItemId: 2, name: "Burger Cheese", price: 9.5, quantity: 1 },
      { id: 2, menuItemId: 4, name: "Frites", price: 3.5, quantity: 1 },
    ],
    total: 13.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: 4,
    type: "livraison",
    status: "terminé",
    items: [
      { id: 1, menuItemId: 14, name: "Menu Maxi", price: 15.0, quantity: 2 },
      { id: 2, menuItemId: 10, name: "Glace", price: 3.5, quantity: 2 },
    ],
    total: 37.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
]

export function CashierInterface() {
  const [activeTab, setActiveTab] = useState("commandes")
  const [currentOrder, setCurrentOrder] = useState<Order>({
    id: orders.length + 1,
    type: "sur place",
    status: "en cours",
    items: [],
    total: 0,
    createdAt: new Date(),
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

  const receiptRef = useRef<HTMLDivElement>(null)

  // Filter menu items by category
  const filteredMenuItems =
    selectedCategory === "all" ? menuItems : menuItems.filter((item) => item.category === selectedCategory)

  // Add item to current order
  const addItemToOrder = (item: MenuItem) => {
    const existingItem = currentOrder.items.find((orderItem) => orderItem.menuItemId === item.id)

    if (existingItem) {
      // Increment quantity if item already exists
      const updatedItems = currentOrder.items.map((orderItem) =>
        orderItem.menuItemId === item.id ? { ...orderItem, quantity: orderItem.quantity + 1 } : orderItem,
      )

      setCurrentOrder({
        ...currentOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      })
    } else {
      // Add new item
      const newItem: OrderItem = {
        id: currentOrder.items.length + 1,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }

      const updatedItems = [...currentOrder.items, newItem]

      setCurrentOrder({
        ...currentOrder,
        items: updatedItems,
        total: calculateTotal(updatedItems),
      })
    }
  }

  // Update item quantity
  const updateItemQuantity = (itemId: number, change: number) => {
    const updatedItems = currentOrder.items
      .map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          return { ...item, quantity: newQuantity }
        }
        return item
      })
      .filter((item) => item.quantity > 0) // Remove items with quantity 0

    setCurrentOrder({
      ...currentOrder,
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
  const processPayment = () => {
    // In a real app, this would handle payment processing
    console.log(`Payment processed: ${formatPrice(currentOrder.total)} via ${paymentMethod}`)

    // Show receipt dialog
    setPaymentDialogOpen(false)
    setReceiptDialogOpen(true)
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
    setCurrentOrder({
      id: currentOrder.id + 1,
      type: "sur place",
      status: "en cours",
      items: [],
      total: 0,
      createdAt: new Date(),
    })

    // Reset selected table if applicable
    if (selectedTable) {
      setSelectedTable(null)
    }

    setReceiptDialogOpen(false)
    setAmountReceived("")
  }

  // Calculate change
  const calculateChange = (): number => {
    const received = Number.parseFloat(amountReceived) || 0
    return Math.max(0, received - currentOrder.total)
  }

  // Select a table
  const selectTable = (table: TableType) => {
    if (table.status === "occupée") {
      // Find the order for this table
      const tableOrder = orders.find((order) => order.tableId === table.id)
      if (tableOrder) {
        setCurrentOrder(tableOrder)
      }
    }

    setSelectedTable(table)
    setCurrentOrder({
      ...currentOrder,
      tableId: table.id,
      type: "sur place",
    })
  }

  // Add or edit reservation
  const handleReservationSubmit = () => {
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
        id: Date.now(),
        name: reservationName,
        guests: Number.parseInt(reservationGuests),
        date: date,
        time: reservationTime,
        table: selectedTable ? selectedTable.number : null,
        phone: reservationPhone,
        note: reservationNote,
      }

      setReservations([...reservations, newReservation])
    }

    // Reset form
    resetReservationForm()
    setReservationDialogOpen(false)
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

  const todayReservations = getReservationsForDate(new Date())

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Commandes
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
              <h3 className="text-lg font-bold">Commande en cours</h3>
              <div className="flex gap-2">
                <Select
                  value={currentOrder.type}
                  onValueChange={(value: "sur place" | "à emporter" | "livraison") =>
                    setCurrentOrder({ ...currentOrder, type: value })
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

            {selectedTable && (
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
              {currentOrder.items.length > 0 ? (
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
                    {currentOrder.items.map((item) => (
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
                <span>{formatPrice(currentOrder.total)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setCurrentOrder({
                      ...currentOrder,
                      items: [],
                      total: 0,
                    })
                  }
                  disabled={currentOrder.items.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Annuler
                </Button>

                <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" disabled={currentOrder.items.length === 0}>
                      <DollarSign className="h-4 w-4 mr-2" />
                      Paiement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Paiement</DialogTitle>
                      <DialogDescription>Montant total: {formatPrice(currentOrder.total)}</DialogDescription>
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
                      <Button onClick={processPayment}>
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
                          <h3 className="text-lg font-bold">OLIRAB RESTAURANT</h3>
                          <p>123 Rue de Paris, 75001 Paris</p>
                          <p>Tel: 01 23 45 67 89</p>
                          <p>{format(new Date(), "dd/MM/yyyy HH:mm")}</p>
                        </div>

                        <div className="divider"></div>

                        <div>
                          <p>Type: {currentOrder.type}</p>
                          {selectedTable && <p>Table: {selectedTable.number}</p>}
                          <p>Commande #{currentOrder.id}</p>
                        </div>

                        <div className="divider"></div>

                        {currentOrder.items.map((item) => (
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
                            <span>{formatPrice(currentOrder.total)}</span>
                          </div>

                          <div className="item">
                            <span>Paiement par {paymentMethod}</span>
                            <span>{formatPrice(currentOrder.total)}</span>
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
                  className={`cursor-pointer ${
                    table.status === "libre"
                      ? "border-green-300 bg-green-50"
                      : table.status === "occupée"
                        ? "border-blue-300 bg-blue-50"
                        : "border-amber-300 bg-amber-50"
                  } ${selectedTable?.id === table.id ? "ring-2 ring-blue-500" : ""}`}
                  onClick={() => selectTable(table)}
                >
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-center">Table {table.number}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 text-center">
                    <p className="text-sm">{table.seats} places</p>
                    <p
                      className={`text-xs font-medium mt-1 ${
                        table.status === "libre"
                          ? "text-green-600"
                          : table.status === "occupée"
                            ? "text-blue-600"
                            : "text-amber-600"
                      }`}
                    >
                      {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                    </p>
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

