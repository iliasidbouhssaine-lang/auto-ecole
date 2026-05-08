const statusConfig = {
  actif:        { label: 'Actif',        className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  inactif:      { label: 'Inactif',      className: 'bg-slate-100 text-slate-600 border-slate-200' },
  suspendu:     { label: 'Suspendu',     className: 'bg-red-100 text-red-700 border-red-200' },
  'terminé':    { label: 'Terminé',      className: 'bg-blue-100 text-blue-700 border-blue-200' },
  réussite:     { label: 'Réussite',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  rattrapage:   { label: 'Rattrapage',   className: 'bg-orange-100 text-orange-700 border-orange-200' },
  payé:         { label: 'Payé',         className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  en_attente:   { label: 'En attente',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
  partiel:      { label: 'Partiel',      className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'présent':    { label: 'Présent',      className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  absent:       { label: 'Absent',       className: 'bg-red-100 text-red-700 border-red-200' },
  retard:       { label: 'Retard',       className: 'bg-amber-100 text-amber-700 border-amber-200' },
  'confirmé':   { label: 'Confirmé',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'annulé':     { label: 'Annulé',       className: 'bg-red-100 text-red-700 border-red-200' },
  'généré':     { label: 'Généré',       className: 'bg-blue-100 text-blue-700 border-blue-200' },
  bon:          { label: 'Bon état',     className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  entretien:    { label: 'Entretien',    className: 'bg-amber-100 text-amber-700 border-amber-200' },
}

export default function StatusBadge({ status, size = 'sm' }) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' }
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.className} ${sizeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70"></span>
      {config.label}
    </span>
  )
}
