"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Pencil,
  Plus,
  Trash2,
  Download,
  Filter,
  Search,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"

interface Invoice {
  id: string
  client: string
  date: string
  dueDate: string
  amount: number
  tax: number
  total: number
  status: "Payée" | "En attente" | "En retard"
  items: InvoiceItem[]
}

interface InvoiceItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  total: number
}

// Sample data
const initialInvoices: Invoice[] = [
  {
    id: "INV-2023-001",
    client: "Restaurant Le Gourmet",
    date: "05/01/2023",
    dueDate: "05/02/2023",
    amount: 1250.0,
    tax: 250.0,
    total: 1500.0,
    status: "Payée",
    items: [
      { id: 1, description: "Viande hachée (5kg)", quantity: 5, unitPrice: 10.0, total: 50.0 },
      { id: 2, description: "Pain burger (100pcs)", quantity: 100, unitPrice: 0.5, total: 50.0 },
      { id: 3, description: "Boissons (24 caisses)", quantity: 24, unitPrice: 20.0, total: 480.0 },
      { id: 4, description: "Frites surgelées (10kg)", quantity: 10, unitPrice: 5.0, total: 50.0 },
      { id: 5, description: "Service de livraison", quantity: 1, unitPrice: 20.0, total: 20.0 },
    ],
  },
  {
    id: "INV-2023-002",
    client: "Café Central",
    date: "12/01/2023",
    dueDate: "12/02/2023",
    amount: 800.0,
    tax: 160.0,
    total: 960.0,
    status: "Payée",
    items: [
      { id: 1, description: "Boissons (15 caisses)", quantity: 15, unitPrice: 20.0, total: 300.0 },
      { id: 2, description: "Desserts (50pcs)", quantity: 50, unitPrice: 2.0, total: 100.0 },
      { id: 3, description: "Service de livraison", quantity: 1, unitPrice: 20.0, total: 20.0 },
    ],
  },
  {
    id: "INV-2023-003",
    client: "École Primaire Jean Moulin",
    date: "20/01/2023",
    dueDate: "20/02/2023",
    amount: 1500.0,
    tax: 300.0,
    total: 1800.0,
    status: "En attente",
    items: [
      { id: 1, description: "Menus enfants (100pcs)", quantity: 100, unitPrice: 5.0, total: 500.0 },
      { id: 2, description: "Boissons (10 caisses)", quantity: 10, unitPrice: 15.0, total: 150.0 },
      { id: 3, description: "Service de livraison", quantity: 1, unitPrice: 30.0, total: 30.0 },
    ],
  },
  {
    id: "INV-2023-004",
    client: "Entreprise ABC",
    date: "25/01/2023",
    dueDate: "25/02/2023",
    amount: 2000.0,
    tax: 400.0,
    total: 2400.0,
    status: "En retard",
    items: [
      { id: 1, description: "Buffet complet (50 personnes)", quantity: 50, unitPrice: 15.0, total: 750.0 },
      { id: 2, description: "Service traiteur", quantity: 1, unitPrice: 200.0, total: 200.0 },
      { id: 3, description: "Boissons premium", quantity: 50, unitPrice: 3.0, total: 150.0 },
    ],
  },
  {
    id: "INV-2023-005",
    client: "Hôtel Bellevue",
    date: "01/02/2023",
    dueDate: "01/03/2023",
    amount: 3000.0,
    tax: 600.0,
    total: 3600.0,
    status: "En attente",
    items: [
      { id: 1, description: "Service traiteur événement", quantity: 1, unitPrice: 1500.0, total: 1500.0 },
      { id: 2, description: "Boissons premium", quantity: 100, unitPrice: 5.0, total: 500.0 },
      { id: 3, description: "Desserts assortis", quantity: 100, unitPrice: 3.0, total: 300.0 },
    ],
  },
]

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Filter invoices based on search term and status
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && invoice.status === statusFilter
  })

  // Calculate totals
  const totalAmount = invoices.reduce((total, inv) => total + inv.total, 0)
  const pendingAmount = invoices
    .filter((inv) => inv.status === "En attente" || inv.status === "En retard")
    .reduce((total, inv) => total + inv.total, 0)
  const overdueAmount = invoices
    .filter((inv) => inv.status === "En retard")
    .reduce((total, inv) => total + inv.total, 0)

  // Handle invoice deletion
  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id))
  }

  // View invoice details
  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsViewDialogOpen(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Payée":
        return <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
      case "En attente":
        return <Clock className="h-4 w-4 text-yellow-500 mr-1" />
      case "En retard":
        return <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Total des Factures</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">{invoices.length} factures</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Montant en Attente</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{formatCurrency(pendingAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.filter((inv) => inv.status === "En attente" || inv.status === "En retard").length} factures
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Montant en Retard</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(overdueAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.filter((inv) => inv.status === "En retard").length} factures
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus size={18} className="mr-2" />
            Créer une facture
          </Button>
          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
            <Download size={18} className="mr-2" />
            Exporter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Rechercher une facture..."
              className="w-full sm:w-64 pl-10 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="Payée">Payée</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="En retard">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-orange-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50">
              <TableHead>N° Facture</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Montant HT</TableHead>
              <TableHead>TVA</TableHead>
              <TableHead>Total TTC</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-orange-50/50">
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>{invoice.client}</TableCell>
                <TableCell>{invoice.date}</TableCell>
                <TableCell>{invoice.dueDate}</TableCell>
                <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                <TableCell>{formatCurrency(invoice.tax)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      invoice.status === "Payée"
                        ? "bg-green-100 text-green-800"
                        : invoice.status === "En attente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => viewInvoiceDetails(invoice)}
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteInvoice(invoice.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-500" />
              Détails de la Facture {selectedInvoice?.id}
            </DialogTitle>
            <DialogDescription>
              Facture émise le {selectedInvoice?.date} pour {selectedInvoice?.client}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Client</h4>
                  <p className="text-lg font-semibold">{selectedInvoice.client}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Statut</h4>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${
                      selectedInvoice.status === "Payée"
                        ? "bg-green-100 text-green-800"
                        : selectedInvoice.status === "En attente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getStatusIcon(selectedInvoice.status)}
                    {selectedInvoice.status}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date d'émission</h4>
                  <p>{selectedInvoice.date}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date d'échéance</h4>
                  <p>{selectedInvoice.dueDate}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Articles</h4>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-orange-50">
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Prix unitaire</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sous-total:</span>
                    <span>{formatCurrency(selectedInvoice.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TVA (20%):</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
              <Download size={18} className="mr-2" />
              Télécharger PDF
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <CheckCircle size={18} className="mr-2" />
              Marquer comme payée
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

