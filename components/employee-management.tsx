import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, User, ChefHat, CreditCard, Coffee, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import api from "@/lib/api"


type EmployeeRole = "Serveur" | "Caissier" | "Cuisinier" 

interface Employee {
  id: number
  name: string
  role: EmployeeRole
  dateOfHire: string
  lastName: string
  avatar?: string
  email?: string
  phoneNumber?: string
  addresse?: string

}

const getRoleIcon = (role: EmployeeRole) => {
  switch (role) {
    case "Cuisinier": return <ChefHat className="h-4 w-4" />
    case "Caissier": return <CreditCard className="h-4 w-4" />
    case "Serveur": return <Coffee className="h-4 w-4" />
    default: return <User className="h-4 w-4" />
  }
}

export function EmployeeManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [employeePropertiesOpen, setEmployeePropertiesOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    role: "Serveur",
    lastName: "",
    dateOfHire: new Date().toLocaleDateString("fr-FR"),
    email: "",
    phoneNumber: "",
    addresse: "",
 
  })

  const [employees, setEmployees] = useState<Employee[]>([])

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employes")
        setEmployees(res.data.employes)
      } catch (err) {
        console.error("Erreur lors du chargement des employés", err)
      }
    }
    fetchEmployees()
  }, [])

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    if (activeTab === "all") return matchesSearch
    return matchesSearch && employee.role.toLowerCase() === activeTab.toLowerCase()
  })

  const deleteEmployee = async (id: number) => {
    try {
      // Delete employee from the backend
      await api.delete(`/employes/${id}`)

      // Remove employee locally from state
      setEmployees(employees.filter((emp) => emp.id !== id))

      // Show success alert
      window.alert("Employé supprimé avec succès.")
    } catch (error) {
      console.error("Erreur lors de la suppression de l'employé", error)
      window.alert("Erreur lors de la suppression de l'employé.")
    }
  }

  const handleEmployeeSubmit = async () => {
    try {
      if (isEditMode && selectedEmployee) {
        const response = await api.put(`/employes/${selectedEmployee.id}`, {
          name: newEmployee.name,
          role: newEmployee.role,
          lastName: newEmployee.lastName,
          dateOfHire: newEmployee.dateOfHire,
          email: newEmployee.email,
          phoneNumber: newEmployee.phoneNumber,
          addresse: newEmployee.addresse,
 
        })
  
        // Update the employee locally openEditEmployee 
        setEmployees(employees.map((emp) => (emp.id === selectedEmployee.id ? { ...selectedEmployee, ...response.data } : emp)))
      } else {
        const response = await api.post("/employes", {
          name: newEmployee.name,
          lastName: newEmployee.lastName,
          phoneNumber: newEmployee.phoneNumber,
          email: newEmployee.email,
          dateOfHire: newEmployee.dateOfHire,
          addresse: newEmployee.addresse,
      
          role: newEmployee.role,
        })

        const newEmp: Employee = {
          id: response.data.id,
          name: response.data.name,
          role: response.data.role,
          dateOfHire: new Date().toLocaleDateString("fr-FR"),
          lastName: newEmployee.lastName || "",
          email: newEmployee.email || "",
          phoneNumber: newEmployee.phoneNumber || "",
          addresse: newEmployee.addresse || "",
    
        }

        setEmployees((prev) => [...prev, newEmp])
      }

      setAddEmployeeOpen(false)
      setIsEditMode(false)
      setNewEmployee({
        name: "",
        role: "Serveur",
        lastName: "",
        dateOfHire: new Date().toLocaleDateString("fr-FR"),
        email: "",
        phoneNumber: "",
        addresse: "",
   
      })
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'employé", error)
    }
  }

  const openEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setNewEmployee({
      name: employee.name,
      role: employee.role,
      lastName: employee.lastName,
      dateOfHire: employee.dateOfHire,
      email: employee.email,
      phoneNumber: employee.phoneNumber,
      addresse: employee.addresse,

    })
    setIsEditMode(true)
    setAddEmployeeOpen(true)
  }

  const viewEmployeeProperties = (employee: Employee) => {
    console.log("Viewing:", employee)
    setSelectedEmployee(employee)
    setEmployeePropertiesOpen(true)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  return (
   
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
                      <Label htmlFor="lastName">Désignation</Label>
                      <Input
                        id="lastName"
                        value={newEmployee.lastName}
                        onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
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
                          <SelectItem value="Cuisinier">Cuisinier</SelectItem>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfHire">Date d'embauche</Label>
                      <Input
                        id="dateOfHire"
                        value={newEmployee.dateOfHire}
                        onChange={(e) => setNewEmployee({ ...newEmployee, dateOfHire: e.target.value })}
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
                      <Label htmlFor="phoneNumber">TéléphoneNumber</Label>
                      <Input
                        id="phoneNumber"
                        value={newEmployee.phoneNumber}
                        onChange={(e) => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })}
                        placeholder="06 XX XX XX XX"
                      />
                    </div>
                  </div>
  
                  <div className="space-y-2">
                    <Label htmlFor="addresse">Adresse</Label>
                    <Input
                      id="addresse"
                      value={newEmployee.addresse}
                      onChange={(e) => setNewEmployee({ ...newEmployee, addresse: e.target.value })}
                      placeholder="Adresse complète"
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
              <TabsTrigger value="serveur" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Coffee className="h-4 w-4 mr-2" />
                Serveurs
              </TabsTrigger>
              <TabsTrigger value="caissier" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Caissiers
              </TabsTrigger>
              <TabsTrigger
                value="Cuisinier"
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
                  className={`grid grid-cols-5 p-4 items-center ${
                    index % 2 === 0 ? "bg-white" : "bg-orange-50/50"
                  } hover:bg-orange-50 transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.avatar || `/placeholder.svg?height=32&width=32`} />
                      <AvatarFallback className="bg-yellow-100 text-yellow-800">
                        {employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{employee.name}</span>
                  </div>
                  <div className="text-gray-600">{employee.lastName}</div>
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        employee.role === "Cuisinier"
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
                  <div className="text-gray-600">{employee.dateOfHire}</div>
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
                    <p className="text-gray-500">{selectedEmployee.lastName}</p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          selectedEmployee.role === "Cuisinier"
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
                    <h4 className="text-sm font-medium text-gray-500">TéléphoneNumber</h4>
                    <p>{selectedEmployee.phoneNumber || "Non renseigné"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Date d'embauche</h4>
                    <p>{selectedEmployee.dateOfHire}</p>
                  </div>
                  
                </div>
  
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Adresse</h4>
                  <p>{selectedEmployee.addresse || "Non renseignée"}</p>
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
    )
  
}
