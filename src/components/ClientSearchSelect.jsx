import { useState, useRef, useEffect } from 'react'
import { Search, X } from 'lucide-react'

export default function ClientSearchSelect({ clients, value, onChange, placeholder = 'Rechercher un client...' }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = value ? clients.find(c => c.id === parseInt(value)) : null

  useEffect(() => {
    if (selected) setSearch(selected.nomComplet)
    else setSearch('')
  }, [value])

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = clients.filter(c => {
    if (!search || selected) return true
    const q = search.toLowerCase()
    return c.nomComplet.toLowerCase().includes(q) || c.numeroIdentite.toLowerCase().includes(q)
  }).slice(0, 8)

  function handleSelect(client) {
    onChange(client)
    setSearch(client.nomComplet)
    setOpen(false)
  }

  function handleClear(e) {
    e.stopPropagation()
    onChange(null)
    setSearch('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          className="w-full pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 bg-white"
          placeholder={placeholder}
          value={search}
          onChange={e => { setSearch(e.target.value); onChange(null); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        {(search || selected) && (
          <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={13} />
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-50 transition-colors ${selected?.id === c.id ? 'bg-amber-50' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${c.sexe === 'F' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                {(c.nomComplet[0] || '').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{c.nomComplet}</p>
                <p className="text-xs text-slate-400">{c.numeroIdentite}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
