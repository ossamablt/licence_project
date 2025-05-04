"use client"

import { useState, useEffect } from "react"
import { Pencil, Plus, Trash2, UtensilsCrossed, Package, Coffee, Store, Info, Fish } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

type Productcategory = "ingredient" | "boisson" 
type ProductType = "perishable" | "non_perishable"
//boisson
interface Product {
  id: number
  name: string
  unit_price: number
  current_quantity: number
  minimum_quantity: number
  type: ProductType
  expiration_date?: string
  fournisseur: string
  category: Productcategory
  last_restock?: string
}

export function StockManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>("all")
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    unit_price: 0,
    current_quantity: 0,
    minimum_quantity: 0,
    type: "non_perishable",
    category: "ingredient",
    fournisseur: "",
    expiration_date: "",
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        if (response.data && response.data.products) {
          // Map the API response to match our Product interface
          const productsData = response.data.products.map((product: any) => ({
            id: product.id,
            name: product.name,
            unit_price: product.unit_price,
            current_quantity: product.current_quantity,
            minimum_quantity: product.minimum_quantity,
            type: product.type,
            expiration_date: product.expiration_date,
            fournisseur: product.fournisseur,
            category: product.category,
            last_restock: product.last_restock
          }));
          setProducts(productsData);
        } else {
          console.error("Invalid products data format:", response.data);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits",
          variant: "destructive",
        });
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product): product is Product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.fournisseur.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    return matchesSearch && product.category.toLowerCase() === activeTab.toLowerCase()
  })

  const deleteProduct = async (id: number) => {
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(prod => prod.id !== id))
      // Show a modern toast notification instead of alert
      if (typeof window !== "undefined" && "Notification" in window) {
        // Optionally use browser notifications if allowed
        if (Notification.permission === "granted") {
          new Notification("Produit supprimé avec succès.")
        } else {
          // Fallback to a simple toast div
          const toast = document.createElement("div")
          toast.textContent = "Produit supprimé avec succès."
          toast.style.position = "fixed"
          toast.style.bottom = "32px"
          toast.style.right = "32px"
          toast.style.background = "#f97316"
          toast.style.color = "#fff"
          toast.style.padding = "14px 24px"
          toast.style.borderRadius = "8px"
          toast.style.boxShadow = "0 2px 12px rgba(0,0,0,0.12)"
          toast.style.fontSize = "1rem"
          toast.style.zIndex = "9999"
          toast.style.opacity = "0"
          toast.style.transition = "opacity 0.3s"
          document.body.appendChild(toast)
          setTimeout(() => { toast.style.opacity = "1" }, 10)
          setTimeout(() => {
        toast.style.opacity = "0"
        setTimeout(() => document.body.removeChild(toast), 300)
          }, 2000)
        }
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      window.alert("Erreur lors de la suppression du produit.")
    }
  }

  const handleProductSubmit = async () => {
    try {
      if (isEditMode && selectedProduct) {
        const response = await api.put(`/products/${selectedProduct.id}`, newProduct)
        setProducts(prev => prev.map(prod => 
          prod.id === selectedProduct.id ? response.data : prod
        ))
      } else {
        const response = await api.post("/products", newProduct)
        setProducts(prev => [...prev, response.data])
      }
      setAddProductOpen(false)
      setIsEditMode(false)
      resetForm()
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const openEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setNewProduct({
      ...product,
      expiration_date: product.expiration_date?.split("T")[0]
    })
    setIsEditMode(true)
    setAddProductOpen(true)
  }

  const resetForm = () => {
    setNewProduct({
      name: "",
      unit_price: 0,
      current_quantity: 0,
      minimum_quantity: 0,
      type: "non_perishable",
      category: "ingredient",
      fournisseur: "",
      expiration_date: "",
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", { 
      style: "currency", 
      currency: "EUR" 
    }).format(price)
  }

  return (
    <>
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
                      value={newProduct.category}
                      onValueChange={(value) => setNewProduct({ ...newProduct, category: value as Productcategory })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ingredient">ingredient</SelectItem>
                  
                        <SelectItem value="boisson">boisson</SelectItem>

                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newProduct.type}
                      onValueChange={(value) => setNewProduct({ ...newProduct, type: value as ProductType })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perishable">Périssable</SelectItem>
                        <SelectItem value="non_perishable">Non périssable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Prix unitaire (€)</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      step="0.01"
                      value={newProduct.unit_price}
                      onChange={(e) => setNewProduct({ ...newProduct, unit_price: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_quantity">Quantité</Label>
                    <Input
                      id="current_quantity"
                      type="number"
                      value={newProduct.current_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, current_quantity: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimum_quantity">Stock minimum</Label>
                    <Input
                      id="minimum_quantity"
                      type="number"
                      value={newProduct.minimum_quantity}
                      onChange={(e) => setNewProduct({ ...newProduct, minimum_quantity: Number(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fournisseur">Fournisseur</Label>
                    <Input
                      id="fournisseur"
                      value={newProduct.fournisseur}
                      onChange={(e) => setNewProduct({ ...newProduct, fournisseur: e.target.value })}
                      placeholder="Nom du fournisseur"
                    />
                  </div>
                  {newProduct.type === "perishable" && (
                    <div className="space-y-2">
                      <Label htmlFor="expiration_date">Date d'expiration</Label>
                      <Input
                        id="expiration_date"
                        type="date"
                        value={newProduct.expiration_date}
                        onChange={(e) => setNewProduct({ ...newProduct, expiration_date: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddProductOpen(false)
                    setIsEditMode(false)
                    resetForm()
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
              value="ingredient"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              ingredient
            </TabsTrigger>
            <TabsTrigger
              value="poisson"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Fish className="h-4 w-4 mr-2" />
              Poisson
            </TabsTrigger>
            <TabsTrigger value="boisson" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Coffee className="h-4 w-4 mr-2" />
              boisson
            </TabsTrigger>
            <TabsTrigger
              value="emballage"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Emballage
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

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
                      product.current_quantity === 0
                        ? "bg-red-100 text-red-700"
                        : product.current_quantity <= product.minimum_quantity
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    <Package className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="text-gray-600">{formatPrice(product.unit_price)}</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${
                      product.current_quantity === 0
                        ? "bg-red-100 text-red-800"
                        : product.current_quantity <= product.minimum_quantity
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {product.current_quantity} unités
                  </span>
                </div>
                <div className="text-gray-600">{product.minimum_quantity} unités</div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{product.fournisseur}</span>
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