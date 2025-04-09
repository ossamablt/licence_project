"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Pencil,
  Plus,
  Trash2,
  User,
  ChefHat,
  CreditCard,
  Coffee,
  UtensilsCrossed,
  Package,
  Store,
  BarChart3,
  Wallet,
  FileText,
  Bell,
  Info,
  AlertTriangle,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OlirabLogo } from "@/components/olirab-logo"
import { StatisticsDashboard } from "@/components/statistics-dashboard"
import { SalaryManagement } from "@/components/salary-management"
import { InvoiceManagement } from "@/components/invoice-management"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"

// Types pour l'application
type EmployeeRole = "Serveur" | "Caissier" | "Chef Cuisine" | "Manager" | "Autre"
type StockCategory = "Ingrédients" | "Boissons" | "Emballages" | "Autre"

interface Employee {
  id: number
  name: string
  role: EmployeeRole
  hireDate: string
  designation: string
  avatar?: string
  email?: string
  phone?: string
  address?: string
  salary?: number
  notes?: string
}

interface Product {
  id: number
  name: string
  price: number
  quantity: number
  supplier: string
  category: StockCategory
  minStock?: number
  description?: string
  lastRestock?: string
  expiryDate?: string
}

interface Notification {
  id: number
  type: "warning" | "info" | "error"
  message: string
  date: string
  read: boolean
}

// Fonction pour obtenir l'icône correspondant au rôle
const getRoleIcon = (role: EmployeeRole) => {
  switch (role) {
    case "Chef Cuisine":
      return <ChefHat className="h-4 w-4" />
    case "Caissier":
      return <CreditCard className="h-4 w-4" />
    case "Serveur":
      return <Coffee className="h-4 w-4" />
    default:
      return <User className="h-4 w-4" />
  }
}

export default function RestaurantManagement() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<"employees" | "stock" | "accounting">("employees")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [accountingTab, setAccountingTab] = useState<string>("statistics")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)

  // Dialog states
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [employeePropertiesOpen, setEmployeePropertiesOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Form states
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    role: "Serveur",
    designation: "",
    hireDate: new Date().toLocaleDateString("fr-FR"),
    email: "",
    phone: "",
    address: "",
    salary: 0,
    notes: "",
  })

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    price: 0,
    quantity: 0,
    supplier: "",
    category: "Ingrédients",
    minStock: 0,
    description: "",
    lastRestock: new Date().toLocaleDateString("fr-FR"),
    expiryDate: "",
  })

  // État des employés
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: 1,
      name: "MR.Zenir",
      role: "Manager",
      hireDate: "12/01/2023",
      designation: "bessam",
      email: "zenir@olirab.com",
      phone: "06 12 34 56 78",
      address: "123 Rue de Paris, 75001 Paris",
      salary: 3500,
      notes: "Directeur du restaurant depuis 2023",
    },
    {
      id: 2,
      name: "Abd Arrahim",
      role: "Serveur",
      hireDate: "15/02/2023",
      designation: "abd arrahim",
      email: "arrahim@olirab.com",
      phone: "06 23 45 67 89",
      address: "45 Avenue Victor Hugo, 75016 Paris",
      salary: 1800,
      notes: "Serveur expérimenté, parle anglais et espagnol",
    },
    {
      id: 3,
      name: "Ossamablt",
      role: "Chef Cuisine",
      hireDate: "20/03/2023",
      designation: "ossamablt",
      email: "ossama@olirab.com",
      phone: "06 34 56 78 90",
      address: "78 Boulevard Saint-Michel, 75005 Paris",
      salary: 2500,
      notes: "Spécialiste des burgers gourmet",
    },
    {
      id: 4,
      name: "Rauf",
      role: "Caissier",
      hireDate: "05/04/2023",
      designation: "rauf",
      email: "rauf@olirab.com",
      phone: "06 45 67 89 01",
      address: "12 Rue de Rivoli, 75004 Paris",
      salary: 1700,
      notes: "Rapide et efficace à la caisse",
    },
  ])

  // État des produits
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Pain burger",
      price: 0.5,
      quantity: 500,
      supplier: "Boulangerie Express",
      category: "Ingrédients",
      minStock: 100,
      description: "Pains briochés pour burgers, format standard",
      lastRestock: "15/02/2023",
      expiryDate: "15/03/2023",
    },
    {
      id: 2,
      name: "Coca-Cola 33cl",
      price: 0.75,
      quantity: 20, // Low stock for testing
      supplier: "Distributeur Boissons",
      category: "Boissons",
      minStock: 50,
      description: "Canettes de Coca-Cola 33cl",
      lastRestock: "10/02/2023",
      expiryDate: "10/08/2023",
    },
    {
      id: 3,
      name: "Viande hachée",
      price: 4.5,
      quantity: 0, // Out of stock for testing
      supplier: "Boucherie Pro",
      category: "Ingrédients",
      minStock: 30,
      description: "Viande hachée pur bœuf 15% MG",
      lastRestock: "05/02/2023",
      expiryDate: "12/02/2023",
    },
    {
      id: 4,
      name: "Boîtes à burger",
      price: 0.2,
      quantity: 1000,
      supplier: "Emballages Plus",
      category: "Emballages",
      minStock: 200,
      description: "Boîtes en carton recyclable pour burgers",
      lastRestock: "01/02/2023",
      expiryDate: "01/02/2024",
    },
    {
      id: 5,
      name: "Frites surgelées",
      price: 2.0,
      quantity: 25, // Low stock for testing
      supplier: "Surgelés Express",
      category: "Ingrédients",
      minStock: 50,
      description: "Frites coupe classique, sachet 2.5kg",
      lastRestock: "20/01/2023",
      expiryDate: "20/07/2023",
    },
  ])

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Generate notifications based on stock levels
  useEffect(() => {
    const newNotifications: Notification[] = []

    products.forEach((product) => {
      if (product.quantity === 0) {
        newNotifications.push({
          id: Date.now() + Math.random(),
          type: "error",
          message: `Stock épuisé : ${product.name}`,
          date: new Date().toLocaleDateString("fr-FR"),
          read: false,
        })
      } else if (product.quantity <= (product.minStock || 0) * 0.5) {
        newNotifications.push({
          id: Date.now() + Math.random(),
          type: "warning",
          message: `Stock critique : ${product.name} (${product.quantity} restants)`,
          date: new Date().toLocaleDateString("fr-FR"),
          read: false,
        })
      }
    })

    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev])
    }
  }, [products])

  // Check authentication
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const userRole = localStorage.getItem("userRole")

    if (!isLoggedIn || userRole !== "admin") {
      router.push("/login")
      return
    }
  }, [router])

  // Check if screen is mobile
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Count unread notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  // Filtrer les employés
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    return matchesSearch && employee.role.toLowerCase() === activeTab.toLowerCase()
  })

  // Filtrer les produits
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    return matchesSearch && product.category.toLowerCase() === activeTab.toLowerCase()
  })

  // Fonctions de suppression
  const deleteEmployee = (id: number) => {
    setEmployees(employees.filter((emp) => emp.id !== id))
  }

  const deleteProduct = (id: number) => {
    setProducts(products.filter((prod) => prod.id !== id))
  }

  // Ajouter ou modifier un employé
  const handleEmployeeSubmit = () => {
    if (isEditMode && selectedEmployee) {
      // Mode modification
      setEmployees(
        employees.map((emp) => (emp.id === selectedEmployee.id ? { ...selectedEmployee, ...newEmployee } : emp)),
      )
    } else {
      // Mode ajout
      const id = employees.length > 0 ? Math.max(...employees.map((e) => e.id)) + 1 : 1

      const employee: Employee = {
        id,
        name: newEmployee.name || "",
        role: (newEmployee.role as EmployeeRole) || "Serveur",
        hireDate: newEmployee.hireDate || new Date().toLocaleDateString("fr-FR"),
        designation: newEmployee.designation || "",
        email: newEmployee.email,
        phone: newEmployee.phone,
        address: newEmployee.address,
        salary: newEmployee.salary,
        notes: newEmployee.notes,
      }

      setEmployees([...employees, employee])
    }

    setAddEmployeeOpen(false)
    setIsEditMode(false)
    setNewEmployee({
      name: "",
      role: "Serveur",
      designation: "",
      hireDate: new Date().toLocaleDateString("fr-FR"),
      email: "",
      phone: "",
      address: "",
      salary: 0,
      notes: "",
    })
  }

  // Ajouter ou modifier un produit
  const handleProductSubmit = () => {
    if (isEditMode && selectedProduct) {
      // Mode modification
      setProducts(
        products.map((prod) => (prod.id === selectedProduct.id ? { ...selectedProduct, ...newProduct } : prod)),
      )
    } else {
      // Mode ajout
      const id = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1

      const product: Product = {
        id,
        name: newProduct.name || "",
        price: newProduct.price || 0,
        quantity: newProduct.quantity || 0,
        supplier: newProduct.supplier || "",
        category: (newProduct.category as StockCategory) || "Ingrédients",
        minStock: newProduct.minStock,
        description: newProduct.description,
        lastRestock: newProduct.lastRestock,
        expiryDate: newProduct.expiryDate,
      }

      setProducts([...products, product])
    }

    setAddProductOpen(false)
    setIsEditMode(false)
    setNewProduct({
      name: "",
      price: 0,
      quantity: 0,
      supplier: "",
      category: "Ingrédients",
      minStock: 0,
      description: "",
      lastRestock: new Date().toLocaleDateString("fr-FR"),
      expiryDate: "",
    })
  }

  // Ouvrir le formulaire d'édition d'employé
  const openEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setNewEmployee({
      name: employee.name,
      role: employee.role,
      designation: employee.designation,
      hireDate: employee.hireDate,
      email: employee.email,
      phone: employee.phone,
      address: employee.address,
      salary: employee.salary,
      notes: employee.notes,
    })
    setIsEditMode(true)
    setAddEmployeeOpen(true)
  }

  // Ouvrir le formulaire d'édition de produit
  const openEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setNewProduct({
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      supplier: product.supplier,
      category: product.category,
      minStock: product.minStock,
      description: product.description,
      lastRestock: product.lastRestock,
      expiryDate: product.expiryDate,
    })
    setIsEditMode(true)
    setAddProductOpen(true)
  }

  // Voir les propriétés d'un employé
  const viewEmployeeProperties = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEmployeePropertiesOpen(true)
  }

  // Marquer toutes les notifications comme lues
  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })))
  }

  // Formatter le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/login")
  }

  return (
    <div className="flex h-screen bg-orange-50/50 text-gray-800 relative">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button variant="outline" size="icon" className="bg-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 fixed md:static z-20 h-full w-64 bg-white shadow-md`}
      >
        <div className="p-6 border-b">
          <OlirabLogo size="lg" />
        </div>
        <div className="mt-4">
          <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Menu</p>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${activeSection === "employees"
              ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
              : "text-gray-600 hover:bg-orange-50/50"
              }`}
            onClick={() => {
              setActiveSection("employees")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <User className="h-4 w-4" />
            Employés
          </div>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${activeSection === "stock"
              ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
              : "text-gray-600 hover:bg-orange-50/50"
              }`}
            onClick={() => {
              setActiveSection("stock")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <Package className="h-4 w-4" />
            Stock
          </div>
          <div
            className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${activeSection === "accounting"
              ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700"
              : "text-gray-600 hover:bg-orange-50/50"
              }`}
            onClick={() => {
              setActiveSection("accounting")
              if (isMobile) setSidebarOpen(false)
            }}
          >
            <CreditCard className="h-4 w-4" />
            Comptabilité
          </div>
          <div className="mt-4 border-t pt-4">
            <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Interfaces</p>
            <div
              className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
              onClick={() => router.push("/server")}
            >
              <Coffee className="h-4 w-4" />
              Serveur
            </div>
            <div
              className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
              onClick={() => router.push("/kitchen")}
            >
              <ChefHat className="h-4 w-4" />
              Cuisine
            </div>
            <div
              className="py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 text-gray-600 hover:bg-orange-50/50"
              onClick={() => router.push("/cashier")}
            >
              <CreditCard className="h-4 w-4" />
              Caisse
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/50 z-10" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className={`flex-1 p-4 md:p-8 overflow-auto ${isMobile ? "ml-0" : ""} pt-16 md:pt-8`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-gray-400 text-sm">Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              {activeSection === "employees"
                ? "Gestion des Employés"
                : activeSection === "stock"
                  ? "Gestion du Stock"
                  : "Comptabilité"}
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllNotificationsAsRead}>
                        Tout marquer comme lu
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-3 border-b hover:bg-gray-50 cursor-default">
                          <div className="flex gap-3 items-start">
                            <div
                              className={`p-2 rounded-full 
                              ${notification.type === "error"
                                  ? "bg-red-100 text-red-600"
                                  : notification.type === "warning"
                                    ? "bg-yellow-100 text-yellow-600"
                                    : "bg-orange-100 text-orange-600"
                                }`}
                            >
                              {notification.type === "error" ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : notification.type === "warning" ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : (
                                <Info className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${!notification.read ? "font-bold" : ""}`}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">Aucune notification</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2">
              <p className="text-gray-600">Bienvenue</p>
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarImage src="/placeholder.svg?height=40&width=40" />
                <AvatarFallback className="bg-orange-100 text-orange-700">MZ</AvatarFallback>
              </Avatar>
              <span className="font-medium">MR.Zenir</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirmation(true)} title="Déconnexion">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {activeSection === "employees" ? (
          <>
            {/* Search and add - Employees */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus size={18} className="mr-2" />
                      Ajouter un employé
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>{isEditMode ? "Modifier l'employé" : "Ajouter un nouvel employé"}</DialogTitle>
                      <DialogDescription>
                        {isEditMode
                          ? "Modifiez les informations de l'employé."
                          : "Remplissez les informations pour ajouter un nouvel employé à l'équipe."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom complet</Label>
                          <Input
                            id="name"
                            value={newEmployee.name}
                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            placeholder="Nom et prénom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="designation">Désignation</Label>
                          <Input
                            id="designation"
                            value={newEmployee.designation}
                            onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                            placeholder="Désignation"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Rôle</Label>
                          <Select
                            value={newEmployee.role as string}
                            onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value as EmployeeRole })}
                          >
                            <SelectTrigger id="role">
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Serveur">Serveur</SelectItem>
                              <SelectItem value="Caissier">Caissier</SelectItem>
                              <SelectItem value="Chef Cuisine">Chef Cuisine</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hireDate">Date d'embauche</Label>
                          <Input
                            id="hireDate"
                            value={newEmployee.hireDate}
                            onChange={(e) => setNewEmployee({ ...newEmployee, hireDate: e.target.value })}
                            placeholder="JJ/MM/AAAA"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newEmployee.email}
                            onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            placeholder="email@exemple.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={newEmployee.phone}
                            onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                            placeholder="06 XX XX XX XX"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input
                          id="address"
                          value={newEmployee.address}
                          onChange={(e) => setNewEmployee({ ...newEmployee, address: e.target.value })}
                          placeholder="Adresse complète"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="salary">Salaire mensuel (€)</Label>
                        <Input
                          id="salary"
                          type="number"
                          value={newEmployee.salary}
                          onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Input
                          id="notes"
                          value={newEmployee.notes}
                          onChange={(e) => setNewEmployee({ ...newEmployee, notes: e.target.value })}
                          placeholder="Informations supplémentaires"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddEmployeeOpen(false)
                          setIsEditMode(false)
                        }}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleEmployeeSubmit} className="bg-orange-500 hover:bg-orange-600">
                        {isEditMode ? "Enregistrer" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="relative flex-1 md:w-80">
                  <Input
                    placeholder="Rechercher un employé..."
                    className="w-full pl-10 border-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-white border">
                  <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Tous
                  </TabsTrigger>
                  <TabsTrigger
                    value="serveur"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Serveurs
                  </TabsTrigger>
                  <TabsTrigger
                    value="caissier"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Caissiers
                  </TabsTrigger>
                  <TabsTrigger
                    value="chef cuisine"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <ChefHat className="h-4 w-4 mr-2" />
                    Chefs
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Table - Employees */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="grid grid-cols-5 bg-orange-50 text-gray-600 font-medium p-4 border-b border-orange-100">
                <div>Employé</div>
                <div>Désignation</div>
                <div>Rôle</div>
                <div>Date d'embauche</div>
                <div className="text-center">Actions</div>
              </div>

              <div className="overflow-x-auto">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee, index) => (
                    <div
                      key={employee.id}
                      className={`grid grid-cols-5 p-4 items-center ${index % 2 === 0 ? "bg-white" : "bg-orange-50/50"
                        } hover:bg-orange-50 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.avatar || `/placeholder.svg?height=32&width=32`} />
                          <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                            {employee.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{employee.name}</span>
                      </div>
                      <div className="text-gray-600">{employee.designation}</div>
                      <div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${employee.role === "Chef Cuisine"
                              ? "bg-yellow-100 text-yellow-800"
                              : employee.role === "Serveur"
                                ? "bg-orange-100 text-orange-800"
                                : employee.role === "Caissier"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-orange-100 text-orange-800"
                            }`}
                        >
                          {getRoleIcon(employee.role)}
                          {employee.role}
                        </span>
                      </div>
                      <div className="text-gray-600">{employee.hireDate}</div>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          onClick={() => viewEmployeeProperties(employee)}
                        >
                          <Info size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          onClick={() => openEditEmployee(employee)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteEmployee(employee.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">Aucun employé trouvé</div>
                )}
              </div>
            </div>

            {/* Employee Properties Dialog */}
            <Dialog open={employeePropertiesOpen} onOpenChange={setEmployeePropertiesOpen}>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-500" />
                    Détails de l'employé
                  </DialogTitle>
                  <DialogDescription>Informations complètes sur {selectedEmployee?.name}</DialogDescription>
                </DialogHeader>

                {selectedEmployee && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-orange-100">
                        <AvatarImage src={selectedEmployee.avatar || `/placeholder.svg?height=64&width=64`} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-lg">
                          {selectedEmployee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-bold">{selectedEmployee.name}</h3>
                        <p className="text-gray-500">{selectedEmployee.designation}</p>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${selectedEmployee.role === "Chef Cuisine"
                                ? "bg-yellow-100 text-yellow-800"
                                : selectedEmployee.role === "Serveur"
                                  ? "bg-orange-100 text-orange-800"
                                  : selectedEmployee.role === "Caissier"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-orange-100 text-orange-800"
                              }`}
                          >
                            {getRoleIcon(selectedEmployee.role)}
                            {selectedEmployee.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Email</h4>
                        <p>{selectedEmployee.email || "Non renseigné"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Téléphone</h4>
                        <p>{selectedEmployee.phone || "Non renseigné"}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Date d'embauche</h4>
                        <p>{selectedEmployee.hireDate}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Salaire mensuel</h4>
                        <p className="font-semibold">
                          {selectedEmployee.salary ? formatPrice(selectedEmployee.salary) : "Non renseigné"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Adresse</h4>
                      <p>{selectedEmployee.address || "Non renseignée"}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                      <p className="text-gray-700">{selectedEmployee.notes || "Aucune note"}</p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setEmployeePropertiesOpen(false)}>
                    Fermer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : activeSection === "stock" ? (
          <>
            {/* Search and add - Stock */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus size={18} className="mr-2" />
                      Ajouter un produit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>{isEditMode ? "Modifier le produit" : "Ajouter un nouveau produit"}</DialogTitle>
                      <DialogDescription>
                        {isEditMode
                          ? "Modifiez les informations du produit."
                          : "Remplissez les informations pour ajouter un nouveau produit au stock."}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom du produit</Label>
                          <Input
                            id="name"
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="Nom du produit"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Catégorie</Label>
                          <Select
                            value={newProduct.category as string}
                            onValueChange={(value) =>
                              setNewProduct({ ...newProduct, category: value as StockCategory })
                            }
                          >
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ingrédients">Ingrédients</SelectItem>
                              <SelectItem value="Boissons">Boissons</SelectItem>
                              <SelectItem value="Emballages">Emballages</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Prix unitaire (€)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Quantité</Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newProduct.quantity}
                            onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minStock">Stock minimum</Label>
                          <Input
                            id="minStock"
                            type="number"
                            value={newProduct.minStock}
                            onChange={(e) => setNewProduct({ ...newProduct, minStock: Number(e.target.value) })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="supplier">Fournisseur</Label>
                          <Input
                            id="supplier"
                            value={newProduct.supplier}
                            onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                            placeholder="Nom du fournisseur"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          placeholder="Description du produit"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lastRestock">Dernière réception</Label>
                          <Input
                            id="lastRestock"
                            value={newProduct.lastRestock}
                            onChange={(e) => setNewProduct({ ...newProduct, lastRestock: e.target.value })}
                            placeholder="JJ/MM/AAAA"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Date d'expiration</Label>
                          <Input
                            id="expiryDate"
                            value={newProduct.expiryDate}
                            onChange={(e) => setNewProduct({ ...newProduct, expiryDate: e.target.value })}
                            placeholder="JJ/MM/AAAA"
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddProductOpen(false)
                          setIsEditMode(false)
                        }}
                      >
                        Annuler
                      </Button>
                      <Button onClick={handleProductSubmit} className="bg-orange-500 hover:bg-orange-600">
                        {isEditMode ? "Enregistrer" : "Ajouter"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="relative flex-1 md:w-80">
                  <Input
                    placeholder="Rechercher un produit..."
                    className="w-full pl-10 border-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
              <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-white border">
                  <TabsTrigger value="all" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                    Tous
                  </TabsTrigger>
                  <TabsTrigger
                    value="ingrédients"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Ingrédients
                  </TabsTrigger>
                  <TabsTrigger
                    value="boissons"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Boissons
                  </TabsTrigger>
                  <TabsTrigger
                    value="emballages"
                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Emballages
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Table - Stock */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <div className="grid grid-cols-6 bg-orange-50 text-gray-600 font-medium p-4 border-b border-orange-100">
                <div>Produit</div>
                <div>Prix unitaire</div>
                <div>Quantité</div>
                <div>Stock minimum</div>
                <div>Fournisseur</div>
                <div className="text-center">Actions</div>
              </div>

              <div className="overflow-x-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`grid grid-cols-6 p-4 items-center ${index % 2 === 0 ? "bg-white" : "bg-orange-50/50"
                        } hover:bg-orange-50 transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${product.quantity === 0
                            ? "bg-red-100 text-red-700"
                            : product.quantity <= (product.minStock || 0)
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                            }`}
                        >
                          <Package className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-gray-600">{formatPrice(product.price)}</div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${product.quantity === 0
                              ? "bg-red-100 text-red-800"
                              : product.quantity <= (product.minStock || 0)
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                        >
                          {product.quantity} unités
                        </span>
                      </div>
                      <div className="text-gray-600">{product.minStock} unités</div>
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{product.supplier}</span>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                        >
                          <Info size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          onClick={() => openEditProduct(product)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">Aucun produit trouvé</div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Accounting Section
          <>
            <Tabs defaultValue="statistics" onValueChange={setAccountingTab} className="w-full mb-6">
              <TabsList className="bg-white border w-full justify-start overflow-x-auto">
                <TabsTrigger
                  value="statistics"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Statistiques
                </TabsTrigger>
                <TabsTrigger
                  value="salaries"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Gestion des Salaires
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gestion des Factures
                </TabsTrigger>
              </TabsList>

              <TabsContent value="statistics">
                <StatisticsDashboard />
              </TabsContent>

              <TabsContent value="salaries">
                <SalaryManagement />
              </TabsContent>

              <TabsContent value="invoices">
                <InvoiceManagement />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Click outside to close notifications */}
      {notificationsOpen && <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />}

      {/* Logout confirmation dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
