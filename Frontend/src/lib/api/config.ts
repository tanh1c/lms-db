// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 3000, // Reduced timeout for faster fallback to mock data
  headers: {
    'Content-Type': 'application/json',
  },
}







