"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Pencil, Plus, Trash2, Search, ImageIcon, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { getMenuItems } from "@/lib/sharedDataService"
import Image from "next/image"

interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  image: string
  description?: string
  available?: boolean
}

export function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [viewItemOpen, setViewItemOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form states
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: "",
    category: "Burgers",
    price: 0,
    image: "/placeholder.svg?height=200&width=200",
    description: "",
    available: true,
  })

  // Initial menu items from shared data service
  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    getMenuItems().map((item) => ({
      ...item,
      description: `Délicieux ${item.name} préparé avec des ingrédients frais.`,
      available: true,
    })),
  )

  // Get all unique categories
  const categories = ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))]

  // Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    return activeCategory === "all" ? matchesSearch : matchesSearch && item.category === activeCategory
  })

  // Delete menu item
  const deleteMenuItem = (id: number) => {
    setMenuItems(menuItems.filter((item) => item.id !== id))
    toast({
      title: "Plat supprimé",
      description: "Le plat a été supprimé avec succès",
    })
  }

  // Add or edit menu item
  const handleMenuItemSubmit = () => {
    if (!newItem.name || !newItem.category || newItem.price === undefined) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    if (isEditMode && selectedItem) {
      // Update existing item
      setMenuItems(
        menuItems.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                name: newItem.name || item.name,
                category: newItem.category || item.category,
                price: newItem.price !== undefined ? newItem.price : item.price,
                image: newItem.image || item.image,
                description: newItem.description || item.description,
                available: newItem.available !== undefined ? newItem.available : item.available,
              }
            : item,
        ),
      )
      toast({
        title: "Plat mis à jour",
        description: "Le plat a été mis à jour avec succès",
      })
    } else {
      // Add new item
      const id = menuItems.length > 0 ? Math.max(...menuItems.map((item) => item.id)) + 1 : 1
      const newMenuItem: MenuItem = {
        id,
        name: newItem.name || "",
        category: newItem.category || "Burgers",
        price: newItem.price || 0,
        image: newItem.image || "/placeholder.svg?height=200&width=200",
        description: newItem.description || "",
        available: newItem.available !== undefined ? newItem.available : true,
      }
      setMenuItems([...menuItems, newMenuItem])
      toast({
        title: "Plat ajouté",
        description: "Le nouveau plat a été ajouté avec succès",
      })
    }

    // Reset form
    setAddItemOpen(false)
    setIsEditMode(false)
    setNewItem({
      name: "",
      category: "Burgers",
      price: 0,
      image: "/placeholder.svg?height=200&width=200",
      description: "",
      available: true,
    })
  }

  // Open edit form
  const openEditItem = (item: MenuItem) => {
    setSelectedItem(item)
    setNewItem({
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      description: item.description,
      available: item.available,
    })
    setIsEditMode(true)
    setAddItemOpen(true)
  }

  // View item details
  const viewItemDetails = (item: MenuItem) => {
    setSelectedItem(item)
    setViewItemOpen(true)
  }

  // Format price
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In a real app, you would upload the file to a server and get a URL
      // For this demo, we'll use a placeholder
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewItem({ ...newItem, image: event.target.result as string })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
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
                  {isEditMode
                    ? "Modifiez les informations du plat."
                    : "Remplissez les informations pour ajouter un nouveau plat au menu."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du plat</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Nom du plat"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Burgers">Burgers</SelectItem>
                        <SelectItem value="Accompagnements">Accompagnements</SelectItem>
                        <SelectItem value="Boissons">Boissons</SelectItem>
                        <SelectItem value="Desserts">Desserts</SelectItem>
                        <SelectItem value="Menus">Menus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix (€)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="available">Disponibilité</Label>
                    <Select
                      value={newItem.available ? "true" : "false"}
                      onValueChange={(value) => setNewItem({ ...newItem, available: value === "true" })}
                    >
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
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Description du plat"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                      <Image
                        src={newItem.image || "/placeholder.svg?height=96&width=96"}
                        alt="Aperçu"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Choisir une image
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddItemOpen(false)
                    setIsEditMode(false)
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={handleMenuItemSubmit} className="bg-orange-500 hover:bg-orange-600">
                  {isEditMode ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Rechercher un plat..."
              className="w-full pl-10 border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Tabs defaultValue="all" onValueChange={setActiveCategory} className="w-auto">
          <TabsList className="bg-white border overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              >
                {category === "all" ? "Tous" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card
            key={item.id}
            className={`overflow-hidden hover:shadow-md transition-shadow ${!item.available ? "opacity-60" : ""}`}
          >
            <div className="relative h-48 w-full">
              <Image
                src={item.image || "/placeholder.svg?height=192&width=300"}
                alt={item.name}
                fill
                className="object-cover"
              />
              {!item.available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-bold px-2 py-1 bg-red-500 rounded">Indisponible</span>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{item.name}</h3>
                <span className="font-bold text-orange-500">{formatPrice(item.price)}</span>
              </div>
              <div className="flex items-center mb-3">
                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full">{item.category}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.description}</p>
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => viewItemDetails(item)}
                >
                  Détails
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={() => openEditItem(item)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => deleteMenuItem(item.id)}
                  >
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
          <p className="text-gray-500 mt-1">
            Essayez de modifier vos critères de recherche ou ajoutez un nouveau plat.
          </p>
        </div>
      )}

      {/* View Item Dialog */}
      <Dialog open={viewItemOpen} onOpenChange={setViewItemOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Détails du plat</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="relative h-64 w-full rounded-md overflow-hidden">
                <Image
                  src={selectedItem.image || "/placeholder.svg?height=256&width=500"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedItem.name}</h2>
                <div className="text-2xl font-bold text-orange-500">{formatPrice(selectedItem.price)}</div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{selectedItem.category}</span>
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                    selectedItem.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedItem.available ? "Disponible" : "Indisponible"}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-700">{selectedItem.description}</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewItemOpen(false)}>
                  Fermer
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    setViewItemOpen(false)
                    openEditItem(selectedItem)
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
