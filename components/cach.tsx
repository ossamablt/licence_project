"use client"

import { useState, useRef, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  Clock,
  Trash2,
  Pencil,
} from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import api from "@/lib/api"

interface TableInterface {
  id: number
  num_table: number
  capacity: number
  created_at: string | null
  updated_at: string | null
}

interface Reservation {
  id: number
  client_name: string
  client_phone: string
  date: string
  hour: string
  duration: number
  status: string
  tables_id: number
  created_at: string
  table: TableInterface
  number_of_persones: number
}

export default function PlanningInterface() {
  const [date, setDate] = useState<Date>(new Date())
  const [reservationTime, setReservationTime] = useState<string>("19:00")
  const [reservationName, setReservationName] = useState<string>("")
  const [reservationGuests, setReservationGuests] = useState<string>("2")
  const [reservationPhone, setReservationPhone] = useState<string>("")
  const [reservationNote, setReservationNote] = useState<string>("")
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [isEditingReservation, setIsEditingReservation] = useState(false)
  const [tables, setTables] = useState<TableInterface[]>([])
  const [reservationsbyDate, setReservationsbyDate] = useState<Reservation[]>([])
  const [reservationDuration, setReservationDuration] = useState<number>(2)
  const [selectedTable, setSelectedTable] = useState<TableInterface | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchTables()
      await fetchReservationsbyDate(new Date())
    }
    fetchInitialData()
  }, [])

  // Fetch tables
  const fetchTables = async () => {
    try {
      const response = await api.get("/tables")
      setTables(response.data.tables)
    } catch (error) {
      console.error("Error fetching tables:", error)
      toast({
        title: "Error",
        description: "Failed to load tables",
        variant: "destructive",
      })
    }
  }

  // Fetch reservations by date
  const fetchReservationsbyDate = async (date: Date) => {
    try {
      const formattedDate = format(date, "yyyy-MM-dd")
      const response = await api.get(`/reservation?date=${formattedDate}`)
      setReservationsbyDate(response.data.reservations)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      toast({
        title: "Error",
        description: "Failed to load reservations",
        variant: "destructive",
      })
    }
  }

  // Handle date change
  useEffect(() => {
    fetchReservationsbyDate(date)
  }, [date])

  // Reservation form submission
  const handleReservationSubmit = async () => {
    if (!date || !reservationName || !reservationTime) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const reservationData = {
        client_name: reservationName,
        number_of_persones: Number(reservationGuests),
        date: format(date, "yyyy-MM-dd"),
        hour: reservationTime,
        duration: reservationDuration,
        client_phone: reservationPhone,
        note: reservationNote,
        tables_id: selectedTable?.id || null,
      }

      if (isEditingReservation && selectedReservation) {
        await api.put(`/reservation/${selectedReservation.id}`, reservationData)
        toast({ title: "Success", description: "Reservation updated" })
      } else {
        await api.post("/reservation", reservationData)
        toast({ title: "Success", description: "Reservation created" })
      }

      fetchReservationsbyDate(date)
      resetReservationForm()
      setReservationDialogOpen(false)
    } catch (error) {
      console.error("Reservation error:", error)
      toast({
        title: "Error",
        description: "Operation failed",
        variant: "destructive",
      })
    }
  }

  // Edit reservation
  const editReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setReservationName(reservation.client_name)
    setDate(new Date(reservation.date))
    setReservationTime(reservation.hour)
    setReservationPhone(reservation.client_phone)
    setReservationDuration(reservation.duration)
    setReservationGuests(reservation.number_of_persones.toString())
    setIsEditingReservation(true)
    setReservationDialogOpen(true)
    if (reservation.tables_id) {
      const table = tables.find(t => t.id === reservation.tables_id)
      setSelectedTable(table || null)
    }
  }

  // Delete reservation
  const deleteReservation = async (id: number) => {
    try {
      await api.delete(`/reservation/${id}`)
      fetchReservationsbyDate(date)
      toast({ title: "Success", description: "Reservation deleted" })
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      })
    }
  }

  // Reset form
  const resetReservationForm = () => {
    setReservationName("")
    setReservationGuests("2")
    setReservationDuration(2)
    setDate(new Date())
    setReservationTime("19:00")
    setReservationPhone("")
    setReservationNote("")
    setSelectedReservation(null)
    setSelectedTable(null)
    setIsEditingReservation(false)
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Calendar Section */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>Reservation Calendar</CardTitle>
              <CardDescription>Select a date to view reservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-4">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  className="rounded-md border"
                  locale={fr}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">
                  Reservations for {format(date, "MMMM d, yyyy", { locale: fr })}
                </h3>
                {reservationsbyDate.map(res => (
                  <div key={res.id} className="p-3 border rounded-md flex justify-between items-center">
                    <div>
                      <div className="font-medium">{res.client_name}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        {res.hour} • {res.duration}h
                        {res.table && ` • Table ${res.table.num_table}`}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editReservation(res)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => deleteReservation(res.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {reservationsbyDate.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No reservations for this date</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reservation Form */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle>
                {isEditingReservation ? "Edit Reservation" : "New Reservation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input
                      value={reservationName}
                      onChange={(e) => setReservationName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Guests</Label>
                    <Input
                      type="number"
                      min="1"
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
                        <Button variant="outline" className="w-full">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(date, "PPP", { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={date}
                          onSelect={(date) => date && setDate(date)}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (hours)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      value={reservationDuration}
                      onChange={(e) => setReservationDuration(Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Table</Label>
                    <Select
                      value={selectedTable?.id?.toString() || ""}
                      onValueChange={(value) => {
                        const table = tables.find(t => t.id === Number(value))
                        setSelectedTable(table || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select table" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map(table => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                            Table {table.num_table} ({table.capacity} seats)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={reservationPhone}
                    onChange={(e) => setReservationPhone(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={reservationNote}
                    onChange={(e) => setReservationNote(e.target.value)}
                    placeholder="Special requests or notes"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleReservationSubmit}>
                {isEditingReservation ? "Update Reservation" : "Create Reservation"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Edit Reservation Dialog */}
      <Dialog open={reservationDialogOpen} onOpenChange={setReservationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditingReservation ? "Edit Reservation" : "New Reservation"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Dialog form content would be here */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}