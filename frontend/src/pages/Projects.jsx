import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, X, Search, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import api from '../api/client'
import toast from 'react-hot-toast'

const ACCENTS = [
  'var(--accent)', '#3B82F6', '#30A46C', '#E5484D',
  '#F5A623', '#8B5CF6', '#06B6D4', '#EC4899',
]

function accentFor(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return ACCENTS[h % ACCENTS.length]
}

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Project name is required')
    setLoading(true)
    try {
      await api.post('/api/projects', { name: form.name.trim(), description: form.description.trim() || null })
      toast.success('Project created')
      onCreated()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-base font-semibold text-text-primary">New Project</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
              Spin up a fresh space for your team's work.
            </p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label">Project name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Q4 Marketing Launch"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this project about?"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [query, setQuery] = useState('')

  const fetchProjects = () => {
    api.get('/api/projects')
      .then(({ data }) => setProjects(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q),
    )
  }, [projects, query])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Projects</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Organize, plan, and ship your team's work.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects…"
              className="input pl-9 w-56"
            />
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            New project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : projects.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <Sparkles size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="text-base font-semibold text-text-primary mb-1">Start your first project</h3>
          <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            Create a project to organize tasks, invite teammates, and track progress.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create project
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p style={{ color: 'var(--text-secondary)' }}>
            No projects match "<span className="font-medium text-text-primary">{query}</span>"
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const accent = accentFor(project.name + project.id)
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group card card-hover relative overflow-hidden p-0"
              >
                {/* Top accent bar */}
                <div
                  className="h-1 w-full"
                  style={{ background: accent }}
                />
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${accent}18` }}
                    >
                      <FolderOpen size={17} style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary group-hover:text-accent-hover transition-colors truncate">
                        {project.name}
                      </h3>
                      {project.description ? (
                        <p className="text-xs line-clamp-2 mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          {project.description}
                        </p>
                      ) : (
                        <p className="text-xs italic mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                          No description
                        </p>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 pt-3"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div className="avatar avatar-sm">{project.owner.full_name[0].toUpperCase()}</div>
                    <span className="text-xs font-medium text-text-secondary">{project.owner.full_name}</span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--text-tertiary)' }}>
                      {format(new Date(project.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={fetchProjects} />
      )}
    </div>
  )
}
