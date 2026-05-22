import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const cartService = {
  getCart: async () => {
    const res = await axios.get(`${API_URL}/cart`, { withCredentials: true })
    return res.data
  },
  addItem: async (item) => {
    const res = await axios.post(`${API_URL}/cart`, item, { withCredentials: true })
    return res.data
  },
  updateQuantity: async (id, quantity) => {
    const res = await axios.put(`${API_URL}/cart/${id}`, { quantity }, { withCredentials: true })
    return res.data
  },
  removeItem: async (id) => {
    const res = await axios.delete(`${API_URL}/cart/${id}`, { withCredentials: true })
    return res.data
  },
  clearCart: async () => {
    const res = await axios.delete(`${API_URL}/cart`, { withCredentials: true })
    return res.data
  }
}

export default cartService
