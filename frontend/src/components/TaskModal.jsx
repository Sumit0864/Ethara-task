import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function TaskModal({ projectId, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee_ids: task?.assignees?.map((a) => a.id) || [],
    due_date: task?.due_date || '',
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/auth/users').then(({ data }) => setUsers(data)).catch(() => {})
  }, [])

  const toggleAssignee = (userId) => {
    setForm((prev) => ({
      ...prev,
      assignee_ids: prev.assignee_ids.includes(userId)
        ? prev.assignee_ids.filter((id) => id !== userId)
        : [...prev.assignee_ids, userId],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        assignee_ids: form.assignee_ids,
        due_date: form.due_date || null,
      }
      if (task) {
        await api.patch(`/api/tasks/${task.id}`, payload)
        toast.success('Task updated')
      } else {
        await api.post(`/api/projects/${projectId}/tasks`, payload)
        toast.success('Task created')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-base font-semibold text-text-primary">
              {task ? 'Edit task' : 'New task'}
            </h2>
            <p className="text-xs text-text-tertiary mt-0.5">
              {task ? 'Update the task details below.' : 'Add a new task to this project.'}
            </p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add more details…"
            />
          </div>

          {/* Status & Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <label className="label">
              Assignees
              {form.assignee_ids.length > 0 && (
                <span className="ml-1.5 font-normal" style={{ color: 'var(--text-primary)' }}>
                  ({form.assignee_ids.length} selected)
                </span>
              )}
            </label>
            <div
              className="rounded-lg max-h-44 overflow-y-auto"
              style={{ border: '1px solid var(--border)' }}
            >
              {users.length === 0 && (
                <p className="text-sm p-3 text-text-tertiary">Loading users…</p>
              )}
              {users.map((u) => {
                const selected = form.assignee_ids.includes(u.id)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignee(u.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100"
                    style={{
                      background: selected ? 'var(--bg-elevated)' : 'transparent',
                      borderBottom: '1px solid var(--border)',
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.background = 'var(--bg-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = selected ? 'var(--bg-elevated)' : 'transparent'
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        background: selected ? 'var(--accent)' : 'transparent',
                        border: selected ? '1px solid var(--accent)' : '1px solid var(--border-strong)',
                      }}
                    >
                      {selected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="avatar avatar-sm">{u.full_name[0].toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{u.full_name}</p>
                      <p className="text-xs text-text-tertiary truncate">{u.email}</p>
                    </div>
                  </button>
                )
              })}
            </div>
            {form.assignee_ids.length > 0 && (
              <button
                type="button"
                className="text-xs mt-1.5 transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onClick={() => setForm({ ...form, assignee_ids: [] })}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="label">Due Date</label>
            <input
              type="date"
              className="input"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Saving…' : task ? 'Update task' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
