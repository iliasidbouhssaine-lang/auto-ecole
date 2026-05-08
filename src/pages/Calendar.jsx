import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, Loader2, Trash2, X, Search, BookOpen, Trophy, RotateCcw, CalendarCheck } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import { useReservations } from '../context/ReservationsContext'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import SectionCard from '../components/SectionCard'

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const TODAY = new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' })

const EVENT_TYPES = [
  { value: 'réservation',          label: 'Réservation',         desc: 'Séance de conduite individuelle',   icon: CalendarCheck, color: 'emerald', multi: false },
  { value: 'examen',               label: 'Examen',              desc: 'Examen officiel de permis',         icon: Trophy,        color: 'blue',    multi: true  },
  { value: 'examen_rattrapage',    label: 'Examen Rattrapage',   desc: 'Rattrapage d\'examen de permis',    icon: RotateCcw,     color: 'orange',  multi: true  },
  { value: 'séance_supplémentaire',label: 'Séance Supplémentaire','desc': 'Cours supplémentaire de groupe', icon: BookOpen,      color: 'purple',  multi: true  },
]

const COLOR_RING = {
  emerald: 'ring-emerald-400 bg-emerald-50 text-emerald-700 border-emerald-300',
  blue:    'ring-blue-400 bg-blue-50 text-blue-700 border-blue-300',
  orange:  'ring-orange-400 bg-orange-50 text-orange-700 border-orange-300',
  purple:  'ring-purple-400 bg-purple-50 text-purple-700 border-purple-300',
}

const BLOCK_COLORS = {
  réservation:           'bg-emerald-100 border-emerald-300 text-emerald-800',
  examen:                'bg-blue-100 border-blue-300 text-blue-800',
  examen_rattrapage:     'bg-orange-100 border-orange-300 text-orange-800',
  séance_supplémentaire: 'bg-purple-100 border-purple-300 text-purple-800',
}

const TYPE_SHORT = {
  réservation:           'Réservation',
  examen:                'Examen',
  examen_rattrapage:     'Rattrapage',
  séance_supplémentaire: 'Séance Supp.',
}

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"

function getWeekDates(base) {
  const day = new Date(base)
  const monday = new Date(day)
  monday.setDate(day.getDate() - ((day.getDay() + 6) % 7))
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

const emptyForm = { type: '', clientId: '', clientNom: '', clients: [], date: TODAY, heure: '09:00', statut: 'confirmé' }

function ClientSearchBox({ clients, selected, multi, onSelect, onRemove }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = clients.filter(c =>
    search === '' ||
    c.nomComplet.toLowerCase().includes(search.toLowerCase()) ||
    c.numeroIdentite.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  const selectedIds = multi ? selected.map(s => s.id) : (selected ? [selected.id] : [])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          className={`${inputCls} pl-8`}
          placeholder="Rechercher un client..."
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(c => {
            const isSelected = selectedIds.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c); if (!multi) { setSearch(c.nomComplet); setOpen(false) } }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-50 transition-colors text-sm ${isSelected ? 'bg-amber-50' : ''}`}
              >
                {multi && (
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">{c.nomComplet}</p>
                  <p className="text-xs text-slate-400">{c.numeroIdentite} — Permis {c.categorie}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {multi && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
              {s.nom.split(' ')[0]}
              <button type="button" onClick={() => onRemove(s.id)} className="hover:text-amber-900">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {!multi && selected && (
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
            {selected.nom}
            <button type="button" onClick={() => { onRemove(); setSearch('') }} className="hover:text-amber-900">
              <X size={11} />
            </button>
          </span>
        </div>
      )}
    </div>
  )
}

export default function Calendar() {
  const { clients } = useClients()
  const { reservations, loading, refresh } = useReservations()
  const [weekBase, setWeekBase] = useState(TODAY)
  const [showModal, setShowModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [viewMode, setViewMode] = useState('week')
  const [saving, setSaving] = useState(false)

  const weekDates = getWeekDates(weekBase)
  const weekLabel = weekDates.length > 0
    ? `${new Date(weekDates[0]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — ${new Date(weekDates[5]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : ''

  function prevWeek() { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d.toISOString().split('T')[0]) }
  function nextWeek() { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d.toISOString().split('T')[0]) }

  const currentType = EVENT_TYPES.find(t => t.value === form.type)
  const isMulti = currentType?.multi ?? false

  const activeClients = clients.filter(c => c.statut === 'actif')

  function handleSelectClient(client) {
    if (isMulti) {
      const exists = form.clients.some(c => c.id === client.id)
      setForm(p => ({
        ...p,
        clients: exists ? p.clients.filter(c => c.id !== client.id) : [...p.clients, { id: client.id, nom: client.nomComplet }],
      }))
    } else {
      setForm(p => ({ ...p, clientId: client.id, clientNom: client.nomComplet }))
    }
  }

  function handleRemoveClient(idOrUndefined) {
    if (isMulti) {
      setForm(p => ({ ...p, clients: p.clients.filter(c => c.id !== idOrUndefined) }))
    } else {
      setForm(p => ({ ...p, clientId: '', clientNom: '' }))
    }
  }

  function resetModal() { setShowModal(false); setForm(emptyForm) }

  const isFormValid = form.type && (isMulti ? form.clients.length > 0 : !!form.clientId)

  async function handleAdd() {
    if (!isFormValid) return
    setSaving(true)
    try {
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          date: form.date,
          heure: form.heure,
          statut: form.statut,
          clientId: isMulti ? null : parseInt(form.clientId),
          clientNom: isMulti ? form.clients.map(c => c.nom).join(', ') : form.clientNom,
          clientsData: isMulti ? form.clients : [],
        }),
      })
      await refresh()
      resetModal()
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateStatut(statut) {
    await fetch(`/api/reservations/${editModal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editModal, statut }),
    })
    await refresh()
    setEditModal(null)
  }

  async function handleDelete(id) {
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    await refresh()
    setEditModal(null)
  }

  const getResForSlot = (date, heure) => reservations.filter(r => r.date === date && r.heure === heure)
  const listReservations = reservations.filter(r => r.date >= weekDates[0] && r.date <= weekDates[5])

  function getDisplayName(r) {
    if (r.clientsData?.length > 1) return `${r.clientsData[0].nom.split(' ')[0]} +${r.clientsData.length - 1}`
    return (r.clientNom || '').split(' ')[0]
  }

  return (
    <div>
      <PageHeader
        title="Calendrier"
        subtitle={`Semaine du ${weekLabel}`}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button onClick={() => setViewMode('week')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'week' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Semaine</button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>Liste</button>
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        }
      />

      <div className="flex items-center justify-end mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><ChevronLeft size={18} /></button>
          <span className="text-sm font-medium text-slate-700 min-w-max">{weekLabel}</span>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 size={20} className="animate-spin" /><span className="text-sm">Chargement...</span>
        </div>
      ) : viewMode === 'week' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="w-16 text-left text-xs font-semibold text-slate-400 p-3">Heure</th>
                  {weekDates.map((date, i) => {
                    const isToday = date === TODAY
                    return (
                      <th key={date} className={`text-center p-3 border-l border-slate-100 ${isToday ? 'bg-amber-50' : ''}`}>
                        <p className="text-xs font-semibold text-slate-500">{DAY_NAMES[i]}</p>
                        <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-amber-600' : 'text-slate-700'}`}>{new Date(date).getDate()}</p>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(heure => (
                  <tr key={heure} className="border-b border-slate-50">
                    <td className="p-2 text-xs font-medium text-slate-400 border-r border-slate-100 text-right pr-3">{heure}</td>
                    {weekDates.map(date => {
                      const slots = getResForSlot(date, heure)
                      const isToday = date === TODAY
                      return (
                        <td key={`${date}-${heure}`} className={`p-1.5 border-l border-slate-100 min-h-[52px] align-top ${isToday ? 'bg-amber-50/30' : ''}`}>
                          {slots.map(r => (
                            <div
                              key={r.id}
                              onClick={() => setEditModal(r)}
                              className={`rounded-lg border px-2 py-1.5 mb-1 text-xs leading-tight cursor-pointer hover:opacity-80 transition-opacity ${BLOCK_COLORS[r.type] || BLOCK_COLORS.réservation} ${r.statut === 'annulé' ? 'opacity-40 line-through' : ''}`}
                            >
                              <p className="font-semibold truncate">{getDisplayName(r)}</p>
                              <p className="opacity-60 text-[10px]">{TYPE_SHORT[r.type] || r.type}</p>
                            </div>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <SectionCard title={`${listReservations.length} événement(s) cette semaine`}>
          <div className="space-y-2">
            {listReservations.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Aucun événement cette semaine</p>
            ) : listReservations.map(r => (
              <div key={r.id} onClick={() => setEditModal(r)} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                  r.type === 'examen' ? 'bg-blue-400' :
                  r.type === 'examen_rattrapage' ? 'bg-orange-400' :
                  r.type === 'séance_supplémentaire' ? 'bg-purple-400' : 'bg-emerald-400'
                }`} />
                <div className="flex items-center gap-1.5 text-slate-700 flex-shrink-0 w-20">
                  <Clock size={13} className="text-slate-400" />
                  <span className="text-sm font-semibold">{r.heure}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-700 truncate">{r.clientNom}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${BLOCK_COLORS[r.type] || BLOCK_COLORS.réservation}`}>{TYPE_SHORT[r.type]}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Modal ajout événement ── */}
      <Modal isOpen={showModal} onClose={resetModal} title="Nouvel événement" size="sm">
        <div className="space-y-5">
          {/* Étape 1 : type */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Type d'événement</p>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(t => {
                const Icon = t.icon
                const active = form.type === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...emptyForm, type: t.value, date: p.date, heure: p.heure }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${active ? `border-current ring-1 ${COLOR_RING[t.color]}` : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${active ? `bg-${t.color}-500` : 'bg-slate-100'}`}>
                      <Icon size={14} className={active ? 'text-white' : 'text-slate-500'} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold leading-tight ${active ? `text-${t.color}-700` : 'text-slate-700'}`}>{t.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Étape 2 : détails (seulement si type choisi) */}
          {form.type && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {isMulti ? 'Clients concernés *' : 'Client *'}
                </label>
                <ClientSearchBox
                  clients={activeClients}
                  selected={isMulti ? form.clients : (form.clientId ? { id: form.clientId, nom: form.clientNom } : null)}
                  multi={isMulti}
                  onSelect={handleSelectClient}
                  onRemove={handleRemoveClient}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Heure *</label>
                  <select value={form.heure} onChange={e => setForm(p => ({ ...p, heure: e.target.value }))} className={inputCls}>
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
              </div>

              {!isMulti && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Statut</label>
                  <div className="flex gap-2">
                    {['confirmé', 'en_attente'].map(s => (
                      <button key={s} type="button" onClick={() => setForm(p => ({ ...p, statut: s }))}
                        className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                          form.statut === s
                            ? s === 'confirmé' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-amber-500 border-amber-500 text-white'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}>
                        {s === 'en_attente' ? 'En attente' : 'Confirmé'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={resetModal} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Annuler</button>
          <button onClick={handleAdd} disabled={!isFormValid || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />}
            Confirmer
          </button>
        </div>
      </Modal>

      {/* ── Modal détail / modification ── */}
      <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Détail de l'événement" size="sm">
        {editModal && (
          <div>
            <div className={`rounded-xl p-4 mb-5 border ${BLOCK_COLORS[editModal.type] || BLOCK_COLORS.réservation}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">{TYPE_SHORT[editModal.type]}</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                {editModal.clientsData?.length > 0
                  ? editModal.clientsData.map(c => c.nom).join(', ')
                  : editModal.clientNom}
              </p>
              <p className="text-xs opacity-70 mt-1 flex items-center gap-1.5">
                <Clock size={11} />
                {new Date(editModal.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {editModal.heure}
              </p>
            </div>

            {editModal.type === 'réservation' && (
              <>
                <p className="text-xs font-medium text-slate-500 mb-2">Changer le statut</p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {['confirmé', 'en_attente', 'annulé'].map(s => (
                    <button key={s} onClick={() => handleUpdateStatut(s)}
                      className={`py-2.5 text-xs font-semibold rounded-xl border-2 transition-all ${
                        editModal.statut === s
                          ? s === 'confirmé' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : s === 'annulé' ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-amber-500 bg-amber-50 text-amber-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}>
                      {s === 'en_attente' ? 'En attente' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => handleDelete(editModal.id)}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 size={13} /> Supprimer
              </button>
              <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Fermer</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
