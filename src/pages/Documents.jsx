import { useState, useRef, useEffect } from 'react'
import { Plus, FileText, FileCheck, FileBadge, FileSignature, Loader2, AlertCircle, Search, X } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import StatsCard from '../components/StatsCard'
import SearchBar from '../components/SearchBar'
import FilterSelect from '../components/FilterSelect'
import Modal from '../components/Modal'
import { formatDate, getInitials } from '../utils/helpers'

const docTypes = [
  { value: 'Contrat de formation', label: 'Contrat de formation', icon: FileSignature, color: 'bg-amber-500' },
  { value: 'Reçu de paiement', label: 'Reçu de paiement', icon: FileCheck, color: 'bg-emerald-500' },
  { value: 'Facture', label: 'Facture', icon: FileText, color: 'bg-purple-500' },
  { value: 'Attestation de fin de formation', label: 'Attestation', icon: FileBadge, color: 'bg-amber-500' },
]

function getDocIcon(type) {
  return docTypes.find(d => d.value === type) || docTypes[0]
}

const STORAGE_KEY = 'ae_documents'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function loadDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    const cutoff = Date.now() - THIRTY_DAYS_MS
    return all.filter(d => new Date(d.date).getTime() >= cutoff)
  } catch {
    return []
  }
}

function saveDocuments(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export default function Documents() {
  const { clients } = useClients()
  const [documents, setDocuments] = useState(loadDocuments)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showGenModal, setShowGenModal] = useState(false)
  const [genForm, setGenForm] = useState({ clientId: '', type: 'Contrat de formation', attestVersion: '' })

  // Searchable client selector state
  const [clientSearch, setClientSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientPayments, setClientPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [genError, setGenError] = useState('')
  const [generatingModal, setGeneratingModal] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch payments when Reçu type is selected
  useEffect(() => {
    if (genForm.type === 'Reçu de paiement' && selectedClient) {
      setLoadingPayments(true)
      fetch('/api/payments')
        .then(r => r.json())
        .then(all => setClientPayments(all.filter(p => p.clientId === selectedClient.id)))
        .catch(() => setClientPayments([]))
        .finally(() => setLoadingPayments(false))
    } else {
      setClientPayments([])
    }
  }, [genForm.type, selectedClient])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredClients = clients.filter(c =>
    c.nomComplet.toLowerCase().includes(clientSearch.toLowerCase())
  )

  function selectClient(c) {
    setSelectedClient(c)
    setClientSearch(c.nomComplet)
    setGenForm(p => ({ ...p, clientId: c.id }))
    setShowDropdown(false)
  }

  function clearClient() {
    setSelectedClient(null)
    setClientSearch('')
    setGenForm(p => ({ ...p, clientId: '' }))
  }

  function openModal() {
    setShowGenModal(true)
    setGenError('')
    setSelectedClient(null)
    setClientSearch('')
    setGenForm({ clientId: '', type: 'Contrat de formation', attestVersion: '' })
  }

  const filtered = documents.filter(d => {
    const matchSearch = d.clientNom.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase())
    const matchType = !typeFilter || d.type === typeFilter
    return matchSearch && matchType
  })

  async function handleGenerate() {
    const client = clients.find(c => c.id === parseInt(genForm.clientId))
    if (!client) return
    setGenError('')
    setGeneratingModal(true)

    const isAttestation = genForm.type === 'Attestation de fin de formation'
    const isFacture = genForm.type === 'Facture'
    const isContrat = genForm.type === 'Contrat de formation'
    const isRecu = genForm.type === 'Reçu de paiement'

    const PYTHON_BASE = import.meta.env.VITE_PYTHON_URL || '/api'
    const endpoint = isContrat
      ? `${PYTHON_BASE}/documents/contrat-formation`
      : isAttestation && genForm.attestVersion === 'formelle'
        ? `${PYTHON_BASE}/documents/attestation-formelle`
        : isFacture
          ? `${PYTHON_BASE}/documents/facture`
          : isRecu
            ? `${PYTHON_BASE}/documents/recu`
            : null

    if (endpoint) {
      try {
        const payload = isAttestation
          ? { ...client, dateContrat: client.dateContrat || '' }
          : isRecu
            ? { ...client, payments: clientPayments }
            : client

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(90000),
        })
        if (!res.ok) throw new Error('generation_failed')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const prefix = isAttestation ? 'attestation' : isFacture ? 'facture' : isRecu ? 'recu' : 'contrat'
        a.download = `${prefix}_${(client.nomComplet || 'client').replace(/ /g, '_')}.pdf`
        a.click()
        URL.revokeObjectURL(url)

        if (isContrat) {
          fetch(`/api/clients/${client.id}/contrat-date`, { method: 'PATCH' }).catch(() => {})
        }

        const newDoc = {
          id: documents.length + 1,
          clientId: client.id,
          clientNom: client.nomComplet,
          type: genForm.type,
          date: new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }),
          statut: 'généré',
          url: null,
        }
        setDocuments(prev => { const updated = [newDoc, ...prev]; saveDocuments(updated); return updated })
        setShowGenModal(false)
      } catch {
        setShowGenModal(false)
      } finally {
        setGeneratingModal(false)
      }
    } else {
      // Simulation for Reçu / Facture / Attestation autre (pending)
      setTimeout(() => {
        const newDoc = {
          id: documents.length + 1,
          clientId: client.id,
          clientNom: client.nomComplet,
          type: genForm.type,
          date: new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }),
          statut: 'généré',
          url: null,
        }
        setDocuments(prev => { const updated = [newDoc, ...prev]; saveDocuments(updated); return updated })
        setGenForm({ clientId: '', type: 'Contrat de formation', attestVersion: '' })
        setGeneratingModal(false)
        setShowGenModal(false)
      }, 800)
    }
  }

  const canGenerate = genForm.clientId && (
    genForm.type !== 'Attestation de fin de formation' || genForm.attestVersion
  )

  const contrats = documents.filter(d => d.type === 'Contrat de formation').length
  const reçus = documents.filter(d => d.type === 'Reçu de paiement').length
  const attestations = documents.filter(d => d.type === 'Attestation de fin de formation').length
  const factures = documents.filter(d => d.type === 'Facture').length

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle={`${documents.length} documents générés`}
        actions={
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} /> Générer un document
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Contrats', value: contrats, icon: FileSignature, color: 'blue' },
          { label: 'Reçus', value: reçus, icon: FileCheck, color: 'green' },
          { label: 'Attestations', value: attestations, icon: FileBadge, color: 'orange' },
          { label: 'Factures', value: factures, icon: FileText, color: 'purple' },
        ].map(s => (
          <StatsCard key={s.label} title={s.label} value={s.value} icon={s.icon} color={s.color} />
        ))}
      </div>

      <SectionCard
        title="Liste des documents"
        actions={
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Client ou type..." className="w-52" />
            <FilterSelect
              value={typeFilter}
              onChange={setTypeFilter}
              options={docTypes.map(d => ({ value: d.value, label: d.label }))}
              placeholder="Tous les types"
              className="w-48"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Document', 'Client', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 px-3 first:pl-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-slate-400 text-sm">Aucun document trouvé</td>
                </tr>
              ) : filtered.map(d => {
                const docInfo = getDocIcon(d.type)
                const IconComp = docInfo.icon
                return (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3 pl-0 pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${docInfo.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <IconComp size={16} className="text-white" />
                        </div>
                        <span className="font-medium text-slate-700">{d.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {getInitials(d.clientNom)}
                        </div>
                        <span className="text-slate-700">{d.clientNom}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">{formatDate(d.date)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
          {filtered.length} document{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        </div>
      </SectionCard>

      <Modal isOpen={showGenModal} onClose={() => setShowGenModal(false)} title="Générer un document" size="md">
        <div className="space-y-4">

          {/* ── Searchable client selector ── */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Client *</label>
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => {
                    setClientSearch(e.target.value)
                    setSelectedClient(null)
                    setGenForm(p => ({ ...p, clientId: '' }))
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Rechercher par nom ou prénom..."
                  className="w-full pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
                />
                {clientSearch && (
                  <button
                    onClick={clearClient}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {showDropdown && clientSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-slate-400 text-center">Aucun client trouvé</div>
                  ) : filteredClients.map(c => (
                    <button
                      key={c.id}
                      onMouseDown={() => selectClient(c)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-amber-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(c.nomComplet)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.nomComplet}</p>
                        {c.telephone && <p className="text-xs text-slate-400">{c.telephone}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(selectedClient.nomComplet)}
                </div>
                <span className="text-xs font-medium text-amber-800">{selectedClient.nomComplet}</span>
                {selectedClient.categorie && (
                  <span className="text-xs text-amber-600 ml-auto">Permis {selectedClient.categorie}</span>
                )}
              </div>
            )}
          </div>

          {/* ── Document type ── */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Type de document *</label>
            <div className="grid grid-cols-2 gap-3">
              {docTypes.map(dt => {
                const Icon = dt.icon
                return (
                  <button
                    key={dt.value}
                    onClick={() => setGenForm(p => ({ ...p, type: dt.value }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      genForm.type === dt.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 ${dt.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className="text-white" />
                    </div>
                    <span className={`text-xs font-medium leading-tight ${genForm.type === dt.value ? 'text-amber-700' : 'text-slate-700'}`}>
                      {dt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Reçu : aperçu des paiements ── */}
          {genForm.type === 'Reçu de paiement' && selectedClient && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                Paiements de {selectedClient.nomComplet}
              </div>
              {loadingPayments ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin" /> Chargement...
                </div>
              ) : clientPayments.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">Aucun paiement enregistré</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {clientPayments.slice(0, 5).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="text-slate-500">الدفعة{i + 1}</span>
                      <span className="font-medium text-slate-700">{p.montant.toLocaleString('fr-MA', { minimumFractionDigits: 2 })} DH</span>
                      <span className="text-slate-400">{p.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Attestation version selector ── */}
          {genForm.type === 'Attestation de fin de formation' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">Version de l'attestation *</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'formelle', label: 'Formelle', desc: 'Document officiel NARSA' },
                  { value: 'autre', label: 'Autre version', desc: 'Disponible bientôt', disabled: true },
                ].map(v => (
                  <button
                    key={v.value}
                    onClick={() => !v.disabled && setGenForm(p => ({ ...p, attestVersion: v.value }))}
                    disabled={v.disabled}
                    className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                      genForm.attestVersion === v.value
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${genForm.attestVersion === v.value ? 'text-amber-700' : 'text-slate-700'}`}>
                      {v.label}
                    </span>
                    <span className="text-xs text-slate-400">{v.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {genError && (
            <p className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle size={12} /> {genError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button onClick={() => setShowGenModal(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generatingModal}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {generatingModal && <Loader2 size={14} className="animate-spin" />}
            {generatingModal ? 'Génération...' : 'Générer le document'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
