import { Link } from 'react-router-dom'
import {
  Users, UserCheck, CalendarDays, CreditCard, TrendingUp,
  ArrowRight, Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import { useClients } from '../context/ClientsContext'
import { useReservations } from '../context/ReservationsContext'
import { usePayments } from '../context/PaymentsContext'
import StatsCard from '../components/StatsCard'
import SectionCard from '../components/SectionCard'
import StatusBadge from '../components/StatusBadge'
import { formatDate, formatCurrency, getInitials } from '../utils/helpers'

const TODAY = new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' })

const modules = [
  { label: 'Clients', path: '/clients', icon: Users, color: 'bg-amber-500', desc: 'Gérer les élèves' },
  { label: 'Réservations', path: '/calendrier', icon: CalendarDays, color: 'bg-purple-500', desc: 'Planning des séances' },
  { label: 'Paiements', path: '/paiements', icon: CreditCard, color: 'bg-emerald-500', desc: 'Suivi financier' },
  { label: 'Présence', path: '/presence', icon: CheckCircle2, color: 'bg-amber-500', desc: "Marquer les présences" },
]

export default function Dashboard() {
  const { clients } = useClients()
  const { reservations } = useReservations()
  const { payments } = usePayments()
  const totalClients = clients.length
  const activeClients = clients.filter(c => c.statut === 'actif').length
  const todayRes = reservations.filter(r => r.date === TODAY)
  const pendingPayments = clients.filter(c => c.montantTotal - c.montantPaye > 0 && c.statut !== 'terminé').length
  const currentMonth = new Date().toLocaleDateString('fr-CA', { timeZone: 'Africa/Casablanca' }).slice(0, 7)
  const monthRevenue = payments
    .filter(p => p.date.startsWith(currentMonth) && p.statut === 'payé')
    .reduce((sum, p) => sum + p.montant, 0)

  const recentReservations = reservations.filter(r => r.date >= TODAY).slice(0, 5)
  const recentPayments = [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Tableau de bord</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bienvenue — voici un aperçu de votre auto-école</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total clients" value={totalClients} icon={Users} color="blue" trend={8} />
        <StatsCard title="Clients actifs" value={activeClients} icon={UserCheck} color="green" trend={5} />
        <StatsCard title="Paiements en attente" value={pendingPayments} icon={AlertCircle} color="orange" />
        <StatsCard
          title="Revenus du mois"
          value={formatCurrency(monthRevenue)}
          icon={TrendingUp}
          color="emerald"
          trend={12}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <SectionCard
          title="Prochaines réservations"
          subtitle={`${todayRes.length} séances aujourd'hui`}
          actions={
            <Link to="/calendrier" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Tout voir <ArrowRight size={12} />
            </Link>
          }
        >
          {recentReservations.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucune réservation à venir</p>
          ) : (
            <div className="space-y-3">
              {recentReservations.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {getInitials(r.clientNom)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{r.clientNom}</p>
                    <p className="text-xs text-slate-400">{formatDate(r.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-700">{r.heure}</p>
                  </div>
                  <StatusBadge status={r.statut} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Paiements récents"
          actions={
            <Link to="/paiements" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
              Tout voir <ArrowRight size={12} />
            </Link>
          }
        >
          <div className="space-y-3">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {getInitials(p.clientNom)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{p.clientNom}</p>
                  <p className="text-xs text-slate-400">{p.mode}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(p.montant)}</p>
                  <p className="text-xs text-slate-400">{formatDate(p.date)}</p>
                </div>
                <StatusBadge status={p.statut} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {modules.map(m => (
          <Link
            key={m.path}
            to={m.path}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <m.icon size={18} className="text-white" />
            </div>
            <p className="font-semibold text-slate-800 text-sm">{m.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{m.desc}</p>
            <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Accéder <ArrowRight size={11} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
