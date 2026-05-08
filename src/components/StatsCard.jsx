const colorMap = {
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-500',    text: 'text-blue-600' },
  green:   { bg: 'bg-green-50',   icon: 'bg-green-500',   text: 'text-green-600' },
  purple:  { bg: 'bg-purple-50',  icon: 'bg-purple-500',  text: 'text-purple-600' },
  orange:  { bg: 'bg-orange-50',  icon: 'bg-orange-500',  text: 'text-orange-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
  red:     { bg: 'bg-red-50',     icon: 'bg-red-500',     text: 'text-red-600' },
  yellow:  { bg: 'bg-yellow-50',  icon: 'bg-yellow-500',  text: 'text-yellow-600' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-600' },
}

export default function StatsCard({ title, value, icon: Icon, color = 'amber', trend, trendLabel, subtitle }) {
  const c = colorMap[color] || colorMap.amber

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${c.icon} rounded-xl flex items-center justify-center shadow-sm`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'} px-2 py-0.5 rounded-full border ${trend >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-slate-800 leading-tight">{value}</p>
        <p className="text-sm text-slate-500 mt-1 font-medium">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        {trendLabel && <p className="text-xs text-slate-400 mt-1">{trendLabel}</p>}
      </div>
    </div>
  )
}
