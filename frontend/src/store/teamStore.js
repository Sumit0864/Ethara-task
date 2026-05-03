import { create } from 'zustand'
import api from '../api/client'

const useTeamStore = create((set, get) => ({
  teams: [],
  currentTeam: null,
  members: [],
  loading: false,

  fetchTeams: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/api/teams')
      set({ teams: data, loading: false })
      return data
    } catch {
      set({ loading: false })
      return []
    }
  },

  fetchTeam: async (teamId) => {
    try {
      const { data } = await api.get(`/api/teams/${teamId}`)
      set({ currentTeam: data })
      return data
    } catch {
      return null
    }
  },

  createTeam: async (payload) => {
    const { data } = await api.post('/api/teams', payload)
    set((s) => ({ teams: [data, ...s.teams] }))
    return data
  },

  updateTeam: async (teamId, payload) => {
    const { data } = await api.patch(`/api/teams/${teamId}`, payload)
    set((s) => ({ teams: s.teams.map((t) => (t.id === teamId ? data : t)) }))
    return data
  },

  deleteTeam: async (teamId) => {
    await api.delete(`/api/teams/${teamId}`)
    set((s) => ({ teams: s.teams.filter((t) => t.id !== teamId) }))
  },

  // User management
  fetchUsers: async (params = {}) => {
    const { data } = await api.get('/api/users', { params })
    set({ members: data })
    return data
  },

  createUser: async (payload) => {
    const { data } = await api.post('/api/users', payload)
    set((s) => ({ members: [...s.members, data] }))
    return data
  },

  deleteUser: async (userId) => {
    await api.delete(`/api/users/${userId}`)
    set((s) => ({ members: s.members.filter((m) => m.id !== userId) }))
  },
}))

export default useTeamStore
