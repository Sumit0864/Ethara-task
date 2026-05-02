import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Clock, AlertCircle, ListTodo, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../api/client'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'
import { format, isAfter, parseISO } from 'date-fns'
import useAuthStore from '../store/authStore'

const CHART_COLORS = ['#5C5C72', '#5B5BD6', '#30A46C']

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
          style={{ borderColor: 'var(--border)', borderTopColor: '#5B5BD6' }}
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
      color: '#5B5BD6',
      bg: 'rgba(91, 91, 214, 0.1)',
    },
    {
      label: 'In Progress',
      value: stats.in_progress,
      icon: TrendingUp,
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
    {
      label: 'Overdue',
      value: stats.overdue,
      icon: AlertCircle,
      color: '#E5484D',
      bg: 'rgba(229, 72, 77, 0.1)',
    },
    {
      label: 'Completed',
      value: stats.done,
      icon: Clock,
      color: '#30A46C',
      bg: 'rgba(48, 164, 108, 0.1)',
    },
  ]

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(91,91,214,0.12) 0%, rgba(16,16,31,0.8) 100%)',
          border: '1px solid rgba(91,91,214,0.15)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px]"
          style={{ background: 'rgba(91,91,214,0.2)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(91,91,214,1) 1px, transparent 1px), linear-gradient(90deg, rgba(91,91,214,1) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
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
          <Link
            to="/projects"
            className="btn-primary"
          >
            View projects <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card card-hover relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div
                className="rounded-lg p-2"
                style={{ background: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-text-primary tracking-tight">{value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Status breakdown</h2>
            <Activity size={15} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>Distribution of your tasks</p>
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
              { label: 'Todo', val: stats.todo, color: '#5C5C72' },
              { label: 'Active', val: stats.in_progress, color: '#5B5BD6' },
              { label: 'Done', val: stats.done, color: '#30A46C' },
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
              <h2 className="text-sm font-semibold text-text-primary">My active tasks</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Items assigned to you</p>
            </div>
            <Link
              to="/projects"
              className="text-xs font-medium flex items-center gap-1 transition-colors"
              style={{ color: '#8B8BF5' }}
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
                        style={{ background: '#5B5BD6' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs mt-0.5" style={{ color: isOverdue ? '#E5484D' : 'var(--text-tertiary)' }}>
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
