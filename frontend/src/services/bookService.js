import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const bookService = {
  search: async (query, page = 1, limit = 20) => {
    const res = await axios.get(`${API_URL}/books/search`, { params: { q: query, page, limit } })
    return res.data
  },
  getFeatured: async () => {
    const res = await axios.get(`${API_URL}/books/featured`)
    return res.data
  },
  getByKey: async (key) => {
    const res = await axios.get(`${API_URL}/books/${key}`)
    return res.data
  }
}

export default bookService
