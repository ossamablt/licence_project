"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  ChefHat,
  CreditCard,
  Coffee,
  Package,
  Bell,
  Info,
  AlertTriangle,
  Menu,
  X,
  LogOut,
  UtensilsCrossed,
  Users,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { OlirabLogo } from "@/components/olirab-logo"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { EmployeeManagement } from "@/components/employee-management"
import { StockManagement } from "@/components/stock-management"
import { AccountingManagement } from "@/components/accounting-management"
import { MenuManagement } from "@/components/menu-management"
import api from "@/lib/api"

interface User {
  id: number
  userName: string
  employe_id: number
  employe: {
    role: string
  }
}

interface Notification {
  id: string
  type: "low_stock" | "expiring_soon"
  message: string
  created_at: string
  read_at: string | null
  data: {
    product_id: number
    product_name: string
    expiry_date?: string
  }
}

export default function RestaurantManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<"employees" | "stock" | "accounting" | "menu" | "users">("employees")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userFormData, setUserFormData] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
    employe_id: "",
  })
  const [employees, setEmployees] = useState<any[]>([])
  const [formErrors, setFormErrors] = useState({
    userName: "",
    password: "",
    confirmPassword: "",
    employe_id: "",
  })

  const [isMobile, setIsMobile] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [isClient, setIsClient] = useState(false)

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true)
    setLoading(false)
  }, [])

  // Handle screen resize
  useEffect(() => {
    if (!isClient) return

    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [isClient])

  // Check login and role - only run on client side
  useEffect(() => {
    if (!isClient) return

    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
      const userRole = localStorage.getItem("userRole")
      const storedUsername = localStorage.getItem("username") || ""

      setUsername(storedUsername)

      if (!isLoggedIn || userRole !== "Gérant") {
        router.push("/")
      }
    }

    checkAuth()
  }, [router, isClient])

  // Load users and employees when user management section is active
  useEffect(() => {
    if (activeSection === "users") {
      loadUsers()
      loadEmployees()
    }
  }, [activeSection])

  const loadUsers = async () => {
    try {
      const response = await api.get("/user")
      console.log("Users response:", response.data) // Debug log
      
      if (response.data && response.data.user) {
        console.log("Setting users from response.data.users:", response.data.users)
        // Filter out users with Gérant role
        const filteredUsers = response.data.user.filter((user: User) => user.employe?.role !== "Gérant")
        setUsers(filteredUsers)
      } else if (response.data && Array.isArray(response.data)) {
        console.log("Setting users from response.data array:", response.data)
        // Filter out users with Gérant role
        const filteredUsers = response.data.filter((user: User) => user.employe?.role !== "Gérant")
        setUsers(filteredUsers)
      } else {
        console.error("Invalid response format:", response.data)
        toast({
          title: "Erreur",
          description: "Format de réponse invalide",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      })
    }
  }

  const loadEmployees = async () => {
    try {
      const response = await api.get("/employes")
      setEmployees(response.data.employes)
    } catch (error) {
      console.error("Error loading employees:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés",
        variant: "destructive",
      })
    }
  }

  const validateForm = () => {
    const errors = {
      userName: "",
      password: "",
      confirmPassword: "",
      employe_id: "",
    }
    let isValid = true

    if (!userFormData.userName.trim()) {
      errors.userName = "Le nom d'utilisateur est requis"
      isValid = false
    }

    if (!selectedUser && !userFormData.password) {
      errors.password = "Le mot de passe est requis"
      isValid = false
    }

    if (!selectedUser && userFormData.password !== userFormData.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas"
      isValid = false
    }

    if (!userFormData.employe_id) {
      errors.employe_id = "Veuillez sélectionner un employé"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (selectedUser) {
        const updateData: any = {
          userName: userFormData.userName,
          employe_id: parseInt(userFormData.employe_id),
        }
        
        if (userFormData.password) {
          updateData.password = userFormData.password
        }
        
        await api.put(`/user/${selectedUser.id}`, updateData)
        toast({
          title: "Succès",
          description: "Utilisateur mis à jour avec succès",
        })
      } else {
        await api.post("/register", {
          userName: userFormData.userName,
          password: userFormData.password,
          employe_id: parseInt(userFormData.employe_id),
        })
        toast({
          title: "Succès",
          description: "Utilisateur créé avec succès",
        })
      }
      setUserDialogOpen(false)
      loadUsers()
      resetUserForm()
    } catch (error) {
      console.error("Error saving user:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'utilisateur",
        variant: "destructive",
      })
    }
  }

  const handleUserDelete = async (userId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await api.delete(`/user/${userId}`)
        toast({
          title: "Succès",
          description: "Utilisateur supprimé avec succès",
        })
        loadUsers()
      } catch (error) {
        console.error("Error deleting user:", error)
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'utilisateur",
          variant: "destructive",
        })
      }
    }
  }

  const resetUserForm = () => {
    setUserFormData({
      userName: "",
      password: "",
      confirmPassword: "",
      employe_id: "",
    })
    setFormErrors({
      userName: "",
      password: "",
      confirmPassword: "",
      employe_id: "",
    })
    setSelectedUser(null)
  }

  const openUserEditDialog = (user: User) => {
    setSelectedUser(user)
    setUserFormData({
      userName: user.userName,
      password: "",
      confirmPassword: "",
      employe_id: user.employe_id.toString(),
    })
    setUserDialogOpen(true)
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications")
      setNotifications(response.data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    if (!isClient) return
    
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isClient])

  // Mark a notification as read
  const markNotificationAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/mark-read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      )
    } catch (error) {
      console.error("Error marking notification read:", error)
    }
  }

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await api.post("/notifications/mark-all-read")
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userRole")
      localStorage.removeItem("username")
    }
    router.push("/")
  }

  // Add useEffect to monitor users state changes
  useEffect(() => {
    console.log("Current users state:", users)
  }, [users])

  // Helper function to safely get username from localStorage
  const getStoredUsername = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("username") || ""
    }
    return ""
  }

  // Show loading state until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-orange-50/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex bg-orange-50/50 text-gray-800 relative">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 fixed md:static z-20 h-full w-64 bg-white shadow-md overflow-y-auto`}>
        <div className="p-6 border-b">
          <OlirabLogo size="lg" />
        </div>
        <div className="mt-4">
          <p className="px-6 text-gray-400 text-sm uppercase font-medium mb-2">Menu</p>
          {["employees", "stock", "accounting", "menu", "users"].map(section => (
            <div
              key={section}
              className={`py-3 px-6 cursor-pointer transition-colors flex items-center gap-2 ${
                activeSection === section ? "bg-orange-50 border-l-4 border-orange-500 text-orange-700" : "text-gray-600 hover:bg-orange-50/50"
              }`}
              onClick={() => {
                setActiveSection(section as any)
                if (isMobile) setSidebarOpen(false)
              }}
            >
              {section === "employees" && <User className="h-4 w-4" />}
              {section === "stock" && <Package className="h-4 w-4" />}
              {section === "accounting" && <CreditCard className="h-4 w-4" />}
              {section === "menu" && <UtensilsCrossed className="h-4 w-4" />}
              {section === "users" && <Users className="h-4 w-4" />}
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="md:hidden top-4 left-4 z-30">
            <Button variant="outline" size="icon" className="bg-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          <h1 className="text-2xl font-bold">
            {activeSection === "employees" && "Gestion des Employés"}
            {activeSection === "stock" && "Gestion du Stock"}
            {activeSection === "accounting" && "Gestion Comptable"}
            {activeSection === "menu" && "Gestion du Menu"}
            {activeSection === "users" && "Gestion des Utilisateurs"}
          </h1>

          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.read_at).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {notifications.filter(n => !n.read_at).length}
                </span>
              )}
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <p className="text-gray-600">Bienvenue</p>
              <Avatar className="h-10 w-10 border-2 border-orange-100">
                <AvatarFallback className="bg-orange-100 text-orange-700">
                  {username ? username.charAt(0).toUpperCase() : "A"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{username}</span>
            </div>
            <Button variant="destructive" onClick={() => setShowLogoutConfirmation(true)}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Sections */}
        {activeSection === "employees" && <EmployeeManagement />}
        {activeSection === "stock" && <StockManagement />}
        {activeSection === "accounting" && <AccountingManagement />}
        {activeSection === "menu" && <MenuManagement />}
        
        {/* User Management Section */}
        {activeSection === "users" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  resetUserForm()
                  setUserDialogOpen(true)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </div>

            <div className="bg-white rounded-lg shadow">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom d'utilisateur</TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.userName}</TableCell>
                        <TableCell>
                          {(() => {
                            const employee = employees.find(emp => emp.id === user.employe_id);
                            return employee 
                              ? `${employee.name} ${employee.lastName || ''}`
                              : "Non assigné";
                          })()}
                        </TableCell>
                        <TableCell>{user.employe?.role || "Non assigné"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            className="mr-2"
                            onClick={() => openUserEditDialog(user)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleUserDelete(user.id)}
                          >
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* User Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedUser ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}</DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? "Modifiez les informations de l'utilisateur."
                  : "Remplissez les informations pour créer un nouvel utilisateur."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUserSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="userName">Nom d'utilisateur</Label>
                  <Input
                    id="userName"
                    value={userFormData.userName}
                    onChange={(e) => setUserFormData({ ...userFormData, userName: e.target.value })}
                    className={formErrors.userName ? "border-red-500" : ""}
                  />
                  {formErrors.userName && (
                    <p className="text-sm text-red-500">{formErrors.userName}</p>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {selectedUser ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500">{formErrors.password}</p>
                  )}
                </div>

                {!selectedUser && (
                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={userFormData.confirmPassword}
                      onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                      className={formErrors.confirmPassword ? "border-red-500" : ""}
                    />
                    {formErrors.confirmPassword && (
                      <p className="text-sm text-red-500">{formErrors.confirmPassword}</p>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="employe_id">Employé</Label>
                  <Select
                    value={userFormData.employe_id}
                    onValueChange={(value) => setUserFormData({ ...userFormData, employe_id: value })}
                  >
                    <SelectTrigger className={formErrors.employe_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.name} - {employee.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.employe_id && (
                    <p className="text-sm text-red-500">{formErrors.employe_id}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedUser ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Notifications Drawer */}
        {notificationsOpen && (
          <div className="absolute top-20 right-20 w-80 bg-white shadow-lg rounded-lg overflow-hidden z-50">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">Notifications</h2>
              <Button size="sm" variant="ghost" onClick={markAllNotificationsAsRead}>
                Mark all as read
              </Button>
            </div>
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex gap-3 items-start">
                    <div
                      className={`p-2 rounded-full ${
                        notification.type === "low_stock" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                      }`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${!notification.read_at ? "font-bold" : ""}`}>
                        {notification.message}
                      </p>
                      {notification.data.expiry_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expiration: {new Date(notification.data.expiry_date).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            )}
          </div>
        )}
      </div>

      {/* Logout Dialog */}
      <LogoutConfirmationDialog isOpen={showLogoutConfirmation} onClose={() => setShowLogoutConfirmation(false)} />
    </div>
  )
}
