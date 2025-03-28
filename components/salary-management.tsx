"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Pencil, Plus, Trash2, Download, Filter, Search } from "lucide-react"

interface Employee {
  id: number
  name: string
  role: string
  baseSalary: number
  bonuses: number
  deductions: number
  netSalary: number
  lastPayment: string
  status: "Payé" | "En attente" | "Retard"
}

// Sample data
const initialEmployees: Employee[] = [
  {
    id: 1,
    name: "MR.Zenir",
    role: "Manager",
    baseSalary: 3200,
    bonuses: 500,
    deductions: 200,
    netSalary: 3500,
    lastPayment: "25/02/2023",
    status: "Payé",
  },
  {
    id: 2,
    name: "Abd Arrahim",
    role: "Serveur",
    baseSalary: 1800,
    bonuses: 150,
    deductions: 100,
    netSalary: 1850,
    lastPayment: "25/02/2023",
    status: "Payé",
  },
  {
    id: 3,
    name: "Ossamablt",
    role: "Chef Cuisine",
    baseSalary: 2500,
    bonuses: 300,
    deductions: 150,
    netSalary: 2650,
    lastPayment: "25/02/2023",
    status: "Payé",
  },
  {
    id: 4,
    name: "Rauf",
    role: "Caissier",
    baseSalary: 1700,
    bonuses: 100,
    deductions: 80,
    netSalary: 1720,
    lastPayment: "25/02/2023",
    status: "Payé",
  },
  {
    id: 5,
    name: "Sophie Martin",
    role: "Serveur",
    baseSalary: 1800,
    bonuses: 0,
    deductions: 100,
    netSalary: 1700,
    lastPayment: "25/02/2023",
    status: "En attente",
  },
  {
    id: 6,
    name: "Thomas Dubois",
    role: "Chef Cuisine",
    baseSalary: 2400,
    bonuses: 0,
    deductions: 150,
    netSalary: 2250,
    lastPayment: "25/01/2023",
    status: "Retard",
  },
]

export function SalaryManagement() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    name: "",
    role: "",
    baseSalary: 0,
    bonuses: 0,
    deductions: 0,
    status: "En attente",
  })

  // Filter employees based on search term and status
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === "all") return matchesSearch
    return matchesSearch && employee.status === statusFilter
  })

  // Calculate total salary expenses
  const totalSalaryExpenses = employees.reduce((total, emp) => total + emp.netSalary, 0)

  // Handle employee deletion
  const handleDeleteEmployee = (id: number) => {
    setEmployees(employees.filter((emp) => emp.id !== id))
  }

  // Handle employee edit
  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee)
  }

  // Save edited employee
  const saveEditedEmployee = () => {
    if (editEmployee) {
      setEmployees(employees.map((emp) => (emp.id === editEmployee.id ? editEmployee : emp)))
      setEditEmployee(null)
    }
  }

  // Add new employee
  const addNewEmployee = () => {
    const netSalary = (newEmployee.baseSalary || 0) + (newEmployee.bonuses || 0) - (newEmployee.deductions || 0)

    const employee: Employee = {
      id: employees.length + 1,
      name: newEmployee.name || "",
      role: newEmployee.role || "",
      baseSalary: newEmployee.baseSalary || 0,
      bonuses: newEmployee.bonuses || 0,
      deductions: newEmployee.deductions || 0,
      netSalary: netSalary,
      lastPayment: "N/A",
      status: (newEmployee.status as "Payé" | "En attente" | "Retard") || "En attente",
    }

    setEmployees([...employees, employee])
    setNewEmployee({
      name: "",
      role: "",
      baseSalary: 0,
      bonuses: 0,
      deductions: 0,
      status: "En attente",
    })
    setIsAddDialogOpen(false)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Total des Salaires</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalSalaryExpenses)}</p>
          <p className="text-sm text-gray-500 mt-1">Mensuel</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Nombre d'Employés</p>
          <p className="text-2xl font-bold mt-1">{employees.length}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Actifs: {employees.filter((e) => e.status !== "Retard").length}</span>
            <span>En retard: {employees.filter((e) => e.status === "Retard").length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Salaire Moyen</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalSalaryExpenses / (employees.length || 1))}</p>
          <p className="text-sm text-gray-500 mt-1">Par employé</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus size={18} className="mr-2" />
                Ajouter un employé
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un nouvel employé</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour ajouter un nouvel employé au système de paie.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nom
                  </Label>
                  <Input
                    id="name"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Rôle
                  </Label>
                  <Input
                    id="role"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="baseSalary" className="text-right">
                    Salaire de base
                  </Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={newEmployee.baseSalary}
                    onChange={(e) => setNewEmployee({ ...newEmployee, baseSalary: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bonuses" className="text-right">
                    Primes
                  </Label>
                  <Input
                    id="bonuses"
                    type="number"
                    value={newEmployee.bonuses}
                    onChange={(e) => setNewEmployee({ ...newEmployee, bonuses: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="deductions" className="text-right">
                    Déductions
                  </Label>
                  <Input
                    id="deductions"
                    type="number"
                    value={newEmployee.deductions}
                    onChange={(e) => setNewEmployee({ ...newEmployee, deductions: Number(e.target.value) })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Statut
                  </Label>
                  <Select
                    value={newEmployee.status as string}
                    onValueChange={(value) =>
                      setNewEmployee({ ...newEmployee, status: value as "Payé" | "En attente" | "Retard" })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Payé">Payé</SelectItem>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Retard">Retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={addNewEmployee}>
                  Ajouter
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
            <Download size={18} className="mr-2" />
            Exporter
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Rechercher un employé..."
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
              <SelectItem value="Payé">Payé</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="Retard">Retard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-orange-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50">
              <TableHead>Employé</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Salaire de base</TableHead>
              <TableHead>Primes</TableHead>
              <TableHead>Déductions</TableHead>
              <TableHead>Salaire net</TableHead>
              <TableHead>Dernier paiement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} className="hover:bg-orange-50/50">
                <TableCell className="font-medium">{employee.name}</TableCell>
                <TableCell>{employee.role}</TableCell>
                <TableCell>{formatCurrency(employee.baseSalary)}</TableCell>
                <TableCell>{formatCurrency(employee.bonuses)}</TableCell>
                <TableCell>{formatCurrency(employee.deductions)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(employee.netSalary)}</TableCell>
                <TableCell>{employee.lastPayment}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      employee.status === "Payé"
                        ? "bg-green-100 text-green-800"
                        : employee.status === "En attente"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employee.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Pencil size={16} />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Modifier les informations de salaire</DialogTitle>
                          <DialogDescription>
                            Modifiez les informations de salaire pour {employee.name}.
                          </DialogDescription>
                        </DialogHeader>
                        {editEmployee && (
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-baseSalary" className="text-right">
                                Salaire de base
                              </Label>
                              <Input
                                id="edit-baseSalary"
                                type="number"
                                value={editEmployee.baseSalary}
                                onChange={(e) =>
                                  setEditEmployee({ ...editEmployee, baseSalary: Number(e.target.value) })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-bonuses" className="text-right">
                                Primes
                              </Label>
                              <Input
                                id="edit-bonuses"
                                type="number"
                                value={editEmployee.bonuses}
                                onChange={(e) => setEditEmployee({ ...editEmployee, bonuses: Number(e.target.value) })}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-deductions" className="text-right">
                                Déductions
                              </Label>
                              <Input
                                id="edit-deductions"
                                type="number"
                                value={editEmployee.deductions}
                                onChange={(e) =>
                                  setEditEmployee({ ...editEmployee, deductions: Number(e.target.value) })
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="edit-status" className="text-right">
                                Statut
                              </Label>
                              <Select
                                value={editEmployee.status}
                                onValueChange={(value) =>
                                  setEditEmployee({
                                    ...editEmployee,
                                    status: value as "Payé" | "En attente" | "Retard",
                                  })
                                }
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Sélectionner un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Payé">Payé</SelectItem>
                                  <SelectItem value="En attente">En attente</SelectItem>
                                  <SelectItem value="Retard">Retard</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button type="submit" onClick={saveEditedEmployee}>
                            Enregistrer
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteEmployee(employee.id)}
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
    </div>
  )
}

