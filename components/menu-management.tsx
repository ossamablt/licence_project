"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Pencil, Plus, Trash2, Search, ImageIcon, Tag, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
import api from "@/lib/api"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  catégory_id: number
  is_available: boolean
  imageUrl: string
}

interface PackDetail {
  item_id: number
  quantity: number
  menuItem?: MenuItem
}

interface Pack {
  id: number
  name: string
  description: string
  price: number
  is_available: boolean
  imageUrl: string
  pack_details: PackDetail[]
}

const categoryMap: { [key: number]: string } = {
  1: "Burgers",
  2: "Tacos",
  3: "Frites",
  4: "Pizzas",
  5: "Sushis",
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
  const [activeTab, setActiveTab] = useState<"items" | "packs">("items")
  const [addPackOpen, setAddPackOpen] = useState(false)
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [isPackEditMode, setIsPackEditMode] = useState(false)
  const [viewPackOpen, setViewPackOpen] = useState(false)
  const [packImageFile, setPackImageFile] = useState<File | null>(null)
  const packFileInputRef = useRef<HTMLInputElement>(null)

  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    price: 0,
    catégory_id: 1,
    is_available: true,
    imageUrl: "/placeholder.svg",
  })

  const [newPack, setNewPack] = useState({
    name: "",
    description: "",
    price: 0,
    is_available: true,
    imageUrl: "/placeholder.svg",
    pack_details: [] as PackDetail[],
  })

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [selectedMenuItems, setSelectedMenuItems] = useState<{ [key: number]: number }>({})

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await api.get("/menuItems")
        setMenuItems(
          response.data["Menu Items"].map((item: any) => ({
            ...item,
            imageUrl: item.imageUrl || "/placeholder.svg",
          })),
        )
      } catch (error) {
        toast({ title: "Erreur", description: "Échec du chargement des plats", variant: "destructive" })
      }
    }

    const fetchPacks = async () => {
      try {
        const response = await api.get("/packs")
        if (response.data && response.data.packs) {
          setPacks(response.data.packs)
        }
      } catch (error) {
        console.error("Error loading packs:", error)
        toast({ title: "Erreur", description: "Échec du chargement des packs", variant: "destructive" })
      }
    }

    fetchMenuItems()
    fetchPacks()
  }, [])

  const categories = ["all", ...Object.values(categoryMap)]

  const filteredItems = menuItems.filter((item) => {
    const categoryName = categoryMap[item.catégory_id] || ""
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === "all" || categoryName === activeCategory
    return matchesSearch && matchesCategory
  })

  const filteredPacks = packs.filter((pack) => {
    return pack.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const deleteMenuItem = async (id: number) => {
    try {
      await api.delete(`/menuItems/${id}`)
      setMenuItems((prev) => prev.filter((item) => item.id !== id))
      toast({ title: "Plat supprimé", description: "Le plat a été supprimé avec succès" })
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de la suppression du plat", variant: "destructive" })
    }
  }

  const deletePack = async (id: number) => {
    try {
      await api.delete(`/packs/${id}`)
      setPacks((prev) => prev.filter((pack) => pack.id !== id))
      toast({ title: "Pack supprimé", description: "Le pack a été supprimé avec succès" })
    } catch (error) {
      toast({ title: "Erreur", description: "Échec de la suppression du pack", variant: "destructive" })
    }
  }

  const handleMenuItemSubmit = async () => {
    if (!newItem.name || !newItem.catégory_id || newItem.price === undefined) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
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
        const response = await api.put(`/menuItems/${selectedItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === selectedItem.id
              ? {
                  ...response.data.menu_item,
                  imageUrl: response.data.menu_item.imageUrl || "/placeholder.svg",
                }
              : item,
          ),
        )
      } else {
        const response = await api.post("/menuItems", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        setMenuItems((prev) => [
          ...prev,
          {
            ...response.data.menu_item,
            imageUrl: response.data.menu_item.imageUrl || "/placeholder.svg",
          },
        ])
      }

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
      console.error("Erreur API:", error)
      toast({
        title: "Erreur",
        description: `Échec ${isEditMode ? "de la mise à jour" : "de l'ajout"} du plat`,
        variant: "destructive",
      })
    }
  }

  const handlePackSubmit = async () => {
    if (!newPack.name || newPack.price === undefined || Object.keys(selectedMenuItems).length === 0) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs obligatoires et sélectionner au moins un plat",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData()
    formData.append("name", newPack.name)
    formData.append("description", newPack.description)
    formData.append("price", newPack.price.toString())
    formData.append("is_available", newPack.is_available ? "1" : "0")
    if (packImageFile) formData.append("image", packImageFile)

    // Add pack details
    Object.entries(selectedMenuItems).forEach(([itemId, quantity], index) => {
      if (quantity > 0) {
        formData.append(`pack_details[${index}][item_id]`, itemId)
        formData.append(`pack_details[${index}][quantity]`, quantity.toString())
      }
    })

    try {
      if (isPackEditMode && selectedPack) {
        const response = await api.put(`/packs/${selectedPack.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        setPacks((prev) => prev.map((pack) => (pack.id === selectedPack.id ? response.data.pack : pack)))
      } else {
        const response = await api.post("/packs", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })

        setPacks((prev) => [...prev, response.data.pack])
      }

      toast({
        title: isPackEditMode ? "Pack mis à jour" : "Pack ajouté",
        description: `Le pack a été ${isPackEditMode ? "mis à jour" : "ajouté"} avec succès`,
      })

      setAddPackOpen(false)
      setIsPackEditMode(false)
      setNewPack({
        name: "",
        description: "",
        price: 0,
        is_available: true,
        imageUrl: "/placeholder.svg",
        pack_details: [],
      })
      setSelectedMenuItems({})
      setPackImageFile(null)
    } catch (error) {
      console.error("Erreur API:", error)
      toast({
        title: "Erreur",
        description: `Échec ${isPackEditMode ? "de la mise à jour" : "de l'ajout"} du pack`,
        variant: "destructive",
      })
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

  const openEditPack = (pack: Pack) => {
    setSelectedPack(pack)

    // Initialize selected menu items from pack details
    const selectedItems: { [key: number]: number } = {}
    pack.pack_details.forEach((detail) => {
      selectedItems[detail.item_id] = detail.quantity
    })

    setSelectedMenuItems(selectedItems)

    setNewPack({
      name: pack.name,
      description: pack.description,
      price: pack.price,
      is_available: pack.is_available,
      imageUrl: pack.imageUrl,
      pack_details: pack.pack_details,
    })

    setIsPackEditMode(true)
    setAddPackOpen(true)
  }

  const viewItemDetails = (item: MenuItem) => {
    setSelectedItem(item)
    setViewItemOpen(true)
  }

  const viewPackDetails = (pack: Pack) => {
    setSelectedPack(pack)
    setViewPackOpen(true)
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

  const handlePackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPackImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewPack({ ...newPack, imageUrl: event.target.result as string })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMenuItemSelection = (itemId: number, quantity: number) => {
    setSelectedMenuItems((prev) => {
      const updated = { ...prev }
      if (quantity <= 0) {
        delete updated[itemId]
      } else {
        updated[itemId] = quantity
      }
      return updated
    })
  }

  const calculateTotalPackPrice = () => {
    let total = 0
    Object.entries(selectedMenuItems).forEach(([itemId, quantity]) => {
      const item = menuItems.find((item) => item.id === Number.parseInt(itemId))
      if (item) {
        total += item.price * quantity
      }
    })
    return total
  }

const getMenuItemById = (id: number) => {
  return menuItems.find((item) => item.id === id)
}

return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "items" | "packs")} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="items" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Plats
          </TabsTrigger>
          <TabsTrigger value="packs" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            Packs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-0">
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
                          value={newItem.catégory_id.toString()}
                          onValueChange={(value) => setNewItem({ ...newItem, catégory_id: Number.parseInt(value) })}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent className=" bg-orange-100">
                            {Object.entries(categoryMap).map(([id, name]) => (
                              <SelectItem key={id} value={id}>
                                {name}
                              </SelectItem>
                            ))}
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
                          value={newItem.is_available ? "true" : "false"}
                          onValueChange={(value) => setNewItem({ ...newItem, is_available: value === "true" })}
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
                            src={newItem.imageUrl || "/placeholder.svg"}
                            alt="Aperçu"
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                            }}
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
                    <Button
                      onClick={() => {
                        handleMenuItemSubmit()
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`overflow-hidden hover:shadow-md transition-shadow ${!item.is_available ? "opacity-500" : ""}`}
              >
                <div className="relative h-60 w-full">
                  <Image
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg"
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
        </TabsContent>

        <TabsContent value="packs" className="mt-0">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <Dialog open={addPackOpen} onOpenChange={setAddPackOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus size={18} className="mr-2" />
                    Créer un pack
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isPackEditMode ? "Modifier le pack" : "Créer un nouveau pack"}</DialogTitle>
                    <DialogDescription>
                      {isPackEditMode
                        ? "Modifiez les informations du pack."
                        : "Sélectionnez les plats à inclure dans le pack et définissez son prix."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="packName">Nom du pack</Label>
                        <Input
                          id="packName"
                          value={newPack.name}
                          onChange={(e) => setNewPack({ ...newPack, name: e.target.value })}
                          placeholder="Nom du pack"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="packPrice">Prix (€)</Label>
                        <Input
                          id="packPrice"
                          type="number"
                          step="0.01"
                          value={newPack.price}
                          onChange={(e) => setNewPack({ ...newPack, price: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500">
                          Prix total des articles: {formatPrice(calculateTotalPackPrice())}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packDescription">Description</Label>
                      <Textarea
                        id="packDescription"
                        value={newPack.description}
                        onChange={(e) => setNewPack({ ...newPack, description: e.target.value })}
                        placeholder="Description du pack"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="packAvailable">Disponibilité</Label>
                      <Select
                        value={newPack.is_available ? "true" : "false"}
                        onValueChange={(value) => setNewPack({ ...newPack, is_available: value === "true" })}
                      >
                        <SelectTrigger id="packAvailable">
                          <SelectValue placeholder="Disponibilité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Disponible</SelectItem>
                          <SelectItem value="false">Indisponible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Image</Label>
                      <div className="flex items-center gap-4">
                        <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                          <Image
                            src={newPack.imageUrl || "/placeholder.svg"}
                            alt="Aperçu"
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                            }}
                          />
                        </div>
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={packFileInputRef}
                            onChange={handlePackImageUpload}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => packFileInputRef.current?.click()}
                            className="w-full"
                          >
                            <ImageIcon className="h-4 w-4 mr-2" />
                            Choisir une image
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label className="text-lg font-medium">Sélectionner les plats</Label>
                      <p className="text-sm text-gray-500 mb-4">
                        Choisissez les plats à inclure dans ce pack et leur quantité
                      </p>

                      <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                        {menuItems.map((item) => (
                          <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center gap-3">
                              <div className="relative h-12 w-12 rounded-md overflow-hidden">
                                <Image
                                  src={item.imageUrl || "/placeholder.svg"}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-neutral-500">{categoryMap[item.catégory_id]}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{formatPrice(item.price)}</span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      handleMenuItemSelection(item.id, (selectedMenuItems[item.id] || 0) - 1)
                                    }
                                    disabled={(selectedMenuItems[item.id] || 0) <= 0}
                                  >
                                    <span className="sr-only">Diminuer</span>
                                    <span>-</span>
                                  </Button>
                                  <span className="w-8 text-center">{selectedMenuItems[item.id] || 0}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() =>
                                      handleMenuItemSelection(item.id, (selectedMenuItems[item.id] || 0) + 1)
                                    }
                                  >
                                    <span className="sr-only">Augmenter</span>
                                    <span>+</span>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                      <h4 className="font-medium mb-2">Articles sélectionnés</h4>
                      {Object.keys(selectedMenuItems).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(selectedMenuItems).map(([itemId, quantity]) => {
                            if (quantity <= 0) return null
                            const item = getMenuItemById(Number.parseInt(itemId))
                            if (!item) return null
                            return (
                              <div key={itemId} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{quantity}x</span>
                                  <span>{item.name}</span>
                                </div>
                                <span>{formatPrice(item.price * quantity)}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Aucun article sélectionné</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAddPackOpen(false)
                        setIsPackEditMode(false)
                        setSelectedMenuItems({})
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handlePackSubmit}
                      className="bg-orange-500 hover:bg-orange-600"
                      disabled={
                        Object.keys(selectedMenuItems).filter((key) => selectedMenuItems[Number.parseInt(key)] > 0)
                          .length === 0
                      }
                    >
                      {isPackEditMode ? "Enregistrer" : "Créer le pack"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Rechercher un pack..."
                  className="w-full pl-10 border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {filteredPacks.map((pack) => (
              <Card
                key={pack.id}
                className={`overflow-hidden hover:shadow-md transition-shadow ${!pack.is_available ? "opacity-500" : ""}`}
              >
                <div className="relative h-60 w-full">
                  <Image
                    src={pack.imageUrl || "/placeholder.svg"}
                    alt={pack.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-orange-500">{pack.pack_details.length} articles</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{pack.name}</h3>
                    <span className="font-bold text-orange-500">{formatPrice(pack.price)}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{pack.description}</p>
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => viewPackDetails(pack)}
                    >
                      Détails
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => openEditPack(pack)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deletePack(pack.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPacks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">Aucun pack trouvé</h3>
              <p className="text-gray-500 mt-1">Créez un nouveau pack en cliquant sur le bouton "Créer un pack".</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Item Dialog */}
      <Dialog open={viewItemOpen} onOpenChange={setViewItemOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Détails du plat</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="relative h-50 w-full rounded-md overflow-hidden object-cover">
                <Image
                  src={selectedItem.imageUrl || "/placeholder.svg"}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
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
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${selectedItem.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {selectedItem.is_available ? "Disponible" : "Indisponible"}
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
                  <Pencil className="h-4 w-4 mr-2" /> Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Pack Dialog */}
      <Dialog open={viewPackOpen} onOpenChange={setViewPackOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Détails du pack</DialogTitle>
          </DialogHeader>
          {selectedPack && (
            <div className="space-y-4">
              <div className="relative h-50 w-full rounded-md overflow-hidden object-cover">
                <Image
                  src={selectedPack.imageUrl || "/placeholder.svg"}
                  alt={selectedPack.name}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedPack.name}</h2>
                <div className="text-2xl font-bold text-orange-500">{formatPrice(selectedPack.price)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{selectedPack.pack_details.length} articles</span>
                <span
                  className={`ml-auto text-xs px-2 py-0.5 rounded-full ${selectedPack.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {selectedPack?.is_available ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-700">{selectedPack.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Contenu du pack</h3>
                <div className="space-y-2 bg-orange-50 p-3 rounded-lg">
                  {selectedPack.pack_details.map((detail, index) => {
                    const menuItem = getMenuItemById(detail.item_id)
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{detail.quantity}x</span>
                          <span>{menuItem ? menuItem.name : `Article #${detail.item_id}`}</span>
                        </div>
                        <span>{menuItem ? formatPrice(menuItem.price * detail.quantity) : "-"}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewPackOpen(false)}>
                  Fermer
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    setViewPackOpen(false)
                    openEditPack(selectedPack)
                  }}
                >
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
