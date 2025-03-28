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

interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({ isOpen, onClose }) => {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")
    router.push("/login")
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

