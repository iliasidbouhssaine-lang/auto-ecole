import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Car, Eye, EyeOff, LogIn, AlertCircle, Loader2, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  'Gestion des élèves et moniteurs',
  'Planning des séances de conduite',
  'Suivi des paiements et finances',
  'Génération de documents officiels',
]

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await login(form.username, form.password)
    if (ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError('Identifiant ou mot de passe incorrect.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-slate-900 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-amber-500/30">
            <Car size={38} className="text-white" />
          </div>

          <h1 className="text-3xl font-black text-white mb-1 tracking-tight">Auto-École</h1>
          <h2 className="text-2xl font-black text-amber-400 mb-2 tracking-wide">ALBAYAN</h2>
          <div className="w-12 h-1 bg-amber-500 rounded-full mb-6" />

          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-10">
            Plateforme de gestion complète pour votre auto-école — moderne, rapide et professionnelle.
          </p>

          <div className="w-full max-w-xs space-y-3">
            {features.map(f => (
              <div key={f} className="flex items-center gap-3 text-left">
                <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 text-slate-600 text-xs">
          Auto-École ALBAYAN — Système de gestion v1.0
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden justify-center">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Car size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-lg leading-tight">Auto-École</h1>
              <p className="font-black text-amber-500 text-base leading-tight tracking-wide">ALBAYAN</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400" />

            <div className="p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-800">Connexion</h2>
                <p className="text-slate-500 text-sm mt-1">Accédez à votre espace de gestion</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Identifiant
                  </label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                    placeholder="Entrez votre identifiant"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-slate-50 placeholder:text-slate-400"
                    autoComplete="username"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 pr-12 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-slate-50 placeholder:text-slate-400"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !form.username || !form.password}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Connexion en cours...</>
                    : <><LogIn size={18} /> Se connecter</>
                  }
                </button>
              </form>

            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-5">
            © 2026 Auto-École ALBAYAN — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  )
}
