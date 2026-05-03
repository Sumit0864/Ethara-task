import { create } from 'zustand'
import api from '../api/client'

const useAuthStore = create((set) => ({
  user: (() => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch {
      return null
    }
  })(),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  signup: async (email, password, fullName) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/signup', {
        email,
        password,
        full_name: fullName,
      })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return data
    } catch (err) {
      let msg = 'Signup failed'
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail)
      } else if (err.message) {
        msg = err.message
      }
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.access_token, loading: false })
      return data
    } catch (err) {
      let msg = 'Login failed'
      if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail)
      } else if (err.message) {
        msg = err.message
      }
      set({ error: msg, loading: false })
      throw new Error(msg)
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
