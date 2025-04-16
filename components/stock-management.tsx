"use client"

import { useState } from "react"
import { Pencil, Plus, Trash2, UtensilsCrossed, Package, Coffee, Store, Info } from "lucide-react"
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

type StockCategory = "Ingrédients" | "Boissons" | "Emballages" | "Autre"

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

export function StockManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Form states
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
    
  ])

  // Filtrer les produits
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.supplier.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    return matchesSearch && product.category.toLowerCase() === activeTab.toLowerCase()
  })

  // Fonctions de suppression
  const deleteProduct = (id: number) => {
    setProducts(products.filter((prod) => prod.id !== id))
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

  // Formatter le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(price)
  }

  return (
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
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value as StockCategory })}
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
            <TabsTrigger value="boissons" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
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
                className={`grid grid-cols-6 p-4 items-center ${
                  index % 2 === 0 ? "bg-white" : "bg-orange-50/50"
                } hover:bg-orange-50 transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      product.quantity === 0
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
                    ${
                      product.quantity === 0
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
  )
}
