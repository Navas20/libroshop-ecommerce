import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCart = useCallback(async () => {
    if (!user) { setItems([]); return }
    setLoading(true)
    try {
      const res = await api.get('/cart')
      setItems(res.data.data.items || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar carrito')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addItem = async (book, quantity = 1) => {
    if (!user) { window.location.href = '/login'; return }
    const payload = {
      book_key: book.key,
      book_title: book.title,
      book_author: Array.isArray(book.author_name) ? book.author_name[0] : (book.author || 'Autor desconocido'),
      book_cover: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      price: book.price?.final || book.price || 0,
      quantity
    }
    try {
      await api.post('/cart', payload)
      await fetchCart()
    } catch (err) {
      throw err.response?.data?.error || 'Error al agregar al carrito'
    }
  }

  const updateQuantity = async (id, quantity) => {
    try {
      await api.put(`/cart/${id}`, { quantity })
      await fetchCart()
    } catch (err) {
      throw err.response?.data?.error || 'Error al actualizar cantidad'
    }
  }

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`)
      await fetchCart()
    } catch (err) {
      throw err.response?.data?.error || 'Error al eliminar item'
    }
  }

  const clearCart = async () => {
    try {
      await api.delete('/cart')
      setItems([])
    } catch (err) {
      throw err.response?.data?.error || 'Error al vaciar carrito'
    }
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0)
  const descuento = Math.round(subtotal * 0.2)
  const total = subtotal - descuento

  return (
    <CartContext.Provider value={{
      items, loading, error, itemCount, subtotal, descuento, total,
      addItem, updateQuantity, removeItem, clearCart, refreshCart: fetchCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
