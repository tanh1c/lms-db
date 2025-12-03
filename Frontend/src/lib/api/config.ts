// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Debug: Log để kiểm tra environment variable
if (import.meta.env.DEV) {
  console.log('🔍 API_BASE_URL:', API_BASE_URL)
  console.log('🔍 VITE_API_BASE_URL env:', import.meta.env.VITE_API_BASE_URL)
}

export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for database queries
  headers: {
    'Content-Type': 'application/json',
  },
}







