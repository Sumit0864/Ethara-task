import { useEffect, useState } from 'react'
import { Users, Shield, Plus, X, Trash2, Building2 } from 'lucide-react'
import useTeamStore from '../store/teamStore'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

/* ── Create Team Modal ──────────────────────────────── */
function CreateTeamModal({ onClose, onCreated, allUsers }) {
  const [form, setForm] = useState({ name: '', description: '', lead_id: '' })
  const [loading, setLoading] = useState(false)
  const { createTeam } = useTeamStore()

  const leads = allUsers.filter((u) => u.role === 'team_lead' || u.role === 'superadmin')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Team name is required')
    setLoading(true)
    try {
      await createTeam({
        name: form.name.trim(),
        description: form.description.trim() || null,
        lead_id: form.lead_id || null,
      })
      toast.success('Team created')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold text-text-primary">New Team</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Create a team and assign a lead.</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Team name *</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engineering" autoFocus required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this team do?" />
          </div>
          <div>
            <label className="label">Team Lead</label>
            <select className="input" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>
              <option value="">Select a lead...</option>
              {leads.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating…' : 'Create team'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Create User Modal ──────────────────────────────── */
function CreateUserModal({ onClose, onCreated, teams }) {
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: 'tasker', team_id: '' })
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
        role: form.role,
        team_id: form.team_id || null,
      })
      toast.success('User created')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-base font-semibold text-text-primary">New User</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Create a new user account.</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Full name *</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@example.com" required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" required minLength={8} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="tasker">Tasker</option>
                <option value="team_lead">Team Lead</option>
              </select>
            </div>
            <div>
              <label className="label">Team</label>
              <select className="input" value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })}>
                <option value="">No team</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Creating…' : 'Create user'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Admin Page ──────────────────────────────── */
export default function Admin() {
  const { user } = useAuthStore()
  const { teams, members, fetchTeams, fetchUsers, deleteTeam, deleteUser } = useTeamStore()
  const [tab, setTab] = useState('teams')
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    await Promise.all([fetchTeams(), fetchUsers()])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  if (user?.role !== 'superadmin') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Shield size={48} className="mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
        <h1 className="text-xl font-semibold text-text-primary">Access Denied</h1>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Only superadmins can access this page.</p>
      </div>
    )
  }

  const ROLE_LABELS = { superadmin: 'Super Admin', team_lead: 'Team Lead', tasker: 'Tasker' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Admin Panel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage teams, users, and organization settings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'teams', label: 'Teams', icon: Building2 },
          { key: 'users', label: 'Users', icon: Users },
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
      ) : tab === 'teams' ? (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setShowCreateTeam(true)}>
              <Plus size={15} /> New team
            </button>
          </div>
          {teams.length === 0 ? (
            <div className="card text-center py-16">
              <Building2 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No teams yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="card card-hover relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                        <Building2 size={17} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary text-sm">{team.name}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{team.member_count || team.members?.length || 0} members</p>
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      onClick={async () => {
                        if (confirm('Delete this team?')) {
                          try {
                            await deleteTeam(team.id)
                            toast.success('Team deleted')
                          } catch { toast.error('Failed to delete') }
                        }
                      }}
                    >
                      <Trash2 size={14} style={{ color: '#EF4444' }} />
                    </button>
                  </div>
                  {team.description && (
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-tertiary)' }}>{team.description}</p>
                  )}
                  <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Lead: <span className="text-text-primary font-medium">{team.lead?.full_name || 'Unassigned'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <button className="btn-primary" onClick={() => setShowCreateUser(true)}>
              <Plus size={15} /> New user
            </button>
          </div>
          {members.length === 0 ? (
            <div className="card text-center py-16">
              <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No users found.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Name</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Email</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Role</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((u) => (
                    <tr key={u.id} className="transition-colors" style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="avatar avatar-sm">{u.full_name[0].toUpperCase()}</div>
                          <span className="font-medium text-text-primary">{u.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                          style={{
                            background: u.role === 'superadmin' ? 'rgba(239,68,68,0.1)' : u.role === 'team_lead' ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
                            color: u.role === 'superadmin' ? '#EF4444' : u.role === 'team_lead' ? '#3B82F6' : 'var(--text-secondary)',
                          }}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.role !== 'superadmin' && (
                          <button
                            className="btn-icon"
                            onClick={async () => {
                              if (confirm(`Delete ${u.full_name}?`)) {
                                try {
                                  await deleteUser(u.id)
                                  toast.success('User deleted')
                                } catch { toast.error('Failed to delete') }
                              }
                            }}
                          >
                            <Trash2 size={14} style={{ color: '#EF4444' }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreateTeam && <CreateTeamModal onClose={() => setShowCreateTeam(false)} onCreated={reload} allUsers={members} />}
      {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} onCreated={reload} teams={teams} />}
    </div>
  )
}
