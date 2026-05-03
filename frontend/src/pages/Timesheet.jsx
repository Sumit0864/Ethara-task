import { useEffect, useState } from 'react'
import { Clock, Plus, X, Trash2, Calendar } from 'lucide-react'
import useTimeStore from '../store/timeStore'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

/* ── Log Time Modal ──────────────────────────────── */
function LogTimeModal({ onClose, onSaved, tasks }) {
  const [form, setForm] = useState({
    task_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const { logTime } = useTimeStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.task_id) return toast.error('Select a task')
    if (!form.hours || parseFloat(form.hours) <= 0) return toast.error('Enter valid hours')
    setLoading(true)
    try {
      await logTime(form.task_id, {
        date: form.date,
        hours: parseFloat(form.hours),
        description: form.description.trim() || null,
      })
      toast.success('Time logged')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to log time')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-sm">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Log Time</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Record work hours for a task.</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Task *</label>
            <select className="input" value={form.task_id} onChange={(e) => setForm({ ...form, task_id: e.target.value })} required>
              <option value="">Select a task...</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="label">Hours *</label>
              <input type="number" step="0.25" min="0.25" max="24" className="input" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="e.g. 2.5" required />
            </div>
          </div>
          <div>
            <label className="label">What did you work on?</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : 'Log time'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Timesheet Page ──────────────────────────────── */
export default function Timesheet() {
  const { user } = useAuthStore()
  const { records, fetchMyRecords, deleteRecord } = useTimeStore()
  const [showLog, setShowLog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [dateRange, setDateRange] = useState('week')

  const loadData = async () => {
    setLoading(true)
    const now = new Date()
    let start, end
    if (dateRange === 'week') {
      start = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
      end = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    } else if (dateRange === 'month') {
      start = format(startOfMonth(now), 'yyyy-MM-dd')
      end = format(endOfMonth(now), 'yyyy-MM-dd')
    } else {
      start = null
      end = null
    }
    await fetchMyRecords(start, end)

    // Fetch my assigned tasks for the log modal
    try {
      const api = (await import('../api/client')).default
      const { data } = await api.get('/api/dashboard/stats')
      // Use my_tasks from dashboard (tasks assigned to me)
      setTasks(data.my_tasks || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [dateRange])

  const totalHours = records.reduce((sum, r) => sum + r.hours, 0)

  // Group records by date
  const grouped = {}
  records.forEach((r) => {
    const day = r.date
    if (!grouped[day]) grouped[day] = []
    grouped[day].push(r)
  })
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">My Timesheet</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Track your work hours across tasks.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowLog(true)}>
          <Plus size={15} /> Log time
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Total Hours</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="card">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Entries</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{records.length}</p>
        </div>
        <div className="card col-span-2 sm:col-span-1">
          <p className="text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>Period</p>
          <div className="flex gap-1">
            {['week', 'month', 'all'].map((p) => (
              <button
                key={p}
                onClick={() => setDateRange(p)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: dateRange === p ? 'var(--bg-hover)' : 'transparent',
                  color: dateRange === p ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  border: dateRange === p ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timesheet entries */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-primary)' }} />
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-16">
          <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>No time recorded yet.</p>
          <button className="btn-primary" onClick={() => setShowLog(true)}>
            <Plus size={15} /> Log your first entry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((day) => {
            const dayRecords = grouped[day]
            const dayTotal = dayRecords.reduce((s, r) => s + r.hours, 0)
            return (
              <div key={day}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
                    <h3 className="text-sm font-semibold text-text-primary">
                      {format(new Date(day + 'T00:00:00'), 'EEEE, MMMM d')}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{dayTotal.toFixed(1)}h</span>
                </div>
                <div className="card p-0 overflow-hidden">
                  {dayRecords.map((r, idx) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors"
                      style={{ borderBottom: idx < dayRecords.length - 1 ? '1px solid var(--border)' : 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{r.task_title || 'Task'}</p>
                        {r.description && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>{r.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-sm font-mono font-semibold text-text-primary">{r.hours}h</span>
                        <button
                          className="btn-icon"
                          onClick={async () => {
                            try {
                              await deleteRecord(r.id)
                              toast.success('Entry deleted')
                              loadData()
                            } catch { toast.error('Failed to delete') }
                          }}
                        >
                          <Trash2 size={13} style={{ color: '#EF4444' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showLog && <LogTimeModal onClose={() => setShowLog(false)} onSaved={loadData} tasks={tasks} />}
    </div>
  )
}
