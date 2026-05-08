import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AttendanceContext = createContext({ attendance: [], loading: true, refresh: () => {} })

export function AttendanceProvider({ children }) {
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance')
      const data = await res.json()
      setAttendance(data)
    } catch (err) {
      console.error('Erreur chargement présences:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return (
    <AttendanceContext.Provider value={{ attendance, loading, refresh }}>
      {children}
    </AttendanceContext.Provider>
  )
}

export const useAttendance = () => useContext(AttendanceContext)
