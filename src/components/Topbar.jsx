import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, LogOut, KeyRound, Loader2 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useClients } from '../context/ClientsContext'
import Modal from './Modal'
import { getInitials } from '../utils/helpers'

const titles = {
  '/dashboard': 'Tableau de bord',
  '/clients': 'Gestion des clients',
  '/calendrier': 'Réservations & Planning',
  '/paiements': 'Paiements',
  '/presence': 'Présence des élèves',
  '/documents': 'Documents',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user, logout, changePassword } = useAuth()
  const { clients } = useClients()
  const navigate = useNavigate()
  const base = '/' + pathname.split('/')[1]
  const title = titles[base] || 'Auto-École ALBAYAN'

  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef(null)
  const searchResults = search.trim().length >= 2
    ? clients.filter(c => c.nomComplet.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : []

  function handleSelectClient(client) {
    navigate(`/clients/${client.id}`)
    setSearch('')
    setSearchFocused(false)
  }

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function openPasswordModal() {
    setDropdownOpen(false)
    setForm({ current: '', next: '', confirm: '' })
    setError('')
    setSuccess(false)
    setShowPasswordModal(true)
  }

  async function handleChangePassword() {
    setError('')
    if (!form.current || !form.next || !form.confirm) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    if (form.next.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (form.next !== form.confirm) {
      setError('Les nouveaux mots de passe ne correspondent pas.')
      return
    }
    setSaving(true)
    try {
      await changePassword(form.current, form.next)
      setSuccess(true)
      setForm({ current: '', next: '', confirm: '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-amber-500 rounded-full" />
        <div>
          <h2 className="font-bold text-slate-800 text-base leading-tight">{title}</h2>
          <p className="text-xs text-slate-400">
            {new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Casablanca' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block" ref={searchRef}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Rechercher un client..."
            className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 w-56 transition-all"
          />
          {searchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
              {searchResults.map(c => (
                <button
                  key={c.id}
                  onMouseDown={() => handleSelectClient(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(c.nomComplet)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{c.nomComplet}</p>
                    <p className="text-xs text-slate-400">{c.telephone} · {c.statut}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchFocused && search.trim().length >= 2 && searchResults.length === 0 && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 py-4 z-50 text-center text-sm text-slate-400">
              Aucun client trouvé
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{user?.nom || 'Admin'}</p>
                <p className="text-xs text-amber-600 leading-tight">Administrateur</p>
              </div>
              <ChevronDown size={13} className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <button
                  onClick={openPasswordModal}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <KeyRound size={15} className="text-slate-400" />
                  Changer le mot de passe
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Déconnexion
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Changer le mot de passe" size="sm">
        {success ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <KeyRound size={22} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">Mot de passe modifié avec succès</p>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="mt-4 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
            >
              Fermer
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Mot de passe actuel</label>
              <input
                type="password"
                value={form.current}
                onChange={e => setForm(p => ({ ...p, current: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={form.next}
                onChange={e => setForm(p => ({ ...p, next: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
            {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                Annuler
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </header>
  )
}
