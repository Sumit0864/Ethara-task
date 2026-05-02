const STATUS_CONFIG = {
  todo: {
    label: 'Todo',
    dot: '#8B8B9E',
    bg: 'rgba(139, 139, 158, 0.12)',
    text: '#8B8B9E',
    ring: 'rgba(139, 139, 158, 0.2)',
  },
  in_progress: {
    label: 'In Progress',
    dot: '#5B5BD6',
    bg: 'rgba(91, 91, 214, 0.12)',
    text: '#8B8BF5',
    ring: 'rgba(91, 91, 214, 0.2)',
  },
  done: {
    label: 'Done',
    dot: '#30A46C',
    bg: 'rgba(48, 164, 108, 0.12)',
    text: '#4ADE80',
    ring: 'rgba(48, 164, 108, 0.2)',
  },
}

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    bg: 'rgba(48, 164, 108, 0.1)',
    text: '#4ADE80',
    ring: 'rgba(48, 164, 108, 0.2)',
  },
  medium: {
    label: 'Medium',
    bg: 'rgba(245, 166, 35, 0.1)',
    text: '#F5A623',
    ring: 'rgba(245, 166, 35, 0.2)',
  },
  high: {
    label: 'High',
    bg: 'rgba(229, 72, 77, 0.1)',
    text: '#F87171',
    ring: 'rgba(229, 72, 77, 0.2)',
  },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.todo
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{
        background: config.bg,
        color: config.text,
        boxShadow: `inset 0 0 0 1px ${config.ring}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: config.dot }}
      />
      {config.label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide"
      style={{
        background: config.bg,
        color: config.text,
        boxShadow: `inset 0 0 0 1px ${config.ring}`,
      }}
    >
      {config.label}
    </span>
  )
}
