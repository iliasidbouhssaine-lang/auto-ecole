import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ReservationsContext = createContext({ reservations: [], loading: true, refresh: () => {} })

export function ReservationsProvider({ children }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/reservations')
      const data = await res.json()
      setReservations(data)
    } catch (err) {
      console.error('Erreur chargement réservations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <ReservationsContext.Provider value={{ reservations, loading, refresh }}>
      {children}
    </ReservationsContext.Provider>
  )
}

export const useReservations = () => useContext(ReservationsContext)
