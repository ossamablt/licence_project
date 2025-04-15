"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({ isOpen, onClose }) => {
  const router = useRouter()

  // Function to handle logout

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    if (token) {
      try {
        const response = await api.post("/logout")
        if (response.status === 200) {
          localStorage.removeItem("isLoggedIn")
          localStorage.removeItem("userRole")
          localStorage.removeItem("username")
          localStorage.removeItem("token")
          router.push("/")
        } else {
          console.error("Logout failed:", response.data.message)
        }
      }
      catch (error) {
        console.error("Logout error:", error)
      }
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer la déconnexion</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir vous déconnecter ? Toutes les modifications non enregistrées seront perdues.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            Déconnexion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

