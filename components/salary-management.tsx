"use client"

import { useEffect, useState } from "react"
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
import { Download, Filter, Pencil, Plus, Search, Trash2 } from "lucide-react"
import api from "@/lib/api"

interface Employee {
  id: number
  name: string
  role: string
}

interface SalaryRecord {
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

export function SalaryManagement() {
  const [salaries, setSalaries] = useState<SalaryRecord[]>([])
  const [employeeOptions, setEmployeeOptions] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [editSalary, setEditSalary] = useState<SalaryRecord | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [newSalaryData, setNewSalaryData] = useState({
    baseSalary: 0,
    bonuses: 0,
    deductions: 0,
    status: "En attente",
  })

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await api.get("/salaries")
        const data = res.data.map((s: any) => ({
          id: s.id,
          name: s.employe?.name || `Employé ${s.employe_id}`,
          role: s.employe?.role || "-",
          baseSalary: s.amount,
          bonuses: s.primes,
          deductions: s.deduction,
          netSalary: s.total,
          lastPayment: s.last_payment_date || "N/A",
          status:
            s.status === "paid"
              ? "Payé"
              : s.status === "pending"
              ? "En attente"
              : "Retard",
        }))
        setSalaries(data)
      } catch (err) {
        console.error("Erreur lors du chargement des salaires", err)
      }
    }

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employes")
        setEmployeeOptions(res.data.employes)
      } catch (err) {
        console.error("Erreur lors du chargement des employés", err)
      }
    }

    fetchSalaries()
    fetchEmployees()
  }, [])

  const totalSalaryExpenses = salaries.reduce((sum, s) => sum + s.netSalary, 0)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount)
  }

  const handleDeleteSalary = async (id: number) => {
    try {
      await api.delete(`/salaries/${id}`)
      setSalaries((prev) => prev.filter((s) => s.id !== id))
    } catch (err) {
      console.error("Erreur lors de la suppression du salaire", err)
    }
  }

  const addNewSalary = async () => {
    if (!selectedEmployeeId) return
    const netSalary = newSalaryData.baseSalary + newSalaryData.bonuses - newSalaryData.deductions
    try {
      const res = await api.post("/salaries", {
        employe_id: selectedEmployeeId,
        amount: newSalaryData.baseSalary,
        primes: newSalaryData.bonuses,
        deduction: newSalaryData.deductions,
        status: newSalaryData.status === "Payé" ? "paid" : "pending",
        payment_method: "cash",
        last_payment_date: new Date().toISOString().split("T")[0],
      })

      const selectedEmp = employeeOptions.find((e) => e.id === selectedEmployeeId)
      const newRecord: SalaryRecord = {
        id: res.data.id,
        name: selectedEmp?.name || `Employé ${selectedEmployeeId}`,
        role: selectedEmp?.role || "-",
        baseSalary: newSalaryData.baseSalary,
        bonuses: newSalaryData.bonuses,
        deductions: newSalaryData.deductions,
        netSalary,
        lastPayment: new Date().toISOString().split("T")[0],
        status: newSalaryData.status as "Payé" | "En attente" | "Retard",
      }

      setSalaries([...salaries, newRecord])
      setSelectedEmployeeId(null)
      setNewSalaryData({ baseSalary: 0, bonuses: 0, deductions: 0, status: "En attente" })
      setIsAddDialogOpen(false)
    } catch (err) {
      console.error("Erreur lors de l'ajout du salaire", err)
    }
  }

  const saveEditedSalary = async () => {
    if (!editSalary) return
    try {
      await api.put(`/salaries/${editSalary.id}`, {
        amount: editSalary.baseSalary,
        primes: editSalary.bonuses,
        deduction: editSalary.deductions,
        status: editSalary.status === "Payé" ? "paid" : "pending",
      })

      const netSalary = editSalary.baseSalary + editSalary.bonuses - editSalary.deductions
      setSalaries((prev) =>
        prev.map((s) => s.id === editSalary.id ? { ...editSalary, netSalary } : s)
      )
      setEditSalary(null)
    } catch (err) {
      console.error("Erreur lors de la mise à jour du salaire", err)
    }
  }

  const filteredSalaries = salaries.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase())
    if (statusFilter === "all") return matchesSearch
    return matchesSearch && s.status === statusFilter
  })

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
          <p className="text-2xl font-bold mt-1">{employeeOptions.length}</p>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Actifs: {employeeOptions.length - salaries.filter(s => s.status === "Retard").length}</span>
            <span>En retard: {salaries.filter(s => s.status === "Retard").length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Salaire Moyen</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalSalaryExpenses / (employeeOptions.length || 1))}</p>
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
                Ajouter un salaire
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ajouter un salaire</DialogTitle>
                <DialogDescription>
                  Remplissez les informations pour ajouter un nouveau salaire.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employee" className="text-right">
                    Employé
                  </Label>
                  <Select onValueChange={v => setSelectedEmployeeId(Number(v))}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name} — {emp.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="baseSalary" className="text-right">
                    Salaire de base
                  </Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    value={newSalaryData.baseSalary}
                    onChange={e => setNewSalaryData({...newSalaryData, baseSalary: Number(e.target.value)})}
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
                    value={newSalaryData.bonuses}
                    onChange={e => setNewSalaryData({...newSalaryData, bonuses: Number(e.target.value)})}
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
                    value={newSalaryData.deductions}
                    onChange={e => setNewSalaryData({...newSalaryData, deductions: Number(e.target.value)})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Statut
                  </Label>
                  <Select
                    value={newSalaryData.status}
                    onValueChange={v => setNewSalaryData({...newSalaryData, status: v as any})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Statut" />
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
                <Button onClick={addNewSalary}>Enregistrer</Button>
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Rechercher un salaire..."
              className="w-full sm:w-64 pl-10 border-gray-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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

      {/* Salaries Table */}
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
            {filteredSalaries.map((s) => (
              <TableRow key={s.id} className="hover:bg-orange-50/50">
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>{s.role}</TableCell>
                <TableCell>{formatCurrency(s.baseSalary)}</TableCell>
                <TableCell>{formatCurrency(s.bonuses)}</TableCell>
                <TableCell>{formatCurrency(s.deductions)}</TableCell>
                <TableCell className="font-semibold">{formatCurrency(s.netSalary)}</TableCell>
                <TableCell>{s.lastPayment}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "Payé" ? "bg-green-100 text-green-800" :
                    s.status === "En attente" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {s.status}
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
                          onClick={() => setEditSalary(s)}
                        >
                          <Pencil size={16} />
                        </Button>
                      </DialogTrigger>
                      {editSalary && (
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Modifier le salaire</DialogTitle>
                            <DialogDescription>
                              Modifiez les informations pour {editSalary.name}.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Salaire de base</Label>
                              <Input
                                type="number"
                                value={editSalary.baseSalary}
                                onChange={e => setEditSalary({...editSalary, baseSalary: Number(e.target.value)})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Primes</Label>
                              <Input
                                type="number"
                                value={editSalary.bonuses}
                                onChange={e => setEditSalary({...editSalary, bonuses: Number(e.target.value)})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Déductions</Label>
                              <Input
                                type="number"
                                value={editSalary.deductions}
                                onChange={e => setEditSalary({...editSalary, deductions: Number(e.target.value)})}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label className="text-right">Statut</Label>
                              <Select
                                value={editSalary.status}
                                onValueChange={v => setEditSalary({...editSalary, status: v as any})}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Statut" />
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
                            <Button onClick={saveEditedSalary}>Enregistrer</Button>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDeleteSalary(s.id)}
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