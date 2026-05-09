import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, MapPin, CreditCard, Calendar, User,
  Clock, CheckCircle2, FileText, FileCheck, FileBadge, FileSignature, MessageSquare, Globe, BadgeCheck, Info,
  Loader2, Pencil, X, Check, Hash, Download, AlertCircle, Trophy, RotateCcw, PauseCircle
} from 'lucide-react'
import Modal from '../components/Modal'
import { documents } from '../data/documents'
import { usePayments } from '../context/PaymentsContext'
import { useAttendance } from '../context/AttendanceContext'
import StatusBadge from '../components/StatusBadge'
import SectionCard from '../components/SectionCard'
import { formatDate, formatCurrency, getInitials, getProgress } from '../utils/helpers'

const tabs = [
  { id: 'historique', label: 'Présences', icon: CheckCircle2 },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'infos', label: 'Informations', icon: Info },
  { id: 'remarques', label: 'Remarques', icon: MessageSquare },
]

const langueLabels = {
  arabe: 'Arabe (classique)',
  francais: 'Français',
  arabe_dialectal: 'Arabe dialectal',
}

const inputCls = "w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"

export default function ClientDetail() {
  const { id } = useParams()
  const { payments } = usePayments()
  const { attendance } = useAttendance()
  const [activeTab, setActiveTab] = useState('historique')
  const [client, setClient] = useState(null)
  const [fetchLoading, setFetchLoading] = useState(true)

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const [remarkEdit, setRemarkEdit] = useState(false)
  const [remarkText, setRemarkText] = useState('')
  const [savingRemark, setSavingRemark] = useState(false)

  const [generatingContract, setGeneratingContract] = useState(false)
  const [contractError, setContractError] = useState('')

  const [showTerminerModal, setShowTerminerModal] = useState(false)
  const [terminerSaving, setTerminerSaving] = useState(false)

  useEffect(() => {
    setFetchLoading(true)
    fetch(`/api/clients/${id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setClient(data)
          setRemarkText(data.remarques || '')
        }
        setFetchLoading(false)
      })
      .catch(() => setFetchLoading(false))
  }, [id])

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p className="font-medium">Client introuvable</p>
        <Link to="/clients" className="mt-2 text-sm text-amber-600 hover:underline">Retour à la liste</Link>
      </div>
    )
  }

  const clientAttendance = attendance.filter(a => a.clientId === client.id)
  const clientPayments = payments.filter(p => p.clientId === client.id)
  const clientDocuments = documents.filter(d => d.clientId === client.id)

  const totalPaye = clientPayments.reduce((sum, p) => sum + p.montant, 0)
  const heuresEffectuees = clientAttendance.filter(a => a.statut === 'présent').length
  const hProgress = getProgress(heuresEffectuees, client.heuresPrevues)
  const pProgress = getProgress(totalPaye, client.montantTotal)
  const montantRestant = client.montantTotal - totalPaye

  function startEdit() {
    setEditForm({ ...client })
    setEditMode(true)
  }

  function cancelEdit() {
    setEditMode(false)
    setEditForm({})
  }

  function set(field, value) {
    setEditForm(p => ({ ...p, [field]: value }))
  }

  async function handleSaveInfos() {
    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setClient(updated)
      setEditMode(false)
    } catch {
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveRemark() {
    setSavingRemark(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...client, remarques: remarkText }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setClient(updated)
      setRemarkEdit(false)
    } catch {
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSavingRemark(false)
    }
  }

  async function handleTerminer(result) {
    let newStatut
    if (result === 'réussite') newStatut = 'terminé'
    else if (result === 'rattrapage') newStatut = 'rattrapage'
    else if (result === 'echec') newStatut = 'suspendu'
    else newStatut = 'actif'
    if (newStatut === client.statut) { setShowTerminerModal(false); return }
    setTerminerSaving(true)
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...client, statut: newStatut }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setClient(updated)
      setShowTerminerModal(false)
    } catch {
      alert('Erreur lors de la mise à jour.')
    } finally {
      setTerminerSaving(false)
    }
  }

  async function handleGenerateContract() {
    setGeneratingContract(true)
    setContractError('')
    try {
      const PYTHON_BASE = import.meta.env.VITE_PYTHON_URL || '/api'
      const res = await fetch(`${PYTHON_BASE}/documents/contrat-formation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
        signal: AbortSignal.timeout(90000),
      })
      if (!res.ok) throw new Error('generation_failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contrat_${(client.nomComplet || 'client').replace(/ /g, '_')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      // Sauvegarder la date de génération du contrat en DB
      fetch(`/api/clients/${client.id}/contrat-date`, { method: 'PATCH' }).catch(() => {})
    } catch {
      // silently close on error
    } finally {
      setGeneratingContract(false)
    }
  }

  return (
    <div>
      <div className="mb-5">
        <Link to="/clients" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-4">
          <ArrowLeft size={15} /> Retour aux clients
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md shadow-amber-500/20">
              {getInitials(client.nomComplet)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-slate-800">{client.nomComplet}</h1>
                    {client.numDossier && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                        <Hash size={10} /> {client.numDossier}
                      </span>
                    )}
                  </div>
                  {client.nomAr && client.prenomAr && (
                    <p className="text-base text-slate-500 mt-0.5 font-medium" dir="rtl">
                      {client.prenomAr} {client.nomAr}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Phone size={13} /> {client.telephone}
                    </span>
                    {client.email && (
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Mail size={13} /> {client.email}
                      </span>
                    )}
                    {client.ville && (
                      <span className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin size={13} /> {client.ville}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={client.statut} size="md" />
                  {client.statut === 'rattrapage' && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold" title="Rattrapage">
                      R
                    </span>
                  )}
                  <button
                    onClick={() => setShowTerminerModal(true)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
                    title="Modifier le statut"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <InfoChip icon={BadgeCheck} label={client.typeIdentite || 'Identité'} value={client.numeroIdentite} />
                <InfoChip icon={CreditCard} label="Catégorie" value={`Permis ${client.categorie}`} />
                <InfoChip icon={Calendar} label="Inscription" value={formatDate(client.dateInscription)} />
                <InfoChip icon={FileText} label="Formule" value={client.formule} />
                {client.centreImmatriculateur && (
                  <InfoChip icon={Globe} label="Centre" value={client.centreImmatriculateur} />
                )}
                {client.langue && (
                  <InfoChip icon={User} label="Langue" value={langueLabels[client.langue] || client.langue} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <SectionCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <span className="text-sm font-semibold text-slate-700">Heures de conduite</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{hProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all ${hProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${hProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span><strong className="text-slate-800">{heuresEffectuees}h</strong> effectuées</span>
            <span><strong className="text-slate-800">{client.heuresPrevues - heuresEffectuees}h</strong> restantes</span>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">Paiements</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{pProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all ${pProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${pProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span><strong className="text-emerald-700">{formatCurrency(totalPaye)}</strong> payé</span>
            <span className={montantRestant > 0 ? 'text-red-500' : 'text-emerald-600'}>
              <strong>{montantRestant > 0 ? `-${formatCurrency(montantRestant)}` : 'Soldé ✓'}</strong>
            </span>
          </div>
        </SectionCard>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex border-b border-slate-100 px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setEditMode(false) }}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── Présences ── */}
          {activeTab === 'historique' && (
            <div className="space-y-2">
              {clientAttendance.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Aucune séance enregistrée</p>
              ) : (
                clientAttendance.map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="text-center w-24 flex-shrink-0">
                      <p className="text-xs font-semibold text-slate-700">{a.heure || '—'}</p>
                      <p className="text-xs text-slate-400">{formatDate(a.date)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      {a.notes && <p className="text-xs text-slate-400 truncate">{a.notes}</p>}
                    </div>
                    <StatusBadge status={a.statut} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Paiements ── */}
          {activeTab === 'paiements' && (
            <div className="space-y-2">
              {clientPayments.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Aucun paiement enregistré</p>
              ) : (
                clientPayments.map(p => (
                  <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700">{p.mode}</p>
                      <p className="text-xs text-slate-400">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ''}</p>
                    </div>
                    <span className="text-base font-bold text-slate-800">{formatCurrency(p.montant)}</span>
                    <StatusBadge status={p.statut} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Documents ── */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Documents déjà générés */}
              {clientDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Documents générés ({clientDocuments.length})
                  </p>
                  <div className="space-y-2">
                    {clientDocuments.map(d => {
                      const docMap = {
                        'Contrat de formation':           { Icon: FileSignature, color: 'bg-amber-100 text-amber-600' },
                        'Reçu de paiement':               { Icon: FileCheck,     color: 'bg-emerald-100 text-emerald-600' },
                        'Facture':                        { Icon: FileText,      color: 'bg-purple-100 text-purple-600' },
                        'Attestation de fin de formation':{ Icon: FileBadge,     color: 'bg-blue-100 text-blue-600' },
                      }
                      const { Icon, color } = docMap[d.type] || { Icon: FileText, color: 'bg-slate-100 text-slate-500' }
                      return (
                        <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700">{d.type}</p>
                            <p className="text-xs text-slate-400">{formatDate(d.date)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {clientDocuments.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">Aucun document généré pour ce client</p>
              )}

              {/* Générer un nouveau contrat */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Générer</p>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileSignature size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">Contrat de formation</p>
                    <p className="text-xs text-slate-500">Contrat officiel prêt à signer</p>
                  </div>
                  <button
                    onClick={handleGenerateContract}
                    disabled={generatingContract}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {generatingContract ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {generatingContract ? 'Génération...' : 'Télécharger PDF'}
                  </button>
                </div>
                {contractError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2">
                    <AlertCircle size={12} /> {contractError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Informations ── */}
          {activeTab === 'infos' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                {!editMode ? (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    <Pencil size={14} /> Modifier
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <X size={14} /> Annuler
                    </button>
                    <button
                      onClick={handleSaveInfos}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>

              <InfoSection title="Identité" titleAr="الهوية">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {editMode ? (
                    <>
                      <EditRow label="Sexe">
                        <select value={editForm.sexe || ''} onChange={e => set('sexe', e.target.value)} className={inputCls}>
                          <option value="M">Masculin</option>
                          <option value="F">Féminin</option>
                        </select>
                      </EditRow>
                      <EditRow label="Nationalité"><input value={editForm.nationalite || ''} onChange={e => set('nationalite', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Type d'identité">
                        <select value={editForm.typeIdentite || ''} onChange={e => set('typeIdentite', e.target.value)} className={inputCls}>
                          <option value="CIN">CIN</option>
                          <option value="Passeport">Passeport</option>
                          <option value="Carte de séjour">Carte de séjour</option>
                        </select>
                      </EditRow>
                      <EditRow label="Numéro d'identité"><input value={editForm.numeroIdentite || ''} onChange={e => set('numeroIdentite', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Prénom">
                        <div className="flex gap-2">
                          <input placeholder="Français" value={editForm.prenom || ''} onChange={e => set('prenom', e.target.value)} className={inputCls} />
                          <input placeholder="العربية" dir="rtl" value={editForm.prenomAr || ''} onChange={e => set('prenomAr', e.target.value)} className={inputCls} />
                        </div>
                      </EditRow>
                      <EditRow label="Nom">
                        <div className="flex gap-2">
                          <input placeholder="Français" value={editForm.nom || ''} onChange={e => set('nom', e.target.value)} className={inputCls} />
                          <input placeholder="العربية" dir="rtl" value={editForm.nomAr || ''} onChange={e => set('nomAr', e.target.value)} className={inputCls} />
                        </div>
                      </EditRow>
                      <EditRow label="Date de naissance"><input type="date" value={editForm.dateNaissance || ''} onChange={e => set('dateNaissance', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Lieu de naissance">
                        <div className="flex gap-2">
                          <input placeholder="Français" value={editForm.lieuNaissance || ''} onChange={e => set('lieuNaissance', e.target.value)} className={inputCls} />
                          <input placeholder="العربية" dir="rtl" value={editForm.lieuNaissanceAr || ''} onChange={e => set('lieuNaissanceAr', e.target.value)} className={inputCls} />
                        </div>
                      </EditRow>
                    </>
                  ) : (
                    <>
                      <InfoRow label="Sexe" value={client.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                      <InfoRow label="Nationalité" value={client.nationalite} />
                      <InfoRow label="Type d'identité" value={client.typeIdentite} />
                      <InfoRow label="Numéro d'identité" value={client.numeroIdentite} />
                      <InfoRow label="Prénom" value={client.prenom} valueAr={client.prenomAr} />
                      <InfoRow label="Nom" value={client.nom} valueAr={client.nomAr} />
                      <InfoRow label="Date de naissance" value={formatDate(client.dateNaissance)} />
                      <InfoRow label="Lieu de naissance" value={client.lieuNaissance} valueAr={client.lieuNaissanceAr} />
                    </>
                  )}
                </div>
              </InfoSection>

              <InfoSection title="Coordonnées" titleAr="معلومات الاتصال">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {editMode ? (
                    <>
                      <EditRow label="Adresse">
                        <div className="flex gap-2">
                          <input placeholder="Français" value={editForm.adresse || ''} onChange={e => set('adresse', e.target.value)} className={inputCls} />
                          <input placeholder="العربية" dir="rtl" value={editForm.adresseAr || ''} onChange={e => set('adresseAr', e.target.value)} className={inputCls} />
                        </div>
                      </EditRow>
                      <EditRow label="Ville"><input value={editForm.ville || ''} onChange={e => set('ville', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Téléphone"><input value={editForm.telephone || ''} onChange={e => set('telephone', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Email"><input type="email" value={editForm.email || ''} onChange={e => set('email', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Langue">
                        <select value={editForm.langue || ''} onChange={e => set('langue', e.target.value)} className={inputCls}>
                          <option value="francais">Français</option>
                          <option value="arabe_dialectal">Arabe dialectal</option>
                          <option value="arabe">Arabe (classique)</option>
                        </select>
                      </EditRow>
                    </>
                  ) : (
                    <>
                      <InfoRow label="Adresse" value={client.adresse} valueAr={client.adresseAr} />
                      <InfoRow label="Ville" value={client.ville} />
                      <InfoRow label="Téléphone" value={client.telephone} />
                      <InfoRow label="Email" value={client.email || '—'} />
                      <InfoRow label="Langue d'enseignement" value={langueLabels[client.langue] || client.langue} />
                    </>
                  )}
                </div>
              </InfoSection>

              <InfoSection title="Formation" titleAr="التكوين">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                  {editMode ? (
                    <>
                      <EditRow label="Réf. dossier"><input value={editForm.numDossier || ''} onChange={e => set('numDossier', e.target.value.toUpperCase())} placeholder="6956-EE169449-1185" className={`${inputCls} font-mono`} /></EditRow>
                      <EditRow label="Catégorie">
                        <select value={editForm.categorie || 'B'} onChange={e => set('categorie', e.target.value)} className={inputCls}>
                          {['A', 'A1', 'A2', 'B', 'C', 'D', 'E'].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </EditRow>
                      <EditRow label="Centre immatriculateur"><input value={editForm.centreImmatriculateur || ''} onChange={e => set('centreImmatriculateur', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Formule">
                        <select value={editForm.formule || ''} onChange={e => set('formule', e.target.value)} className={inputCls}>
                          {['Forfait 20h', 'Forfait 30h', 'Forfait 40h'].map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </EditRow>
                      <EditRow label="Montant total (MAD)"><input type="number" value={editForm.montantTotal || ''} onChange={e => set('montantTotal', e.target.value)} className={inputCls} /></EditRow>
                      <EditRow label="Statut">
                        <select value={editForm.statut || 'actif'} onChange={e => set('statut', e.target.value)} className={inputCls}>
                          <option value="actif">Actif</option>
                          <option value="inactif">Inactif</option>
                          <option value="terminé">Terminé</option>
                          <option value="réussite">Réussite</option>
                          <option value="rattrapage">Rattrapage</option>
                          <option value="suspendu">Suspendu</option>
                        </select>
                      </EditRow>
                    </>
                  ) : (
                    <>
                      {client.numDossier && <InfoRow label="Réf. dossier" value={client.numDossier} />}
                      <InfoRow label="Catégorie" value={`Permis ${client.categorie}`} />
                      <InfoRow label="Centre immatriculateur" value={client.centreImmatriculateur} />
                      <InfoRow label="Formule" value={client.formule} />
                      <InfoRow label="Date d'inscription" value={formatDate(client.dateInscription)} />
                      <InfoRow label="Montant total" value={formatCurrency(client.montantTotal)} />
                      <InfoRow label="Montant payé" value={formatCurrency(client.montantPaye)} />
                    </>
                  )}
                </div>
              </InfoSection>
            </div>
          )}

          {/* ── Remarques ── */}
          {activeTab === 'remarques' && (
            <div>
              {!remarkEdit ? (
                <div>
                  {client.remarques ? (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-3">
                      <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{client.remarques}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm text-center py-8">Aucune remarque</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setRemarkText(client.remarques || ''); setRemarkEdit(true) }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      <Pencil size={14} /> {client.remarques ? 'Modifier' : 'Ajouter une remarque'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={remarkText}
                    onChange={e => setRemarkText(e.target.value)}
                    rows={5}
                    placeholder="Saisir une remarque..."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 resize-none"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRemarkEdit(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                    >
                      <X size={14} /> Annuler
                    </button>
                    <button
                      onClick={handleSaveRemark}
                      disabled={savingRemark}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingRemark ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showTerminerModal}
        onClose={() => !terminerSaving && setShowTerminerModal(false)}
        title={
          client.statut === 'actif' ? 'Clôturer la formation' :
          client.statut === 'rattrapage' ? 'Résultat du rattrapage' :
          'Modifier le statut'
        }
        size="sm"
      >
        <p className="text-sm text-slate-500 mb-5">
          Sélectionnez le nouveau statut de <strong className="text-slate-700">{client.nomComplet}</strong>.
        </p>
        <div className="space-y-3">
          {/* Réussite — for actif or rattrapage */}
          {(client.statut === 'actif' || client.statut === 'rattrapage') && (
            <button
              onClick={() => handleTerminer('réussite')}
              disabled={terminerSaving}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-emerald-800 text-sm">Réussite</p>
                <p className="text-xs text-emerald-600 mt-0.5">L'élève a réussi son examen de permis</p>
              </div>
              {terminerSaving && <Loader2 size={14} className="animate-spin ml-auto text-emerald-600" />}
            </button>
          )}

          {/* Rattrapage — only for actif */}
          {client.statut === 'actif' && (
            <button
              onClick={() => handleTerminer('rattrapage')}
              disabled={terminerSaving}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <RotateCcw size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Rattrapage</p>
                <p className="text-xs text-orange-600 mt-0.5">L'élève doit repasser une partie de l'examen</p>
              </div>
            </button>
          )}

          {/* Échec — only for rattrapage */}
          {client.statut === 'rattrapage' && (
            <button
              onClick={() => handleTerminer('echec')}
              disabled={terminerSaving}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <PauseCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm">Échec</p>
                <p className="text-xs text-red-600 mt-0.5">Formation échouée → statut "Suspendu"</p>
              </div>
            </button>
          )}

          {/* Réactiver — for terminé or suspendu */}
          {(client.statut === 'terminé' || client.statut === 'suspendu') && (
            <button
              onClick={() => handleTerminer('reactiver')}
              disabled={terminerSaving}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <RotateCcw size={18} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-blue-800 text-sm">Réactiver</p>
                <p className="text-xs text-blue-600 mt-0.5">Remettre en formation → statut "Actif"</p>
              </div>
            </button>
          )}
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setShowTerminerModal(false)}
            disabled={terminerSaving}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Annuler
          </button>
        </div>
      </Modal>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5">
      <Icon size={12} className="text-slate-400 flex-shrink-0" />
      <span className="text-xs text-slate-500">{label}:</span>
      <span className={`text-xs font-medium text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

function InfoSection({ title, titleAr, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>
        {titleAr && <span className="text-sm text-slate-400 font-medium" dir="rtl">{titleAr}</span>}
      </div>
      <div className="bg-slate-50 rounded-xl p-4">
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, valueAr }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
      {valueAr && <p className="text-sm text-slate-500 mt-0.5" dir="rtl">{valueAr}</p>}
    </div>
  )
}

function EditRow({ label, children }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {children}
    </div>
  )
}
