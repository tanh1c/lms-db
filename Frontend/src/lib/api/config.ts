// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for database queries
  headers: {
    'Content-Type': 'application/json',
  },
}







