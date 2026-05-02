import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight, Command, Check } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const { signup, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')
    try {
      await signup(form.email, form.password, form.fullName)
      toast.success('Account created!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left: Brand panel */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0F0F1A 0%, #16162A 50%, #1A1A35 100%)' }}
      >
        <div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(91, 91, 214, 0.12)' }}
        />
        <div
          className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full blur-[100px]"
          style={{ background: 'rgba(110, 109, 232, 0.08)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(91,91,214,1) 1px, transparent 1px), linear-gradient(90deg, rgba(91,91,214,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5B5BD6 0%, #6E6DE8 100%)' }}
            >
              <Command size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TaskFlow</span>
          </div>

          <div className="max-w-md">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8"
              style={{ background: 'rgba(48,164,108,0.12)', color: '#4ADE80' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#30A46C' }} />
              Free to get started
            </div>
            <h2 className="text-4xl font-bold leading-[1.15] mb-5 text-white">
              Bring your team's<br />work{' '}
              <span className="gradient-text">together.</span>
            </h2>
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Beautiful boards, drag-and-drop simplicity, and real-time clarity for everyone.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Unlimited projects & tasks',
                'Kanban with drag-and-drop',
                'Role-based access control',
              ].map((t) => (
                <li key={t} className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(91,91,214,0.15)' }}
                  >
                    <Check size={11} style={{ color: '#5B5BD6' }} />
                  </span>
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            © {new Date().getFullYear()} TaskFlow. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 justify-center mb-10">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5B5BD6 0%, #6E6DE8 100%)' }}
            >
              <Command size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold gradient-text">TaskFlow</span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            Create your account
          </h1>
          <p className="text-text-secondary mt-1.5 text-sm">
            Set up your workspace in seconds.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  className="input pl-10"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jane Cooper"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="email"
                  className="input pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <input
                  type="password"
                  className="input pl-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full py-2.5 mt-2 group" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                <>
                  Create account
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#8B8BF5' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
