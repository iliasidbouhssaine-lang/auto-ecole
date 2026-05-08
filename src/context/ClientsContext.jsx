import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ClientsContext = createContext({ clients: [], loading: true, refresh: () => {} })

export function ClientsProvider({ children }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(data)
    } catch (err) {
      console.error('Erreur chargement clients:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <ClientsContext.Provider value={{ clients, loading, refresh }}>
      {children}
    </ClientsContext.Provider>
  )
}

export const useClients = () => useContext(ClientsContext)
