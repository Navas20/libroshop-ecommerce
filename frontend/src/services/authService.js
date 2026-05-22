import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const authService = {
  register: async (nombre, email, password) => {
    const res = await axios.post(`${API_URL}/auth/register`, { nombre, email, password }, { withCredentials: true })
    return res.data
  },
  login: async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password }, { withCredentials: true })
    return res.data
  },
  refresh: async () => {
    const res = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
    return res.data
  },
  logout: async () => {
    await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true })
  },
  getMe: async () => {
    const res = await axios.get(`${API_URL}/auth/me`, { withCredentials: true })
    return res.data
  },
  verifyEmail: async (token) => {
    const res = await axios.post(`${API_URL}/auth/verify-email`, { token })
    return res.data
  },
  forgotPassword: async (email) => {
    const res = await axios.post(`${API_URL}/auth/forgot-password`, { email })
    return res.data
  },
  resetPassword: async (token, password) => {
    const res = await axios.post(`${API_URL}/auth/reset-password`, { token, password })
    return res.data
  }
}

export default authService
