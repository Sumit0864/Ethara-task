import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, AlertCircle, ListTodo, TrendingUp, ArrowUpRight, Activity, Users, Building2 } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/client'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import { format, isAfter, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'

const CHART_COLORS = ['#52525B', '#A1A1AA', '#FFFFFF']

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs font-medium"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.4)',
      }}
    >
      {payload[0].name}: {payload[0].value}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    api.get('/api/dashboard/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--text-primary)' }}
        />
      </div>
    )
  }

  const chartData = [
    { name: 'Todo', value: stats.todo },
    { name: 'In Progress', value: stats.in_progress },
    { name: 'Done', value: stats.done },
  ].filter(d => d.value > 0)

  const completion = stats.total_tasks > 0 ? Math.round((stats.done / stats.total_tasks) * 100) : 0

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats.total_tasks,
      icon: CheckSquare,
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: TrendingUp,
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      danger: true,
    },
    {
      label: 'Completed',
      value: stats.done,
      icon: Clock,
    },
  ]

  // Extra cards for superadmin/team_lead
  const orgCards = []
  if (user?.role === 'superadmin' || user?.role === 'team_lead') {
    orgCards.push({
      label: user?.role === 'superadmin' ? 'Total Users' : 'Team Members',
      value: stats.total_users || 0,
      icon: Users,
    })
    if (user?.role === 'superadmin') {
      orgCards.push({
        label: 'Teams',
        value: stats.total_teams || 0,
        icon: Building2,
      })
    }
    orgCards.push({
      label: 'Hours Logged',
      value: (stats.total_hours_logged || 0).toFixed(1) + 'h',
      icon: Clock,
    })
  }

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const ROLE_LABELS = { superadmin: 'Super Admin', team_lead: 'Team Lead', tasker: 'Tasker' }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: user?.role === 'superadmin' ? 'rgba(239,68,68,0.1)' : user?.role === 'team_lead' ? 'rgba(59,130,246,0.1)' : 'var(--bg-elevated)',
                  color: user?.role === 'superadmin' ? '#EF4444' : user?.role === 'team_lead' ? '#3B82F6' : 'var(--text-secondary)',
                }}
              >
                {ROLE_LABELS[user?.role]}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {greeting}, {user?.full_name?.split(' ')[0] || 'there'}{' '}
              <span className="inline-block animate-fade-in">👋</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm" style={{ color: 'var(--text-secondary)' }}>
              {stats.overdue > 0
                ? `${stats.overdue} task${stats.overdue > 1 ? 's are' : ' is'} overdue — let's catch up.`
                : 'Everything looks on track. Keep shipping.'}
            </p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'superadmin' && (
              <Link to="/admin" className="btn-secondary">
                Admin Panel <ArrowUpRight size={15} />
              </Link>
            )}
            {user?.role === 'team_lead' && (
              <Link to="/team" className="btn-secondary">
                My Team <ArrowUpRight size={15} />
              </Link>
            )}
            <Link to="/projects" className="btn-primary">
              View projects <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, danger }) => (
          <div key={label} className="card card-hover relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div
                className="rounded-lg p-2"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <Icon size={18} style={{ color: danger ? '#EF4444' : 'var(--text-secondary)' }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Org Stats for superadmin / team_lead */}
      {orgCards.length > 0 && (
        <div className={`grid grid-cols-${orgCards.length} gap-4 mb-8`}>
          {orgCards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="card card-hover">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2" style={{ background: 'var(--bg-elevated)' }}>
                  <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
                </div>
                <div>
                  <p className="text-xl font-bold text-text-primary">{value}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Overview for superadmin */}
      {user?.role === 'superadmin' && stats.teams && stats.teams.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Teams Overview</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.teams.map((t) => (
              <div key={t.team_id} className="card card-hover">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-elevated)' }}>
                    <Building2 size={15} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{t.team_name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t.member_count} members</p>
                  </div>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Lead: <span className="text-text-primary">{t.lead_name || 'Unassigned'}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Status breakdown</h2>
            <Activity size={15} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Distribution of tasks</p>
          {chartData.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-2xl font-bold text-text-primary">{completion}%</p>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Completed</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              No tasks yet
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[
              { label: 'Todo', val: stats.todo, color: '#52525B' },
              { label: 'Active', val: stats.in_progress, color: '#A1A1AA' },
              { label: 'Done', val: stats.done, color: '#FFFFFF' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg py-2.5"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </div>
                <p className="text-base font-bold text-text-primary mt-0.5">{s.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* My Tasks */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                {user?.role === 'superadmin' ? 'All pending tasks' : 'My active tasks'}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {user?.role === 'superadmin' ? 'Latest unfinished tasks across all projects' : 'Items assigned to you'}
              </p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-medium flex items-center gap-1 transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              All projects <ArrowUpRight size={13} />
            </Link>
          </div>
          {stats.my_tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14" style={{ color: 'var(--text-tertiary)' }}>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <ListTodo size={22} />
              </div>
              <p className="text-sm">No tasks assigned to you</p>
            </div>
          ) : (
            <ul>
              {stats.my_tasks.map((task, idx) => {
                const isOverdue = task.due_date && !isAfter(parseISO(task.due_date), new Date()) && task.status !== 'done'
                return (
                  <li
                    key={task.id}
                    className="flex items-start justify-between gap-3 py-3 group transition-colors"
                    style={{
                      borderBottom: idx < stats.my_tasks.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 transition-transform group-hover:scale-150"
                        style={{ background: 'var(--text-secondary)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs mt-0.5" style={{ color: isOverdue ? '#EF4444' : 'var(--text-tertiary)' }}>
                            {isOverdue ? 'Overdue · ' : 'Due '}
                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
