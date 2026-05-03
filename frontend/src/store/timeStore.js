import { create } from 'zustand'
import api from '../api/client'

const useTimeStore = create((set) => ({
  records: [],
  teamRecords: [],
  loading: false,

  // Log time against a task
  logTime: async (taskId, payload) => {
    const { data } = await api.post(`/api/tasks/${taskId}/time-records`, payload)
    set((s) => ({ records: [data, ...s.records] }))
    return data
  },

  // Fetch time records for a specific task
  fetchTaskRecords: async (taskId) => {
    const { data } = await api.get(`/api/tasks/${taskId}/time-records`)
    set({ records: data })
    return data
  },

  // Fetch my personal time records (with optional date range)
  fetchMyRecords: async (startDate, endDate) => {
    const params = {}
    if (startDate) params.start_date = startDate
    if (endDate) params.end_date = endDate
    const { data } = await api.get('/api/my/time-records', { params })
    set({ records: data })
    return data
  },

  // Team lead / superadmin: fetch team time records
  fetchTeamRecords: async (params = {}) => {
    const { data } = await api.get('/api/team/time-records', { params })
    set({ teamRecords: data })
    return data
  },

  // Update a time record
  updateRecord: async (recordId, payload) => {
    const { data } = await api.patch(`/api/time-records/${recordId}`, payload)
    set((s) => ({
      records: s.records.map((r) => (r.id === recordId ? { ...r, ...data } : r)),
    }))
    return data
  },

  // Delete a time record
  deleteRecord: async (recordId) => {
    await api.delete(`/api/time-records/${recordId}`)
    set((s) => ({
      records: s.records.filter((r) => r.id !== recordId),
    }))
  },
}))

export default useTimeStore
