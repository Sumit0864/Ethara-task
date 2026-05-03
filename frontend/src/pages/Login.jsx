import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Command } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#000000] text-[#EDEDF0] font-sans selection:bg-white/20">
      <div className="w-full max-w-[380px] p-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-white flex items-center justify-center rounded-xl shadow-lg">
            <Command size={24} className="text-black" strokeWidth={2.5} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-[22px] font-semibold tracking-tight text-white mb-2">Log in to TaskFlow</h1>
          <p className="text-[#888888] text-sm">Enter your email and password to continue.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#A1A1AA]">Email address</label>
            <input
              type="email"
              className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-white placeholder-[#52525B] focus:outline-none focus:border-[#52525B] focus:ring-1 focus:ring-[#52525B] transition-all text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-[#A1A1AA]">Password</label>
            </div>
            <input
              type="password"
              className="w-full px-3 py-2.5 bg-[#0A0A0A] border border-[#27272A] rounded-md text-white placeholder-[#52525B] focus:outline-none focus:border-[#52525B] focus:ring-1 focus:ring-[#52525B] transition-all text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 px-4 mt-4 bg-white text-black font-semibold text-sm rounded-md hover:bg-[#E4E4E7] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(255,255,255,0.1)] hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-[#888888]">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="text-white font-medium hover:underline underline-offset-4 transition-colors"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
