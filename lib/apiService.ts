import axios from "axios";

const apiUrl = "https://f3cc-154-121-116-30.ngrok-free.app/api/"; // Replace with your API URL

const api = axios.create({
  baseURL: apiUrl
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;