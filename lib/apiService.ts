// API service for communicating with Laravel backend

// Base URL for API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://iuyceqfw8l.sharedwithexpose.com/api"

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json()

  if (!response.ok) {
    const error = data?.message || response.statusText
    return { success: false, message: error, data: null }
  }

  return { success: true, data, message: "Success" }
}

// Get the auth token from localStorage
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token")
  }
  return null
}

// API service object with methods for different operations
const apiService = {
  // Authentication
  login: async (username: string, password: string) => {
    try {
      // In a real app, this would connect to Laravel's auth endpoint
      // For now, we'll use a mock implementation
      const validCredentials = {
        serveur: { password: "serveur123", role: "server", token: "server-token-123" },
        caissier: { password: "caissier123", role: "cashier", token: "cashier-token-123" },
        cuisine: { password: "cuisine123", role: "kitchen", token: "kitchen-token-123" },
        admin: { password: "admin123", role: "admin", token: "admin-token-123" },
      }

      // Check if username exists
      const userKey = Object.keys(validCredentials).find((key) => key === username.toLowerCase())

      if (userKey) {
        const credentials = validCredentials[userKey as keyof typeof validCredentials]

        if (credentials.password === password) {
          return {
            success: true,
            data: {
              user: { username },
              role: credentials.role,
              token: credentials.token,
            },
            message: "Logged in successfully",
          }
        }
      }

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      return handleResponse(response);
      */

      return { success: false, message: "Invalid credentials", data: null }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Connection error", data: null }
    }
  },

  logout: async () => {
    try {
      const token = getToken()

      // In a real app, this would connect to Laravel's logout endpoint
      localStorage.removeItem("token")
      localStorage.removeItem("userRole")
      localStorage.removeItem("username")

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return handleResponse(response);
      */

      return { success: true, message: "Logged out successfully", data: null }
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, message: "Error during logout", data: null }
    }
  },

  // Orders
  getOrders: async () => {
    try {
      const token = getToken()

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return handleResponse(response);
      */

      // Mock response for demo
      return {
        success: true,
        data: [
          {
            id: 1,
            tableNumber: 1,
            time: "10:30",
            status: "preparing",
            items: [
              {
                id: 1,
                name: "Shawarma Algérienne",
                size: "large",
                options: {
                  Sauce: "Harissa",
                  Extras: "Frites",
                },
                price: 8.5,
              },
              {
                id: 2,
                name: "Thé à la menthe",
                size: "medium",
                options: {
                  Sucre: "Extra sucre",
                },
                price: 2.5,
              },
            ],
            total: 11.0,
            notifiedKitchen: true,
            notifiedCashier: false,
          },
          // Add more mock orders as needed
        ],
        message: "Orders retrieved successfully",
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      return { success: false, message: "Error retrieving orders", data: null }
    }
  },

  createOrder: async (orderData: any) => {
    try {
      const token = getToken()

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      
      return handleResponse(response);
      */

      // Mock response for demo
      return {
        success: true,
        data: {
          id: Math.floor(Math.random() * 1000),
          ...orderData,
          created_at: new Date().toISOString(),
        },
        message: "Order created successfully",
      }
    } catch (error) {
      console.error("Error creating order:", error)
      return { success: false, message: "Error creating order", data: null }
    }
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    try {
      const token = getToken()

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      return handleResponse(response);
      */

      // Mock response for demo
      return {
        success: true,
        data: {
          id: orderId,
          status: status,
          updated_at: new Date().toISOString(),
        },
        message: `Order status updated to ${status}`,
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      return { success: false, message: "Error updating order status", data: null }
    }
  },

  // Tables
  getTables: async () => {
    try {
      const token = getToken()

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return handleResponse(response);
      */

      // Mock response for demo
      return {
        success: true,
        data: [
          { id: 1, number: 1, seats: 4, status: "occupied" },
          { id: 2, number: 2, seats: 2, status: "occupied" },
          { id: 3, number: 3, seats: 4, status: "occupied" },
          { id: 4, number: 4, seats: 6, status: "free" },
          { id: 5, number: 5, seats: 2, status: "free" },
          { id: 6, number: 6, seats: 8, status: "reserved" },
          { id: 7, number: 7, seats: 4, status: "free" },
          { id: 8, number: 8, seats: 2, status: "free" },
        ],
        message: "Tables retrieved successfully",
      }
    } catch (error) {
      console.error("Error fetching tables:", error)
      return { success: false, message: "Error retrieving tables", data: null }
    }
  },

  updateTableStatus: async (tableId: number, status: string) => {
    try {
      const token = getToken()

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      return handleResponse(response);
      */

      // Mock response for demo
      return {
        success: true,
        data: {
          id: tableId,
          status: status,
          updated_at: new Date().toISOString(),
        },
        message: `Table status updated to ${status}`,
      }
    } catch (error) {
      console.error("Error updating table status:", error)
      return { success: false, message: "Error updating table status", data: null }
    }
  },

  // Menu Items
  getMenuItems: async () => {
    try {
      const token = getToken()

      // Uncomment this for real Laravel integration
      /*
      const response = await fetch(`${API_BASE_URL}/menu-items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      return handleResponse(response);
      */

      // Mock response for demo
      return {
        success: true,
        data: [
          {
            id: 1,
            name: "Shawarma Algérienne",
            category: "Plats",
            price: 8.5,
            image: "/placeholder.svg?height=100&width=100",
            options: [
              {
                name: "Sauce",
                choices: ["Harissa", "Mayonnaise", "Algérienne"],
              },
              {
                name: "Extras",
                choices: ["Frites", "Salade", "Oignons"],
              },
            ],
          },
          // Add more menu items as needed
        ],
        message: "Menu items retrieved successfully",
      }
    } catch (error) {
      console.error("Error fetching menu items:", error)
      return { success: false, message: "Error retrieving menu items", data: null }
    }
  },
}

export default apiService

