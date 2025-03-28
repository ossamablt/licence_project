import { toast } from "@/hooks/use-toast"
import { mockOrders } from "./mockData"

// Simple pub/sub system for frontend-only version

type NotificationType =
  | "order.new"
  | "order.updated"
  | "order.ready"
  | "order.paid"
  | "kitchen.notification"
  | "cashier.notification"
type NotificationHandler = (data: any) => void
type NotificationChannel = "server" | "kitchen" | "cashier" | "global"

// Singleton to store shared state across components
let sharedOrders = [...mockOrders]

export const getSharedOrders = () => sharedOrders
export const setSharedOrders = (orders: any[]) => {
  sharedOrders = orders
}

class NotificationService {
  private subscribers: {
    [key in NotificationType]?: {
      [id: string]: NotificationHandler
    }
  } = {}
  private connected = false
  private userRole: string | null = null
  private channels: NotificationChannel[] = []

  // Initialize connection
  connect() {
    if (typeof window === "undefined") return
    this.userRole = localStorage.getItem("userRole")

    // Define which channels this role should listen to
    if (this.userRole === "server") {
      this.channels = ["server", "global"]
    } else if (this.userRole === "kitchen") {
      this.channels = ["kitchen", "global"]
    } else if (this.userRole === "cashier") {
      this.channels = ["cashier", "global"]
    } else {
      this.channels = ["global"]
    }

    console.log(`Notification service connected for role: ${this.userRole}`)
    this.connected = true
    this.simulateIncomingNotifications()

    return this
  }

  // Disconnect
  disconnect() {
    this.connected = false
    console.log("Notification service disconnected")
  }

  // Subscribe to a notification type
  subscribe(type: NotificationType, handler: NotificationHandler): string {
    if (!this.subscribers[type]) {
      this.subscribers[type] = {}
    }

    const id = Date.now().toString()
    this.subscribers[type]![id] = handler
    return id
  }

  // Unsubscribe from notifications
  unsubscribe(type: NotificationType, id: string) {
    if (this.subscribers[type] && this.subscribers[type]![id]) {
      delete this.subscribers[type]![id]
    }
  }

  // Publish a notification
  publish(type: NotificationType, data: any, channel: NotificationChannel = "global") {
    console.log(`Publishing ${type} to ${channel}:`, data)

    // For demo purposes, we'll simulate echo back from the server
    setTimeout(() => {
      this.notifySubscribers(type, { ...data, sentFrom: this.userRole })
    }, 500)
  }

  // Notify all subscribers of a certain type
  private notifySubscribers(type: NotificationType, data: any) {
    const subscribers = this.subscribers[type]
    if (subscribers) {
      Object.values(subscribers).forEach((handler) => {
        handler(data)
      })
    }
  }

  // For demo purposes only - simulate incoming notifications
  private simulateIncomingNotifications() {
    // Only setup for certain roles
    if (!this.userRole || !this.connected) return

    const orderStatuses = ["pending", "preparing", "ready", "completed"]

    // Simulate different notifications based on role
    if (this.userRole === "kitchen" && this.channels.includes("kitchen")) {
      // Kitchen occasionally gets new orders
      setInterval(() => {
        if (Math.random() > 0.7) {
          const mockOrder = {
            id: Math.floor(Math.random() * 100) + 100, // High ID to avoid conflicts
            tableNumber: Math.floor(Math.random() * 8) + 1,
            items: [{ name: "Shawarma Algérienne", quantity: 1 }],
            status: "pending",
          }

          this.notifySubscribers("order.new", mockOrder)

          toast({
            title: "Nouvelle commande",
            description: `Table ${mockOrder.tableNumber}: Shawarma Algérienne`,
          })
        }
      }, 60000) // Once a minute chance of new order
    }

    if (this.userRole === "server" && this.channels.includes("server")) {
      // Server gets order status updates
      setInterval(() => {
        if (Math.random() > 0.7) {
          const mockOrderUpdate = {
            id: Math.floor(Math.random() * 100) + 100, // High ID to avoid conflicts
            tableNumber: Math.floor(Math.random() * 8) + 1,
            status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          }

          this.notifySubscribers("order.updated", mockOrderUpdate)

          toast({
            title: "Commande mise à jour",
            description: `Commande pour Table ${mockOrderUpdate.tableNumber} est ${
              mockOrderUpdate.status === "preparing"
                ? "en préparation"
                : mockOrderUpdate.status === "ready"
                  ? "prête"
                  : mockOrderUpdate.status === "completed"
                    ? "terminée"
                    : "en attente"
            }`,
          })
        }
      }, 45000) // Every 45 seconds chance of order update
    }

    if (this.userRole === "cashier" && this.channels.includes("cashier")) {
      // Cashier gets ready orders
      setInterval(() => {
        if (Math.random() > 0.7) {
          const mockOrderReady = {
            id: Math.floor(Math.random() * 100) + 100, // High ID to avoid conflicts
            tableNumber: Math.floor(Math.random() * 8) + 1,
            total: Math.floor(Math.random() * 50) + 10,
          }

          this.notifySubscribers("order.ready", mockOrderReady)

          toast({
            title: "Commande prête pour paiement",
            description: `Table ${mockOrderReady.tableNumber}: ${mockOrderReady.total}€`,
          })
        }
      }, 70000) // Every 70 seconds chance of payment notification
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService

