// API service for communicating with Laravel backend

// Base URL for API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://m4hh9gvofs.sharedwithexpose.com/api"

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
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Connection error", data: null }
    }
  },

  logout: async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      localStorage.removeItem("token")
      localStorage.removeItem("userRole")
      localStorage.removeItem("username")

      return handleResponse(response)
    } catch (error) {
      console.error("Logout error:", error)
      return { success: false, message: "Error during logout", data: null }
    }
  },

  // Orders
  getOrders: async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error fetching orders:", error)
      return { success: false, message: "Error retrieving orders", data: null }
    }
  },

  createOrder: async (orderData: any) => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error creating order:", error)
      return { success: false, message: "Error creating order", data: null }
    }
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error updating order status:", error)
      return { success: false, message: "Error updating order status", data: null }
    }
  },

  // Tables
  getTables: async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/tables`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error fetching tables:", error)
      return { success: false, message: "Error retrieving tables", data: null }
    }
  },

  updateTableStatus: async (tableId: number, status: string) => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/tables/${tableId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error updating table status:", error)
      return { success: false, message: "Error updating table status", data: null }
    }
  },

  // Menu Items
  getMenuItems: async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/menu-items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error fetching menu items:", error)
      return { success: false, message: "Error retrieving menu items", data: null }
    }
  },

  // Reservations
  getReservations: async () => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/reservations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      return { success: false, message: "Error retrieving reservations", data: null }
    }
  },

  createReservation: async (reservationData: any) => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error creating reservation:", error)
      return { success: false, message: "Error creating reservation", data: null }
    }
  },

  updateReservation: async (reservationId: number, reservationData: any) => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error updating reservation:", error)
      return { success: false, message: "Error updating reservation", data: null }
    }
  },

  deleteReservation: async (reservationId: number) => {
    try {
      const token = getToken()

      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return handleResponse(response)
    } catch (error) {
      console.error("Error deleting reservation:", error)
      return { success: false, message: "Error deleting reservation", data: null }
    }
  },
}

export default apiService
