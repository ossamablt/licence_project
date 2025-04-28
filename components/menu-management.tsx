"use client"

import { useState, useRef, useEffect } from "react"
import { Pencil, Plus, Trash2, Search, ImageIcon, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import api from "@/lib/api"
import Image from "next/image"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  catégory_id: number
  is_available: boolean
  imageUrl: string
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

export function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [viewItemOpen, setViewItemOpen] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: 0,
    catégory_id: 1,
    is_available: true,
    imageUrl: "/placeholder.svg",
  })
//Catégorie
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await api.get("/menuItems")
        setMenuItems(response.data["Menu Items"].map((item: any) => ({
          ...item,
          imageUrl: item.imageUrl || "/placeholder.svg"
        })))
      } catch (error) {
        toast({ title: "Erreur", description: "Échec du chargement des plats", variant: "destructive" })
      }
    }
    fetchMenuItems()
  }, [])

  const categories = ["all",...Object.values(categoryMap)]

  const filteredItems = menuItems.filter((item) => {
    const categoryName = categoryMap[item.catégory_id] || ""
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || categoryName === activeCategory
    return matchesSearch && matchesCategory
  })

  const deleteMenuItem = async (id: number) => {
    try {
      await api.delete(`/menuItems/${id}`)
      setMenuItems(menuItems.filter((item) => item.id !== id))
      toast({ title: "Plat supprimé", description: "Le plat a été supprimé avec succès" })
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de la suppression du plat", variant: "destructive" })
    }
  }

  const handleMenuItemSubmit = async () => {
    if (!newItem.name || !newItem.catégory_id || newItem.price === undefined) {
      toast({ title: "Informations manquantes", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" })
      return
    }

    const formData = new FormData()
    formData.append("name", newItem.name)
    formData.append("description", newItem.description)
    formData.append("price", newItem.price.toString())
    formData.append("catégory_id", newItem.catégory_id.toString())
    formData.append("is_available", newItem.is_available ? "1" : "0")
    if (imageFile) formData.append("image", imageFile)

    try {
      if (isEditMode && selectedItem) {
        await api.put(`/menuItems/${selectedItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      } else {
        await api.post("/menuItems", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      const response = await api.get("/menuItems")
      setMenuItems(response.data["Menu Items"].map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl || "/placeholder.svg"
      })))

      toast({
        title: isEditMode ? "Plat mis à jour" : "Plat ajouté",
        description: `Le plat a été ${isEditMode ? "mis à jour" : "ajouté"} avec succès`,
      })

      setAddItemOpen(false)
      setIsEditMode(false)
      setNewItem({
        name: "",
        description: "",
        price: 0,
        catégory_id: 1,
        is_available: true,
        imageUrl: "/placeholder.svg",
      })
      setImageFile(null)
    } catch (error) {
      toast({ title: "Erreur", description: `Échec ${isEditMode ? "de la mise à jour" : "de l'ajout"} du plat`, variant: "destructive" })
    }
  }

  const openEditItem = (item: MenuItem) => {
    setSelectedItem(item)
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price,
      catégory_id: item.catégory_id,
      is_available: item.is_available,
      imageUrl: item.imageUrl,
    })
    setIsEditMode(true)
    setAddItemOpen(true)
  }

  const viewItemDetails = (item: MenuItem) => {
    setSelectedItem(item)
    setViewItemOpen(true)
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewItem({ ...newItem, imageUrl: event.target.result as string })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus size={18} className="mr-2" />
                Ajouter un plat
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Modifier le plat" : "Ajouter un nouveau plat"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Modifiez les informations du plat." : "Remplissez les informations pour ajouter un nouveau plat au menu."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du plat</Label>
                    <Input id="name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Nom du plat" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={newItem.catégory_id.toString()} onValueChange={(value) => setNewItem({ ...newItem, catégory_id: parseInt(value) })}>
                      <SelectTrigger id="category" >
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent className=" bg-orange-100">
                        {Object.entries(categoryMap).map(([id, name]) => (
                          <SelectItem key={id} value={id}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input id="price" type="number" step="0.01" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="available">Disponibilité</Label>
                    <Select value={newItem.is_available ? "true" : "false"} onValueChange={(value) => setNewItem({ ...newItem, is_available: value === "true" })}>
                      <SelectTrigger id="available">
                        <SelectValue placeholder="Disponibilité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Disponible</SelectItem>
                        <SelectItem value="false">Indisponible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description du plat" />
                </div>

                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                      <Image
                        src={newItem.imageUrl}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                        }}
                      />
                    </div>
                    <div>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Choisir une image
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setAddItemOpen(false); setIsEditMode(false) }}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    handleMenuItemSubmit();
                    setIsEditMode(false);
                  }}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isEditMode ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input placeholder="Rechercher un plat..." className="w-full pl-10 border-gray-200" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <Tabs defaultValue="all" onValueChange={setActiveCategory} className="w-auto">
          <TabsList className="bg-white border overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                {category === "all" ? "Tous" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id} className={`overflow-hidden hover:shadow-md transition-shadow ${!item.is_available ? "opacity-500" : ""}`}>
            <div className="relative h-48 w-full">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg'
                }}
              />
             
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <span className="font-bold text-orange-500">{formatPrice(item.price)}</span>
              </div>
              <div className="flex items-center mb-3">
                <span className="text-xs px-1 py-0.5 bg-orange-100 text-orange-800 rounded-full">
                  {categoryMap[item.catégory_id]}
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.description}</p>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => viewItemDetails(item)}>
                  Détails
                </Button>
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => openEditItem(item)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => deleteMenuItem(item.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Aucun plat trouvé</h3>
          <p className="text-gray-500 mt-1">Essayez de modifier vos critères de recherche ou ajoutez un nouveau plat.</p>
        </div>
      )}

      <Dialog open={viewItemOpen} onOpenChange={setViewItemOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Détails du plat</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="relative h-64 w-full rounded-md overflow-hidden">
                <Image
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg'
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                <div className="text-2xl font-bold text-orange-500">{formatPrice(selectedItem.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{categoryMap[selectedItem.catégory_id]}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${selectedItem.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {selectedItem.is_available ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewItemOpen(false)}>Fermer</Button>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => { setViewItemOpen(false); openEditItem(selectedItem) }}>
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}