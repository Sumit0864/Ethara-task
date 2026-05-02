import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare, ChevronDown, Command } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const initial = (user?.full_name || '?')[0].toUpperCase()

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(10, 10, 15, 0.8)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-glow-lg"
                style={{ background: 'linear-gradient(135deg, #5B5BD6 0%, #6E6DE8 100%)' }}
              >
                <Command size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-base tracking-tight gradient-text hidden sm:block">
                TaskFlow
              </span>
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-0.5">
              {[
                { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { to: '/projects', label: 'Projects', icon: FolderKanban },
              ].map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    isActive(to)
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={isActive(to) ? { background: 'var(--bg-elevated)' } : undefined}
                >
                  <Icon size={15} strokeWidth={isActive(to) ? 2 : 1.5} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg transition-colors duration-150 hover:bg-bg-elevated"
            >
              <div className="avatar avatar-md">{initial}</div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-[13px] font-medium text-text-primary">{user?.full_name}</p>
              </div>
              <ChevronDown
                size={13}
                className={`text-text-tertiary transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-12 w-56 rounded-xl overflow-hidden animate-slide-up"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 16px 48px -8px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <p className="text-sm font-medium text-text-primary truncate">{user?.full_name}</p>
                  <p className="text-xs text-text-tertiary truncate mt-0.5">{user?.email}</p>
                  {user?.role === 'superadmin' && (
                    <span
                      className="mt-2 inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(91,91,214,0.15)', color: '#8B8BF5' }}
                    >
                      Super Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors duration-150"
                  style={{ color: '#E5484D' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(229,72,77,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
