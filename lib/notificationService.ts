
import { toast } from "@/hooks/use-toast"
import { mockOrders } from "./mockData"
import api from "@/lib/api"

type NotificationType =
  | "order.new"
  | "order.updated"
  | "order.ready"
  | "order.paid"
  | "kitchen.notification"
  | "cashier.notification"
  | "stock.low"
  | "stock.expiring"

type NotificationHandler = (data: any) => void
type NotificationChannel = "server" | "kitchen" | "cashier" | "global" | "manager"

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

  connect() {
    if (typeof window === "undefined") return
    this.userRole = localStorage.getItem("userRole")

    if (this.userRole === "server") {
      this.channels = ["server", "global"]
    } else if (this.userRole === "kitchen") {
      this.channels = ["kitchen", "global"]
    } else if (this.userRole === "cashier") {
      this.channels = ["cashier", "global"]
    } else if (this.userRole === "Gérant") {
      this.channels = ["manager", "global"]
    } else {
      this.channels = ["global"]
    }

    console.log(`Notification service connected for role: ${this.userRole}`)
    this.connected = true
    this.simulateIncomingNotifications()

    return this
  }

  disconnect() {
    this.connected = false
    console.log("Notification service disconnected")
  }

  subscribe(type: NotificationType, handler: NotificationHandler): string {
    if (!this.subscribers[type]) {
      this.subscribers[type] = {}
    }

    const id = Date.now().toString()
    this.subscribers[type]![id] = handler
    return id
  }

  unsubscribe(type: NotificationType, id: string) {
    if (this.subscribers[type] && this.subscribers[type]![id]) {
      delete this.subscribers[type]![id]
    }
  }

  publish(type: NotificationType, data: any, channel: NotificationChannel = "global") {
    console.log(`Publishing ${type} to ${channel}:`, data)

    setTimeout(() => {
      this.notifySubscribers(type, { ...data, sentFrom: this.userRole })
    }, 500)
  }

  private notifySubscribers(type: NotificationType, data: any) {
    const subscribers = this.subscribers[type]
    if (subscribers) {
      Object.values(subscribers).forEach((handler) => {
        handler(data)
      })
    }
  }

  private async fetchStockNotifications() {
    try {
      const response = await api.get('/notifications/stock')
      return response.data
    } catch (error) {
      console.error('Error fetching stock notifications:', error)
      return []
    }
  }

  private async handleStockNotifications() {
    if (this.userRole === 'Gérant') {
      setInterval(async () => {
        const notifications = await this.fetchStockNotifications()
        notifications.forEach((notification: any) => {
          this.publish(
            notification.type === 'low_stock' ? 'stock.low' : 'stock.expiring',
            notification,
            'manager'
          )

          toast({
            title: notification.type === 'low_stock'
              ? 'Stock Faible'
              : 'Produit Périssable',
            description: notification.message,
            variant: notification.type === 'low_stock' ? 'destructive' : 'default'
          })
        })
      }, 60000)
    }
  }

  private simulateIncomingNotifications() {
    this.handleStockNotifications()

    if (!this.userRole || !this.connected) return

    const orderStatuses = ["pending", "preparing", "ready", "completed"]

    if (this.userRole === "kitchen" && this.channels.includes("kitchen")) {
      setInterval(() => {
        if (Math.random() > 0.7) {
          const mockOrder = {
            id: Math.floor(Math.random() * 100) + 100,
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
      }, 60000)
    }

    if (this.userRole === "server" && this.channels.includes("server")) {
      setInterval(() => {
        if (Math.random() > 0.7) {
          const mockOrderUpdate = {
            id: Math.floor(Math.random() * 100) + 100,
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
      }, 45000)
    }

    if (this.userRole === "cashier" && this.channels.includes("cashier")) {
      setInterval(() => {
        if (Math.random() > 0.7) {
          const mockOrderReady = {
            id: Math.floor(Math.random() * 100) + 100,
            tableNumber: Math.floor(Math.random() * 8) + 1,
            total: Math.floor(Math.random() * 50) + 10,
          }

          this.notifySubscribers("order.ready", mockOrderReady)

          toast({
            title: "Commande prête pour paiement",
            description: `Table ${mockOrderReady.tableNumber}: ${mockOrderReady.total}€`,
          })
        }
      }, 70000)
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService()

export default notificationService
