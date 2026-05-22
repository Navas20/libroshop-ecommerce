import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.data)
      } catch {
        try {
          const refreshRes = await api.post('/auth/refresh')
          const newToken = refreshRes.data.data.accessToken
          localStorage.setItem('accessToken', newToken)
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
          const meRes = await api.get('/auth/me')
          setUser(meRes.data.data)
        } catch {
          localStorage.removeItem('accessToken')
          delete api.defaults.headers.common['Authorization']
          setUser(null)
        }
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchUser() }, [fetchUser])

  const login = async (email, password) => {
    setError(null)
    const res = await api.post('/auth/login', { email, password })
    const { accessToken, user: userData } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUser(userData)
    return userData
  }

  const register = async (nombre, email, password) => {
    setError(null)
    const res = await api.post('/auth/register', { nombre, email, password })
    const { accessToken, user: userData } = res.data.data
    localStorage.setItem('accessToken', accessToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUser(userData)
    return userData
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
