import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const orderService = {
  createOrder: async (shippingData) => {
    const res = await axios.post(`${API_URL}/orders`, shippingData, { withCredentials: true })
    return res.data
  },
  getOrders: async (page = 1, limit = 10) => {
    const res = await axios.get(`${API_URL}/orders`, { params: { page, limit }, withCredentials: true })
    return res.data
  },
  getOrderById: async (id) => {
    const res = await axios.get(`${API_URL}/orders/${id}`, { withCredentials: true })
    return res.data
  },
  createPayment: async (orderId) => {
    const res = await axios.post(`${API_URL}/payment/create`, { order_id: orderId }, { withCredentials: true })
    return res.data
  },
  getPaymentStatus: async (reference) => {
    const res = await axios.get(`${API_URL}/payment/status/${reference}`, { withCredentials: true })
    return res.data
  }
}

export default orderService
