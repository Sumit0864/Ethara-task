import { useEffect, useState } from 'react'
import { Users, Plus, X, Trash2, Clock, UserPlus } from 'lucide-react'
import useTeamStore from '../store/teamStore'
import useTimeStore from '../store/timeStore'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

/* ── Create Tasker Modal ──────────────────────────────── */
function CreateTaskerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ email: '', password: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const { createUser } = useTeamStore()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createUser({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim(),
        role: 'tasker',
      })
      toast.success('Tasker account created')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create tasker')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-sm">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Add Tasker</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Create a new employee account in your team.</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full name *</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Smith" required autoFocus />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required minLength={8} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating…' : 'Add tasker'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Team Management Page ──────────────────────────────── */
export default function TeamManagement() {
  const { user } = useAuthStore()
  const { teams, members, fetchTeams, fetchUsers, deleteUser } = useTeamStore()
  const { teamRecords, fetchTeamRecords } = useTimeStore()
  const [showCreate, setShowCreate] = useState(false)
  const [tab, setTab] = useState('members')
  const [loading, setLoading] = useState(true)

  const myTeam = teams.find((t) => t.lead_id === user?.id) || teams[0]

  const reload = async () => {
    setLoading(true)
    await Promise.all([fetchTeams(), fetchUsers(), fetchTeamRecords()])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  if (user?.role !== 'team_lead' && user?.role !== 'superadmin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Only team leads can access this page.</p>
      </div>
    )
  }

  const teamMembers = members.filter((m) => m.id !== user?.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            {myTeam ? myTeam.name : 'My Team'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your team members and track their progress.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <UserPlus size={15} /> Add tasker
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'members', label: 'Members', icon: Users },
          { key: 'timesheet', label: 'Team Timesheet', icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={{
              color: tab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderBottom: tab === key ? '2px solid var(--text-primary)' : '2px solid transparent',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-primary)' }} />
        </div>
      ) : tab === 'members' ? (
        <div>
          {teamMembers.length === 0 ? (
            <div className="card text-center py-16">
              <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>No team members yet.</p>
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Add your first tasker
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="card card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-lg">{member.full_name[0].toUpperCase()}</div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-sm">{member.full_name}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.email}</p>
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={async () => {
                        if (confirm(`Remove ${member.full_name} from the team?`)) {
                          try {
                            await deleteUser(member.id)
                            toast.success('Member removed')
                            reload()
                          } catch { toast.error('Failed to remove') }
                        }
                      }}
                    >
                      <Trash2 size={14} style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    >
                      Tasker
                    </span>
                    <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>
                      Since {format(new Date(member.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Team Timesheet Tab */
        <div>
          {teamRecords.length === 0 ? (
            <div className="card text-center py-16">
              <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No time records logged by team members yet.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Member</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Task</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Date</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRecords.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="avatar avatar-sm">{r.user?.full_name?.[0]?.toUpperCase() || '?'}</div>
                          <span className="text-text-primary font-medium">{r.user?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{r.task_title || '—'}</td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-tertiary)' }}>{format(new Date(r.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-text-primary">{r.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreate && <CreateTaskerModal onClose={() => setShowCreate(false)} onCreated={reload} />}
    </div>
  )
}
