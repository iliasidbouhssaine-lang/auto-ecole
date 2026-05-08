import { useState } from 'react'
import { Users, CheckCircle2, Loader2 } from 'lucide-react'
import { useAttendance } from '../context/AttendanceContext'
import { useClients } from '../context/ClientsContext'
import ClientSearchSelect from '../components/ClientSearchSelect'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatsCard from '../components/StatsCard'
import SearchBar from '../components/SearchBar'
import Modal from '../components/Modal'
import { formatDate, getInitials } from '../utils/helpers'

const TODAY = new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' })

function getWeekRange() {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }),
    end: sunday.toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }),
  }
}

export default function Attendance() {
  const { attendance, loading, refresh } = useAttendance()
  const { clients, refresh: refreshClients } = useClients()
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ clientId: '', date: TODAY, heure: '09:00', notes: '' })
  const [saving, setSaving] = useState(false)

  const filtered = attendance.filter(r => {
    const matchSearch = r.clientNom.toLowerCase().includes(search.toLowerCase())
    const matchDate = !dateFilter || r.date === dateFilter
    return matchSearch && matchDate
  })

  const todayCount = attendance.filter(r => r.date === TODAY).length
  const { start: weekStart, end: weekEnd } = getWeekRange()
  const weekCount = attendance.filter(r => r.date >= weekStart && r.date <= weekEnd).length

  async function handleAdd() {
    if (!form.clientId) return
    const client = clients.find(c => c.id === parseInt(form.clientId))
    if (!client) return
    setSaving(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: parseInt(form.clientId),
          clientNom: client.nomComplet,
          date: form.date,
          heure: form.heure,
          statut: 'présent',
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error()
      await Promise.all([refresh(), refreshClients()])
      setForm({ clientId: '', date: TODAY, heure: '09:00', notes: '' })
      setShowModal(false)
    } catch {
      alert('Erreur lors de l\'enregistrement. Vérifiez que le serveur est démarré.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Présence des élèves"
        subtitle={`${todayCount} séance${todayCount > 1 ? 's' : ''} aujourd'hui`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 size={16} /> Enregistrer une séance
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatsCard title="Présence semaine" value={weekCount} icon={Users} color="blue" />
        <StatsCard title="Présence du jour" value={todayCount} icon={CheckCircle2} color="green" />
      </div>

      <SectionCard
        title="Historique de présence"
        actions={
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Client..." className="w-52" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Effacer
              </button>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Élève', 'Date', 'Heure', 'Notes'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-3 first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">Aucune séance trouvée</td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-0 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(r.clientNom)}
                        </div>
                        <span className="font-medium text-slate-700">{r.clientNom}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      <span className={r.date === TODAY ? 'text-amber-600 font-semibold' : ''}>
                        {formatDate(r.date)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{r.heure || '—'}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs max-w-[200px] truncate">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
          {filtered.length} séance{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}
        </div>
      </SectionCard>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Enregistrer une séance" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Élève *</label>
            <ClientSearchSelect
              clients={clients.filter(c => c.statut === 'actif')}
              value={form.clientId}
              onChange={c => setForm(p => ({ ...p, clientId: c ? c.id : '' }))}
              placeholder="Rechercher un élève..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Heure *</label>
              <input
                type="time"
                value={form.heure}
                onChange={e => setForm(p => ({ ...p, heure: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Remarques</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Observations sur la séance..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={handleAdd}
            disabled={!form.clientId || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </Modal>
    </div>
  )
}
