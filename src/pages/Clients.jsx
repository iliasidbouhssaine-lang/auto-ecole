import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Eye, UserCheck, UserX, Users, ChevronRight, Loader2, Trophy, RotateCcw, PauseCircle, Flag, Pencil } from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import PageHeader from '../components/PageHeader'
import SearchBar from '../components/SearchBar'
import FilterSelect from '../components/FilterSelect'
import StatusBadge from '../components/StatusBadge'
import SectionCard from '../components/SectionCard'
import Modal from '../components/Modal'
import StatsCard from '../components/StatsCard'
import { formatDate, formatCurrency, getInitials, getProgress } from '../utils/helpers'

const VILLES = [
  'AGADIR','BENI MELLAL','CASABLANCA','DAKHLA','EL JADIDA',
  'ERRACHIDIA','FÈS','GUELMIM','KENITRA','KHOURIBGA',
  'LAAYOUNE','LARACHE','MARRAKECH','MEKNÈS','MOHAMMEDIA',
  'NADOR','OUARZAZATE','OUJDA','RABAT','SAFI',
  'SALÉ','SETTAT','TANGER','TÉTOUAN','TIZNIT',
]

const CATEGORIES = ['A','A1','A2','AM','B','B1','B+E','C','C1','C+E','D','D1']

const emptyForm = {
  sexe: 'M',
  nationalite: 'MAROCAINE',
  typeIdentite: 'CIN',
  numeroIdentite: '',
  prenom: '',
  prenomAr: '',
  nom: '',
  nomAr: '',
  dateNaissance: '',
  lieuNaissance: '',
  lieuNaissanceAr: '',
  adresse: '',
  adresseAr: '',
  ville: '',
  email: '',
  telephone: '',
  langue: 'francais',
  categorie: 'B',
  centreImmatriculateur: '',
  numDossier: '',
  formule: 'Forfait 20h',
  montantTotal: 2800,
  remarques: '',
}

const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white"
const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1"

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest whitespace-nowrap px-1">{children}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  )
}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map(opt => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${value === opt.value ? 'border-amber-500 bg-amber-500' : 'border-slate-300 group-hover:border-amber-400'}`}>
            {value === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
          </div>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="sr-only"
          />
          <span className={`text-sm ${value === opt.value ? 'text-amber-700 font-semibold' : 'text-slate-600'}`}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}

export default function Clients() {
  const { clients, loading, refresh } = useClients()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [step, setStep] = useState(1)
  const [terminerTarget, setTerminerTarget] = useState(null)
  const [terminerSaving, setTerminerSaving] = useState(false)

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  async function handleTerminerClient(result) {
    if (!terminerTarget) return
    const newStatut = result === 'réussite' ? 'terminé' : result === 'suspendu' ? 'suspendu' : 'actif'
    if (newStatut === terminerTarget.statut) { setTerminerTarget(null); return }
    setTerminerSaving(true)
    try {
      await fetch(`/api/clients/${terminerTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...terminerTarget, statut: newStatut }),
      })
      await refresh()
      setTerminerTarget(null)
    } finally {
      setTerminerSaving(false)
    }
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch =
      c.nomComplet.toLowerCase().includes(q) ||
      c.telephone.includes(q) ||
      c.numeroIdentite.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.nom.toLowerCase().includes(q)
    const matchStatus = !statusFilter || c.statut === statusFilter
    const matchCat = !categoryFilter || c.categorie === categoryFilter
    return matchSearch && matchStatus && matchCat
  })

  const stats = {
    total: clients.length,
    actif: clients.filter(c => c.statut === 'actif').length,
    termine: clients.filter(c => c.statut === 'terminé').length,
    suspendu: clients.filter(c => c.statut === 'suspendu').length,
  }

  async function handleAdd() {
    if (!form.prenom || !form.nom || !form.telephone || !form.numeroIdentite) return
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        montantTotal: parseInt(form.montantTotal) || 0,
      }),
    })
    await refresh()
    setForm(emptyForm)
    setStep(1)
    setShowModal(false)
  }

  function handleClose() {
    setForm(emptyForm)
    setStep(1)
    setShowModal(false)
  }

  const step1Valid = form.numeroIdentite && form.prenom && form.nom && form.dateNaissance
  const step2Valid = form.telephone && form.ville && form.centreImmatriculateur

  return (
    <div>
      <PageHeader
        title="Gestion des clients"
        subtitle={`${stats.total} client${stats.total > 1 ? 's' : ''} enregistré${stats.total > 1 ? 's' : ''}`}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} /> Nouveau client
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total" value={stats.total} icon={Users} color="amber" />
        <StatsCard title="Actifs" value={stats.actif} icon={UserCheck} color="green" />
        <StatsCard title="Terminés" value={stats.termine} icon={UserCheck} color="purple" />
        <StatsCard title="Suspendus" value={stats.suspendu} icon={UserX} color="red" />
      </div>

      <SectionCard
        title="Liste des clients"
        actions={
          <div className="flex items-center gap-2">
            <SearchBar value={search} onChange={setSearch} placeholder="Nom, CIN, téléphone..." className="w-56" />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' },
                { value: 'suspendu', label: 'Suspendu' },
                { value: 'terminé', label: 'Terminé' },
              ]}
              placeholder="Tous les statuts"
              className="w-40"
            />
            <FilterSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={CATEGORIES.map(c => ({ value: c, label: `Permis ${c}` }))}
              placeholder="Toutes catégories"
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} className="mb-3 opacity-30" />
            <p className="font-medium text-sm">Aucun client trouvé</p>
            <p className="text-xs mt-1">Ajoutez un client ou modifiez votre recherche</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Client', 'CIN', 'Téléphone', 'Catégorie', 'Ville', 'Heures', 'Paiement', 'Statut', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider py-3 px-3 first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => {
                  const hPct = getProgress(c.heuresEffectuees, c.heuresPrevues)
                  const pPct = getProgress(c.montantPaye, c.montantTotal)
                  return (
                    <tr key={c.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="py-3 pl-0 pr-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm ${c.sexe === 'F' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                            {getInitials(c.nomComplet)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{c.nomComplet}</p>
                            <p className="text-xs text-slate-400 font-arabic" dir="rtl">{c.prenomAr} {c.nomAr}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">{c.numeroIdentite}</td>
                      <td className="py-3 px-3 text-slate-600 text-xs whitespace-nowrap">{c.telephone}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center justify-center min-w-[32px] h-8 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs px-2 border border-amber-100">
                          {c.categorie}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-xs whitespace-nowrap">{c.ville}</td>
                      <td className="py-3 px-3">
                        <div className="w-20">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{c.heuresEffectuees}h</span>
                            <span className="text-slate-400">{c.heuresPrevues}h</span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-1.5">
                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${hPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-20">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-600">{formatCurrency(c.montantPaye)}</span>
                            <span className={pPct === 100 ? 'text-emerald-600' : 'text-red-500'}>
                              {pPct === 100 ? '✓' : `-${formatCurrency(c.montantTotal - c.montantPaye)}`}
                            </span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pPct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={c.statut} />
                          {c.statut === 'actif' && (
                            <button
                              onClick={() => setTerminerTarget(c)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              title="Clôturer la formation"
                            >
                              <Flag size={12} />
                            </button>
                          )}
                          {(c.statut === 'terminé' || c.statut === 'suspendu') && (
                            <button
                              onClick={() => setTerminerTarget(c)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                              title="Modifier le statut"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pl-3 pr-0">
                        <Link
                          to={`/clients/${c.id}`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg"
                        >
                          <Eye size={12} /> Voir
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <span>{clients.length} client{clients.length > 1 ? 's' : ''} au total</span>
        </div>
      </SectionCard>

      {/* Modal clôture / modification statut */}
      <Modal
        isOpen={!!terminerTarget}
        onClose={() => setTerminerTarget(null)}
        title={terminerTarget?.statut === 'actif' ? 'Clôturer la formation' : 'Modifier le statut'}
        size="sm"
      >
        {terminerTarget && (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Quel est le résultat de la formation de <span className="font-semibold text-slate-800">{terminerTarget.nomComplet}</span> ?
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleTerminerClient('réussite')}
                disabled={terminerSaving}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Trophy size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Réussite</p>
                  <p className="text-xs text-emerald-600">Formation terminée avec succès → statut "Terminé"</p>
                </div>
              </button>
              <button
                onClick={() => handleTerminerClient('rattrapage')}
                disabled={terminerSaving}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-orange-200 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-all text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <RotateCcw size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-orange-800 text-sm">
                    {terminerTarget?.statut === 'actif' ? 'Rattrapage' : 'Réactiver'}
                  </p>
                  <p className="text-xs text-orange-600">
                    {terminerTarget?.statut === 'actif' ? 'Doit repasser l\'examen → reste "Actif"' : 'Remettre en formation → statut "Actif"'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => handleTerminerClient('suspendu')}
                disabled={terminerSaving}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-400 transition-all text-left disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <PauseCircle size={15} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-red-800 text-sm">Suspendu</p>
                  <p className="text-xs text-red-600">Formation interrompue → statut "Suspendu"</p>
                </div>
              </button>
            </div>
            {terminerSaving && (
              <div className="flex items-center justify-center mt-3 gap-2 text-slate-500 text-xs">
                <Loader2 size={14} className="animate-spin" /> Mise à jour...
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal inscription client */}
      <Modal
        isOpen={showModal}
        onClose={handleClose}
        title="Inscription d'un nouveau client"
        size="xl"
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 -mt-1">
          {[
            { n: 1, label: 'Identité' },
            { n: 2, label: 'Coordonnées' },
            { n: 3, label: 'Formation' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => step > s.n && setStep(s.n)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  step === s.n
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : step > s.n
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer hover:bg-emerald-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === s.n ? 'bg-white/20' : step > s.n ? 'bg-emerald-500 text-white' : 'bg-slate-200'}`}>
                  {step > s.n ? '✓' : s.n}
                </span>
                {s.label}
              </button>
              {i < 2 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: Identité ─── */}
        {step === 1 && (
          <div>
            <div className="mb-2">
              <label className={labelCls}>Référence dossier</label>
              <input
                type="text"
                value={form.numDossier}
                onChange={e => set('numDossier', e.target.value.toUpperCase())}
                placeholder="Ex: 6956-EE169449-1185"
                className={`${inputCls} font-mono`}
              />
            </div>
            <SectionTitle>État civil</SectionTitle>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Sexe *</label>
                <RadioGroup
                  name="sexe"
                  value={form.sexe}
                  onChange={v => set('sexe', v)}
                  options={[{ value: 'M', label: 'Masculin' }, { value: 'F', label: 'Féminin' }]}
                />
              </div>
              <div>
                <label className={labelCls}>Nationalité *</label>
                <select value={form.nationalite} onChange={e => set('nationalite', e.target.value)} className={inputCls}>
                  <option>MAROCAINE</option>
                  <option>AUTRE</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Type d'identité *</label>
                <RadioGroup
                  name="typeIdentite"
                  value={form.typeIdentite}
                  onChange={v => set('typeIdentite', v)}
                  options={[{ value: 'CIN', label: 'CIN' }, { value: 'CD', label: 'CD' }, { value: 'CS', label: 'CS' }]}
                />
              </div>
              <div>
                <label className={labelCls}>Numéro d'identité *</label>
                <input
                  type="text"
                  value={form.numeroIdentite}
                  onChange={e => set('numeroIdentite', e.target.value.toUpperCase())}
                  placeholder="Ex: EE169449"
                  className={`${inputCls} font-mono uppercase`}
                />
              </div>
            </div>

            <SectionTitle>Noms et prénoms</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Prénom *</label>
                <input type="text" value={form.prenom} onChange={e => set('prenom', e.target.value.toUpperCase())}
                  placeholder="ANDERRAHIM" className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={`${labelCls} text-right`} dir="rtl">الاسم الشخصي *</label>
                <input type="text" value={form.prenomAr} onChange={e => set('prenomAr', e.target.value)}
                  placeholder="عبد الرحيم" className={`${inputCls} text-right`} dir="rtl" />
              </div>
              <div>
                <label className={labelCls}>Nom *</label>
                <input type="text" value={form.nom} onChange={e => set('nom', e.target.value.toUpperCase())}
                  placeholder="BENHISSI" className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={`${labelCls} text-right`} dir="rtl">الإسم العائلي *</label>
                <input type="text" value={form.nomAr} onChange={e => set('nomAr', e.target.value)}
                  placeholder="بنحسي" className={`${inputCls} text-right`} dir="rtl" />
              </div>
            </div>

            <SectionTitle>Naissance</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Date de naissance *</label>
                <input type="date" value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)}
                  className={inputCls} />
              </div>
              <div className="col-span-1" />
              <div>
                <label className={labelCls}>Lieu de naissance *</label>
                <input type="text" value={form.lieuNaissance} onChange={e => set('lieuNaissance', e.target.value.toUpperCase())}
                  placeholder="MENARA GUELIZ MARRAKECH" className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={`${labelCls} text-right`} dir="rtl">مكان الازدياد</label>
                <input type="text" value={form.lieuNaissanceAr} onChange={e => set('lieuNaissanceAr', e.target.value)}
                  placeholder="المدارة كليز مراكش" className={`${inputCls} text-right`} dir="rtl" />
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-amber-500/25"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Coordonnées ─── */}
        {step === 2 && (
          <div>
            <SectionTitle>Adresse</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Adresse *</label>
                <input type="text" value={form.adresse} onChange={e => set('adresse', e.target.value.toUpperCase())}
                  placeholder="ASKEJOUR LOT HAHA LAMAASRA NO 99" className={`${inputCls} uppercase`} />
              </div>
              <div>
                <label className={`${labelCls} text-right`} dir="rtl">العنوان</label>
                <input type="text" value={form.adresseAr} onChange={e => set('adresseAr', e.target.value)}
                  placeholder="اسكجور تجزئة حاحا لمعصرة رقم 99" className={`${inputCls} text-right`} dir="rtl" />
              </div>
              <div>
                <label className={labelCls}>Ville *</label>
                <select value={form.ville} onChange={e => set('ville', e.target.value)} className={inputCls}>
                  <option value="">Sélectionner une ville</option>
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className={`${labelCls} text-right`} dir="rtl">المدينة</label>
                <input type="text" value={form.villeAr || ''} onChange={e => set('villeAr', e.target.value)}
                  placeholder="مراكش" className={`${inputCls} text-right`} dir="rtl" />
              </div>
            </div>

            <SectionTitle>Contact</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="exemple@gmail.com" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Téléphone GSM *</label>
                <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)}
                  placeholder="0666666666" className={inputCls} />
              </div>
            </div>

            <SectionTitle>Paramètres formation</SectionTitle>
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className={labelCls}>Langue choisie *</label>
                <RadioGroup
                  name="langue"
                  value={form.langue}
                  onChange={v => set('langue', v)}
                  options={[
                    { value: 'arabe', label: 'Arabe' },
                    { value: 'francais', label: 'Français' },
                    { value: 'arabe_dialectal', label: 'Arabe dialectal' },
                  ]}
                />
              </div>
              <div>
                <label className={labelCls}>Catégorie demandée *</label>
                <select value={form.categorie} onChange={e => set('categorie', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c} value={c}>Catégorie {c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Centre Immatriculateur de dépôt *</label>
                <select value={form.centreImmatriculateur} onChange={e => set('centreImmatriculateur', e.target.value)} className={inputCls}>
                  <option value="">Sélectionner un centre</option>
                  {VILLES.map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Précédent
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!step2Valid}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-amber-500/25"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Formation ─── */}
        {step === 3 && (
          <div>
            <SectionTitle>Récapitulatif de l'élève</SectionTitle>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${form.sexe === 'F' ? 'bg-gradient-to-br from-pink-400 to-pink-600' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                  {(form.prenom[0] || '') + (form.nom[0] || '')}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{form.prenom} {form.nom}</p>
                  <p className="text-sm text-slate-500" dir="rtl">{form.prenomAr} {form.nomAr}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { l: 'CIN', v: form.numeroIdentite },
                  { l: 'Téléphone', v: form.telephone },
                  { l: 'Ville', v: form.ville },
                  { l: 'Catégorie', v: form.categorie },
                  { l: 'Centre', v: form.centreImmatriculateur },
                  { l: 'Langue', v: form.langue === 'arabe_dialectal' ? 'Dialectal' : form.langue === 'arabe' ? 'Arabe' : 'Français' },
                ].map(r => (
                  <div key={r.l} className="bg-white rounded-lg p-2 border border-amber-100">
                    <p className="text-slate-400 font-medium">{r.l}</p>
                    <p className="text-slate-700 font-semibold truncate">{r.v || '-'}</p>
                  </div>
                ))}
              </div>
            </div>

            <SectionTitle>Formule de formation</SectionTitle>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Formule *</label>
                <select value={form.formule} onChange={e => set('formule', e.target.value)} className={inputCls}>
                  {[
                    'Forfait 10h Moto',
                    'Forfait 15h',
                    'Forfait 20h',
                    'Forfait 25h',
                    'Forfait 30h',
                    'Forfait Permis C',
                    'Formule sur mesure',
                  ].map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Montant total (MAD) *</label>
                <input
                  type="number"
                  value={form.montantTotal}
                  onChange={e => set('montantTotal', e.target.value)}
                  placeholder="4500"
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className={labelCls}>Remarques / Observations</label>
                <textarea
                  value={form.remarques}
                  onChange={e => set('remarques', e.target.value)}
                  rows={3}
                  placeholder="Informations supplémentaires sur cet élève..."
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5">
              <p className="text-xs font-semibold text-slate-500 mb-2">Récapitulatif financier</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Montant total de la formation</span>
                <span className="text-lg font-black text-amber-600">{parseInt(form.montantTotal) || 0} MAD</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Le premier versement sera enregistré séparément dans la section Paiements.</p>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Précédent
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.formule || !form.montantTotal}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-40 shadow-md shadow-amber-500/25"
              >
                Enregistrer le client
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
