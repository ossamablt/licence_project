// This service simulates a real-time backend by using localStorage and polling

// Types
export interface OrderItem {
  id: number
  menuItemId: number
  name: string
  price: number
  quantity: number
}

export interface Order {
  id: number
  tableId?: number
  tableNumber?: number
  type: "sur place" | "à emporter" | "livraison"
  status: "pending" | "preparing" | "ready" | "completed" | "paid"
  items: OrderItem[]
  total: number
  createdAt: Date | string
  notifiedKitchen: boolean
  notifiedCashier: boolean
}

export interface Table {
  id: number
  number: number
  seats: number
  status: "free" | "occupied" | "reserved"
  orderId?: number
}

export interface MenuItem {
  id: number
  name: string
  category: string
  price: number
  image: string
}

// Menu items data
export const menuItems: MenuItem[] = [
  { id: 1, name: "Burger Classic", category: "Burgers", price: 8.5, image: "/images/burger-classic.png" },
  { id: 2, name: "Burger Cheese", category: "Burgers", price: 9.5, image: "/images/burger-cheese.png" },
  { id: 3, name: "Burger Double", category: "Burgers", price: 12.0, image: "/images/burger-double.png" },
  { id: 4, name: "Frites", category: "Accompagnements", price: 3.5, image: "/images/frites.png" },
  { id: 5, name: "Onion Rings", category: "Accompagnements", price: 4.0, image: "/images/onion-rings.png" },
  { id: 6, name: "Salade", category: "Accompagnements", price: 4.5, image: "/images/salade.png" },
  { id: 7, name: "Coca-Cola", category: "Boissons", price: 2.5, image: "/images/cola.png" },
  { id: 8, name: "Eau", category: "Boissons", price: 1.5, image: "/images/eau.png" },
  { id: 9, name: "Bière", category: "Boissons", price: 4.0, image: "/images/biere.png" },
  { id: 10, name: "Glace", category: "Desserts", price: 3.5, image: "/images/glace.png" },
  { id: 11, name: "Brownie", category: "Desserts", price: 4.5, image: "/images/brownie.png" },
  { id: 12, name: "Menu Enfant", category: "Menus", price: 7.5, image: "/images/menu-enfant.png" },
  { id: 13, name: "Menu Classique", category: "Menus", price: 12.5, image: "/images/menu-classique.png" },
  { id: 14, name: "Menu Maxi", category: "Menus", price: 15.0, image: "/images/menu-maxi.png" },
]

// Initial data
const initialOrders: Order[] = [
  {
    id: 1,
    tableId: 2,
    tableNumber: 2,
    type: "sur place",
    status: "preparing",
    items: [
      { id: 1, menuItemId: 1, name: "Burger Classic", price: 8.5, quantity: 2 },
      { id: 2, menuItemId: 4, name: "Frites", price: 3.5, quantity: 2 },
      { id: 3, menuItemId: 7, name: "Coca-Cola", price: 2.5, quantity: 2 },
    ],
    total: 29.0,
    createdAt: new Date().toISOString(),
    notifiedKitchen: true,
    notifiedCashier: false,
  },
  {
    id: 2,
    tableId: 7,
    tableNumber: 7,
    type: "sur place",
    status: "pending",
    items: [
      { id: 1, menuItemId: 13, name: "Menu Classique", price: 12.5, quantity: 4 },
      { id: 2, menuItemId: 9, name: "Bière", price: 4.0, quantity: 4 },
    ],
    total: 66.0,
    createdAt: new Date().toISOString(),
    notifiedKitchen: false,
    notifiedCashier: false,
  },
]

const initialTables: Table[] = [
  { id: 1, number: 1, seats: 2, status: "free" },
  { id: 2, number: 2, seats: 2, status: "occupied", orderId: 1 },
  { id: 3, number: 3, seats: 4, status: "free" },
  { id: 4, number: 4, seats: 4, status: "reserved" },
  { id: 5, number: 5, seats: 6, status: "free" },
  { id: 6, number: 6, seats: 6, status: "free" },
  { id: 7, number: 7, seats: 8, status: "occupied", orderId: 2 },
  { id: 8, number: 8, seats: 2, status: "free" },
]

// Initialize localStorage if needed
const initializeData = () => {
  if (typeof window === "undefined") return

  if (!localStorage.getItem("orders")) {
    localStorage.setItem("orders", JSON.stringify(initialOrders))
  }

  if (!localStorage.getItem("tables")) {
    localStorage.setItem("tables", JSON.stringify(initialTables))
  }

  if (!localStorage.getItem("lastOrderId")) {
    localStorage.setItem("lastOrderId", "2")
  }
}

// Get all orders
export const getOrders = (): Order[] => {
  if (typeof window === "undefined") return []

  initializeData()
  const ordersJson = localStorage.getItem("orders")
  return ordersJson ? JSON.parse(ordersJson) : []
}

// Get orders for kitchen (pending or preparing)
export const getKitchenOrders = (): Order[] => {
  const orders = getOrders()
  return orders.filter((order) => (order.status === "pending" && order.notifiedKitchen) || order.status === "preparing")
}

// Get orders for cashier (ready for payment)
export const getCashierOrders = (): Order[] => {
  const orders = getOrders()
  return orders.filter((order) => order.status === "ready" && order.notifiedCashier)
}

// Get all tables
export const getTables = (): Table[] => {
  if (typeof window === "undefined") return []

  initializeData()
  const tablesJson = localStorage.getItem("tables")
  return tablesJson ? JSON.parse(tablesJson) : []
}

// Get table by ID
export const getTableById = (tableId: number): Table | undefined => {
  const tables = getTables()
  return tables.find((table) => table.id === tableId)
}

// Get order by ID
export const getOrderById = (orderId: number): Order | undefined => {
  const orders = getOrders()
  return orders.find((order) => order.id === orderId)
}

// Get order by table ID
export const getOrderByTableId = (tableId: number): Order | undefined => {
  const orders = getOrders()
  return orders.find((order) => order.tableId === tableId && order.status !== "paid" && order.status !== "completed")
}

// Create a new order
export const createOrder = (order: Omit<Order, "id" | "createdAt" | "notifiedKitchen" | "notifiedCashier">): Order => {
  const orders = getOrders()
  const lastOrderId = Number.parseInt(localStorage.getItem("lastOrderId") || "0")
  const newOrderId = lastOrderId + 1

  const newOrder: Order = {
    ...order,
    id: newOrderId,
    createdAt: new Date().toISOString(),
    notifiedKitchen: false,
    notifiedCashier: false,
  }

  orders.push(newOrder)
  localStorage.setItem("orders", JSON.stringify(orders))
  localStorage.setItem("lastOrderId", newOrderId.toString())

  // Update table status if it's a table order
  if (order.tableId) {
    const tables = getTables()
    const updatedTables = tables.map((table) =>
      table.id === order.tableId ? { ...table, status: "occupied" as const, orderId: newOrderId } : table,
    )
    localStorage.setItem("tables", JSON.stringify(updatedTables))
  }

  return newOrder
}

// Update an order
export const updateOrder = (updatedOrder: Order): Order => {
  const orders = getOrders()
  const updatedOrders = orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))

  localStorage.setItem("orders", JSON.stringify(updatedOrders))

  // Update table status if needed
  if (updatedOrder.status === "paid" && updatedOrder.tableId) {
    const tables = getTables()
    const updatedTables = tables.map((table) =>
      table.id === updatedOrder.tableId ? { ...table, status: "free" as const, orderId: undefined } : table,
    )
    localStorage.setItem("tables", JSON.stringify(updatedTables))
  }

  return updatedOrder
}

// Notify kitchen about an order
export const notifyKitchen = (orderId: number): Order | undefined => {
  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) return undefined

  const updatedOrder = {
    ...orders[orderIndex],
    notifiedKitchen: true,
    status: "pending" as const,
  }

  orders[orderIndex] = updatedOrder
  localStorage.setItem("orders", JSON.stringify(orders))

  return updatedOrder
}

// Update order status in kitchen
export const updateOrderStatus = (
  orderId: number,
  status: "pending" | "preparing" | "ready" | "completed",
): Order | undefined => {
  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) return undefined

  const updatedOrder = {
    ...orders[orderIndex],
    status,
  }

  // If order is ready, notify cashier
  if (status === "ready") {
    updatedOrder.notifiedCashier = true
  }

  orders[orderIndex] = updatedOrder
  localStorage.setItem("orders", JSON.stringify(orders))

  return updatedOrder
}

// Notify cashier about an order ready for payment
export const notifyCashier = (orderId: number): Order | undefined => {
  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) return undefined

  const updatedOrder = {
    ...orders[orderIndex],
    notifiedCashier: true,
  }

  orders[orderIndex] = updatedOrder
  localStorage.setItem("orders", JSON.stringify(orders))

  return updatedOrder
}

// Process payment for an order
export const processPayment = (orderId: number): Order | undefined => {
  const orders = getOrders()
  const orderIndex = orders.findIndex((order) => order.id === orderId)

  if (orderIndex === -1) return undefined

  const updatedOrder = {
    ...orders[orderIndex],
    status: "paid" as const,
  }

  orders[orderIndex] = updatedOrder
  localStorage.setItem("orders", JSON.stringify(orders))

  // Free up the table
  if (updatedOrder.tableId) {
    const tables = getTables()
    const updatedTables = tables.map((table) =>
      table.id === updatedOrder.tableId ? { ...table, status: "free" as const, orderId: undefined } : table,
    )
    localStorage.setItem("tables", JSON.stringify(updatedTables))
  }

  return updatedOrder
}

// Reserve a table
export const reserveTable = (tableId: number): Table | undefined => {
  const tables = getTables()
  const tableIndex = tables.findIndex((table) => table.id === tableId)

  if (tableIndex === -1) return undefined

  const updatedTable = {
    ...tables[tableIndex],
    status: "reserved" as const,
  }

  tables[tableIndex] = updatedTable
  localStorage.setItem("tables", JSON.stringify(tables))

  return updatedTable
}

// Get all menu items
export const getMenuItems = (): MenuItem[] => {
  return menuItems
}

// Get menu item by ID
export const getMenuItemById = (id: number): MenuItem | undefined => {
  return menuItems.find((item) => item.id === id)
}
