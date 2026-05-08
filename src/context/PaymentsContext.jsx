import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const PaymentsContext = createContext({ payments: [], loading: true, refresh: () => {} })

export function PaymentsProvider({ children }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/payments')
      const data = await res.json()
      setPayments(data)
    } catch (err) {
      console.error('Erreur chargement paiements:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <PaymentsContext.Provider value={{ payments, loading, refresh }}>
      {children}
    </PaymentsContext.Provider>
  )
}

export const usePayments = () => useContext(PaymentsContext)
