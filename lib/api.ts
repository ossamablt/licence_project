// lib/api.ts
import axios from "axios"

// Set the base URL for your API
const api = axios.create({
  baseURL: "https://9dzylepiiu.sharedwithexpose.com/api", // Update with the correct URL
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Set to true if cookies are required
})

// Intercept requests to add Authorization header if a token exists

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") // Assuming your token is stored in localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
