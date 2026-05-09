import { useState, useRef, useEffect } from 'react'
import { Plus, TrendingUp, Clock, CheckCircle2, CreditCard, Loader2, Pencil, Trash2, Search } from 'lucide-react'
import { usePayments } from '../context/PaymentsContext'
import { useClients } from '../context/ClientsContext'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatsCard from '../components/StatsCard'
import StatusBadge from '../components/StatusBadge'
import SearchBar from '../components/SearchBar'
import FilterSelect from '../components/FilterSelect'
import Modal from '../components/Modal'
import { formatDate, formatCurrency, getInitials } from '../utils/helpers'

const modeOptions = [
  { value: 'Espèces', label: 'Espèces' },
  { value: 'Chèque', label: 'Chèque' },
  { value: 'Virement', label: 'Virement' },
]

const emptyForm = { clientId: null, clientNom: '', montant: '', mode: 'Espèces', note: '' }

function FreeClientSearch({ clients, clientNom, onSelect }) {
  const [search, setSearch] = useState(clientNom || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => { setSearch(clientNom || '') }, [clientNom])

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const results = search.trim().length >= 1
    ? clients.filter(c => c.nomComplet.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : []

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); onSelect(null, e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Nom du client ou nom libre..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {results.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { setSearch(c.nomComplet); onSelect(c.id, c.nomComplet); setOpen(false) }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-50 transition-colors"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {getInitials(c.nomComplet)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{c.nomComplet}</p>
                <p className="text-xs text-slate-400">{c.telephone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Payments() {
  const { payments, loading, refresh } = usePayments()
  const { clients, refresh: refreshClients } = useClients()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [editingPayment, setEditingPayment] = useState(null)
  const [editForm, setEditForm] = useState({ montant: '', mode: 'Espèces', note: '' })
  const [editSaving, setEditSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = payments.filter(p => {
    const matchSearch = p.clientNom.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || p.statut === statusFilter
    const matchMode = !modeFilter || p.mode === modeFilter
    return matchSearch && matchStatus && matchMode
  })

  const totalPaye    = payments.filter(p => p.statut === 'payé').reduce((s, p) => s + p.montant, 0)
  const totalAttente = payments.filter(p => p.statut === 'en_attente').reduce((s, p) => s + p.montant, 0)
  const currentMonth = new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }).slice(0, 7)
  const thisMonth    = payments.filter(p => p.date.startsWith(currentMonth) && p.statut === 'payé').reduce((s, p) => s + p.montant, 0)

  async function handleAdd() {
    if (!form.clientNom.trim() || !form.montant) return
    setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId || null,
          clientNom: form.clientNom.trim(),
          montant: parseFloat(form.montant),
          mode: form.mode,
          note: form.note,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      await Promise.all([refresh(), refreshClients()])
      setForm(emptyForm)
      setShowModal(false)
    } catch {
      alert('Erreur lors de l\'enregistrement. Vérifiez que le serveur est démarré.')
    } finally {
      setSaving(false)
    }
  }

  function openEdit(p) {
    setEditingPayment(p)
    setEditForm({ montant: String(p.montant), mode: p.mode, note: p.note || '' })
  }

  async function handleSaveEdit() {
    if (!editForm.montant) return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/payments/${editingPayment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          montant: parseFloat(editForm.montant),
          mode: editForm.mode,
          note: editForm.note,
        }),
      })
      if (!res.ok) throw new Error('Erreur serveur')
      await Promise.all([refresh(), refreshClients()])
      setEditingPayment(null)
    } catch {
      alert('Erreur lors de la modification.')
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/payments/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur serveur')
      await Promise.all([refresh(), refreshClients()])
      setDeleteTarget(null)
    } catch {
      alert('Erreur lors de la suppression.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Gestion des paiements"
        subtitle={`${payments.length} transaction${payments.length > 1 ? 's' : ''} enregistrée${payments.length > 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} /> Enregistrer un paiement
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total encaissé"   value={formatCurrency(totalPaye)}    icon={CheckCircle2} color="green" />
        <StatsCard title="En attente"       value={formatCurrency(totalAttente)} icon={Clock}        color="orange" />
        <StatsCard title="Ce mois"          value={formatCurrency(thisMonth)}    icon={TrendingUp}   color="blue" />
        <StatsCard title="Transactions"     value={payments.length}              icon={CreditCard}   color="purple" />
      </div>

      <SectionCard
        title="Historique des paiements"
        actions={
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Client..." className="w-52" />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[{ value: 'payé', label: 'Payé' }, { value: 'en_attente', label: 'En attente' }]}
              placeholder="Tous les statuts"
              className="w-40"
            />
            <FilterSelect
              value={modeFilter}
              onChange={setModeFilter}
              options={modeOptions}
              placeholder="Tous les modes"
              className="w-40"
            />
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
                  {['Client', 'Mode', 'Montant', 'Date', 'Note', 'Statut', ''].map((h, i) => (
                    <th key={i} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-3 first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Aucun paiement trouvé</td>
                  </tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 pl-0 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(p.clientNom)}
                        </div>
                        <span className="font-medium text-slate-700">{p.clientNom}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md font-medium">
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">{formatCurrency(p.montant)}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{formatDate(p.date)}</td>
                    <td className="py-3 px-3 text-slate-400 text-xs max-w-[200px] truncate">{p.note || '—'}</td>
                    <td className="py-3 px-3"><StatusBadge status={p.statut} /></td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <span>Total filtré : <strong className="text-slate-600">{formatCurrency(filtered.reduce((s, p) => s + p.montant, 0))}</strong></span>
        </div>
      </SectionCard>

      {/* Modal ajout */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(emptyForm) }} title="Enregistrer un paiement" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
            <FreeClientSearch
              clients={clients}
              clientNom={form.clientNom}
              onSelect={(id, nom) => setForm(p => ({ ...p, clientId: id, clientNom: nom }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Montant (MAD) *</label>
            <input
              type="number"
              value={form.montant}
              onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
              placeholder="Ex: 1500"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Mode de paiement</label>
            <div className="flex gap-2">
              {modeOptions.map(o => (
                <button
                  key={o.value}
                  onClick={() => setForm(p => ({ ...p, mode: o.value }))}
                  className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                    form.mode === o.value
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Note (optionnel)</label>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
              placeholder="Remarque sur ce paiement..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => { setShowModal(false); setForm(emptyForm) }} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={handleAdd}
            disabled={!form.clientNom.trim() || !form.montant || saving}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </Modal>

      {/* Modal modification */}
      <Modal isOpen={!!editingPayment} onClose={() => setEditingPayment(null)} title="Modifier le paiement" size="sm">
        {editingPayment && (
          <>
            <div className="space-y-4">
              <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                Client : <span className="font-medium text-slate-700">{editingPayment.clientNom}</span>
                <span className="mx-2">·</span>
                Date : <span className="font-medium text-slate-700">{formatDate(editingPayment.date)}</span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Montant (MAD) *</label>
                <input
                  type="number"
                  value={editForm.montant}
                  onChange={e => setEditForm(p => ({ ...p, montant: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">Mode de paiement</label>
                <div className="flex gap-2">
                  {modeOptions.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setEditForm(p => ({ ...p, mode: o.value }))}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition-colors ${
                        editForm.mode === o.value
                          ? 'bg-amber-500 border-amber-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Note</label>
                <input
                  type="text"
                  value={editForm.note}
                  onChange={e => setEditForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Remarque..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setEditingPayment(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.montant || editSaving}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {editSaving && <Loader2 size={13} className="animate-spin" />}
                Enregistrer
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Modal confirmation suppression */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le paiement" size="sm">
        {deleteTarget && (
          <>
            <p className="text-sm text-slate-600 mb-2">
              Voulez-vous vraiment supprimer ce paiement de <strong>{formatCurrency(deleteTarget.montant)}</strong> pour <strong>{deleteTarget.clientNom}</strong> ?
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Le montant payé du client sera mis à jour automatiquement.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {deleting && <Loader2 size={13} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
