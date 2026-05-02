import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Plus, Trash2, UserMinus, Users, CheckSquare, ArrowLeft, Edit2,
  GripVertical, Calendar, AlertCircle, Search, Filter,
} from 'lucide-react'
import { format, isAfter, parseISO } from 'date-fns'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import api from '../api/client'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import TaskModal from '../components/TaskModal'
import MemberModal from '../components/MemberModal'
import { StatusBadge, PriorityBadge } from '../components/StatusBadge'

const COLUMNS = [
  {
    key: 'todo',
    label: 'Todo',
    color: '#8B8B9E',
    icon: '○',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    color: '#5B5BD6',
    icon: '◐',
  },
  {
    key: 'done',
    label: 'Done',
    color: '#30A46C',
    icon: '●',
  },
]

function TaskCard({ task, index, isAdmin, currentUserId, onEdit, onDelete }) {
  const isOverdue = task.due_date && !isAfter(parseISO(task.due_date), new Date()) && task.status !== 'done'
  const isAssignee = task.assignees?.some((a) => a.id === currentUserId)
  const canEdit = isAdmin || task.created_by === currentUserId || isAssignee
  const canDelete = isAdmin || task.created_by === currentUserId

  return (
    <Draggable draggableId={String(task.id)} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card group ${snapshot.isDragging ? 'task-card-dragging' : ''}`}
          style={{
            ...provided.draggableProps.style,
            cursor: canEdit ? 'grab' : 'default',
          }}
        >
          {/* Top row: grip + title + actions */}
          <div className="flex items-start gap-2 mb-2">
            {canEdit && (
              <GripVertical
                size={14}
                className="mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-tertiary)' }}
              />
            )}
            <h4 className="font-medium text-sm leading-snug flex-1 text-text-primary">{task.title}</h4>
            <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(task) }}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#5B5BD6'
                    e.currentTarget.style.background = 'rgba(91,91,214,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Edit2 size={12} />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#E5484D'
                    e.currentTarget.style.background = 'rgba(229,72,77,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-tertiary)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs line-clamp-2 leading-relaxed mb-3" style={{ color: 'var(--text-tertiary)' }}>
              {task.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <PriorityBadge priority={task.priority} />
            {task.due_date && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md"
                style={{
                  background: isOverdue ? 'rgba(229,72,77,0.1)' : 'var(--bg-surface)',
                  color: isOverdue ? '#F87171' : 'var(--text-secondary)',
                  boxShadow: isOverdue
                    ? 'inset 0 0 0 1px rgba(229,72,77,0.2)'
                    : 'inset 0 0 0 1px var(--border)',
                }}
              >
                {isOverdue ? <AlertCircle size={11} /> : <Calendar size={11} />}
                {format(parseISO(task.due_date), 'MMM d')}
              </span>
            )}
          </div>

          {/* Assignees */}
          {task.assignees?.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    title={a.full_name}
                    className="avatar avatar-sm ring-2"
                    style={{ ringColor: 'var(--bg-elevated)' }}
                  >
                    {a.full_name[0].toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 4 && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ring-2"
                    style={{
                      background: 'var(--bg-hover)',
                      color: 'var(--text-secondary)',
                      ringColor: 'var(--bg-elevated)',
                    }}
                  >
                    +{task.assignees.length - 4}
                  </div>
                )}
              </div>
              <span className="text-[11px] truncate" style={{ color: 'var(--text-tertiary)' }}>
                {task.assignees.length === 1 ? task.assignees[0].full_name : `${task.assignees.length} assignees`}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [tab, setTab] = useState('tasks')
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const fetchProject = () =>
    api.get(`/api/projects/${id}`).then(({ data }) => setProject(data)).catch(() => navigate('/projects'))

  const fetchTasks = () =>
    api.get(`/api/projects/${id}/tasks`).then(({ data }) => setTasks(data))

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchProject(), fetchTasks()]).finally(() => setLoading(false))
  }, [id])

  const currentMember = project?.members?.find((m) => m.user_id === user?.id)
  const isAdmin = currentMember?.role === 'admin'

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/api/tasks/${taskId}`)
      toast.success('Task deleted')
      fetchTasks()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const persistStatus = async (taskId, status, prevTasks) => {
    try {
      await api.patch(`/api/tasks/${taskId}`, { status })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
      setTasks(prevTasks)
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/api/projects/${id}/members/${userId}`)
      toast.success('Member removed')
      fetchProject()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove')
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? This cannot be undone.')) return
    try {
      await api.delete(`/api/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
    }
  }

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const status = destination.droppableId
    const taskId = draggableId
    const task = tasks.find((t) => t.id === taskId)

    if (!task) return

    // Reorder/Move logic
    const prev = tasks
    const newTasks = Array.from(tasks)
    const taskIndex = newTasks.findIndex(t => t.id === taskId)
    newTasks[taskIndex] = { ...task, status }
    
    // We update local state immediately for snappy feel
    setTasks(newTasks)
    
    // Persist to backend
    try {
      await api.patch(`/api/tasks/${taskId}`, { status })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update status')
      setTasks(prev)
    }
  }

  const visibleTasks = tasks.filter((t) => {
    const q = search.trim().toLowerCase()
    if (q && !(t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const getColumnTasks = (status) => visibleTasks.filter((t) => t.status === status)

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

  if (!project) return null

  const totals = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }
  const completion = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-tertiary)')}
        >
          <ArrowLeft size={13} /> Back to projects
        </button>

        <div className="card relative overflow-hidden">
          {/* Subtle glow */}
          <div
            className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-[80px]"
            style={{ background: 'rgba(91,91,214,0.12)' }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-1 max-w-3xl text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {project.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="avatar avatar-sm">{project.owner.full_name[0].toUpperCase()}</div>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>Owner:</span> {project.owner.full_name}
                  </span>
                </div>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Members:</span> {project.members?.length || 0}
                </span>
                <span style={{ color: 'var(--text-tertiary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Tasks:</span> {totals.total}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-5 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                  <span className="font-semibold text-text-primary">{completion}%</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-active)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${completion}%`,
                      background: 'linear-gradient(90deg, #5B5BD6 0%, #6E6DE8 100%)',
                    }}
                  />
                </div>
              </div>
            </div>

            {isAdmin && (
              <button className="btn-danger" onClick={handleDeleteProject}>
                <Trash2 size={14} /> Delete project
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 mb-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {[
          { key: 'tasks', label: 'Tasks', icon: CheckSquare, count: totals.total },
          { key: 'members', label: 'Members', icon: Users, count: project.members?.length || 0 },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px transition-colors"
            style={{
              borderBottom: tab === key ? '2px solid #5B5BD6' : '2px solid transparent',
              color: tab === key ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            <Icon size={15} />
            {label}
            <span
              className="ml-0.5 text-[11px] px-1.5 py-0.5 rounded-full"
              style={{
                background: tab === key ? 'rgba(91,91,214,0.15)' : 'var(--bg-elevated)',
                color: tab === key ? '#8B8BF5' : 'var(--text-tertiary)',
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === 'tasks' && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  className="input pl-9 w-56"
                  placeholder="Search tasks…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="input-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <span className="text-[11px] ml-1 hidden sm:inline" style={{ color: 'var(--text-tertiary)' }}>
                Drag tasks between columns to change status
              </span>
            </div>
            <button
              className="btn-primary"
              onClick={() => { setEditTask(null); setShowTaskModal(true) }}
            >
              <Plus size={15} /> New task
            </button>
          </div>

          {/* Kanban board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid md:grid-cols-3 gap-4">
              {COLUMNS.map(({ key, label, color, icon }) => {
                const colTasks = getColumnTasks(key)
                return (
                  <Droppable droppableId={key} key={key}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`kanban-col ${snapshot.isDraggingOver ? 'kanban-col-drop' : ''}`}
                      >
                        {/* Column header */}
                        <div className="flex items-center justify-between mb-3 px-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm" style={{ color }}>{icon}</span>
                            <h3 className="text-[13px] font-semibold text-text-primary">{label}</h3>
                            <span
                              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                              style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
                            >
                              {colTasks.length}
                            </span>
                          </div>
                          {key === 'todo' && (
                            <button
                              onClick={() => { setEditTask(null); setShowTaskModal(true) }}
                              className="rounded-md p-1 transition-colors"
                              style={{ color: 'var(--text-tertiary)' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#5B5BD6'
                                e.currentTarget.style.background = 'rgba(91,91,214,0.1)'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--text-tertiary)'
                                e.currentTarget.style.background = 'transparent'
                              }}
                              title="Add task"
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </div>

                        {/* Task list */}
                        <div className="space-y-2 min-h-[150px]">
                          {colTasks.map((task, index) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              index={index}
                              isAdmin={isAdmin}
                              currentUserId={user?.id}
                              onEdit={(t) => { setEditTask(t); setShowTaskModal(true) }}
                              onDelete={handleDeleteTask}
                            />
                          ))}
                          {provided.placeholder}
                          {colTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div
                              className="flex flex-col items-center justify-center text-center py-8 rounded-lg"
                              style={{
                                border: '2px dashed var(--border)',
                                background: 'transparent',
                              }}
                            >
                              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                No tasks
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                )
              })}
            </div>
          </DragDropContext>
        </>
      )}

      {/* Members Tab */}
      {tab === 'members' && (
        <div>
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <button className="btn-primary" onClick={() => setShowMemberModal(true)}>
                <Plus size={15} /> Add member
              </button>
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th
                    className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)', background: 'var(--bg-elevated)' }}
                  >
                    Member
                  </th>
                  <th
                    className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)', background: 'var(--bg-elevated)' }}
                  >
                    Role
                  </th>
                  <th
                    className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)', background: 'var(--bg-elevated)' }}
                  >
                    Joined
                  </th>
                  {isAdmin && (
                    <th
                      className="px-6 py-3"
                      style={{ background: 'var(--bg-elevated)' }}
                    />
                  )}
                </tr>
              </thead>
              <tbody>
                {project.members?.map((member) => (
                  <tr
                    key={member.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-lg">{member.user.full_name[0].toUpperCase()}</div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{member.user.full_name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{member.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="pill"
                        style={
                          member.role === 'admin'
                            ? { background: 'rgba(91,91,214,0.12)', color: '#8B8BF5', boxShadow: 'inset 0 0 0 1px rgba(91,91,214,0.2)' }
                            : { background: 'var(--bg-elevated)', color: 'var(--text-secondary)', boxShadow: 'inset 0 0 0 1px var(--border)' }
                        }
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {format(new Date(member.joined_at), 'MMM d, yyyy')}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {member.user_id !== project.owner_id && (
                          <button
                            className="inline-flex items-center gap-1.5 text-sm px-2.5 py-1.5 rounded-md transition-colors"
                            style={{ color: '#E5484D' }}
                            onClick={() => handleRemoveMember(member.user_id)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229,72,77,0.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <UserMinus size={14} /> Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          projectId={id}
          task={editTask}
          onClose={() => { setShowTaskModal(false); setEditTask(null) }}
          onSaved={fetchTasks}
        />
      )}
      {showMemberModal && (
        <MemberModal
          projectId={id}
          onClose={() => setShowMemberModal(false)}
          onAdded={fetchProject}
        />
      )}
    </div>
  )
}
