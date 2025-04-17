"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/cart-provider"
import { CartItem as CartItemComponent } from "@/components/cart-item"
import Link from "next/link"
import { ShoppingCart, ShoppingBag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function FloatingCart() {
  const { items, totalItems, totalPrice } = useCart()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.div
                  key="cart-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {totalItems}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Votre Panier</SheetTitle>
          </SheetHeader>

          {totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Votre panier est vide</h3>
              <p className="text-gray-500 text-center mb-6">
                Ajoutez des produits à votre panier pour commencer votre commande
              </p>
              <Button asChild onClick={() => setIsOpen(false)}>
                <Link href="/client/menu">Voir le menu</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto py-6">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemComponent key={`${item.id}-${JSON.stringify(item.options)}`} item={item} compact />
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Sous-total</span>
                  <span>{totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Livraison</span>
                  <span>{totalPrice > 20 ? "Gratuit" : "2.99 €"}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg mb-6">
                  <span>Total</span>
                  <span>{(totalPrice + (totalPrice <= 20 ? 2.99 : 0)).toFixed(2)} €</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={() => setIsOpen(false)} asChild>
                    <Link href="/client/menu">Continuer</Link>
                  </Button>
                  <Button onClick={() => setIsOpen(false)} asChild>
                    <Link href="/client/cart">Commander</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
