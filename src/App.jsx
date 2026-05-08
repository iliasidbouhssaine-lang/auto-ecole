import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ClientsProvider } from './context/ClientsContext'
import { ReservationsProvider } from './context/ReservationsContext'
import { PaymentsProvider } from './context/PaymentsContext'
import { AttendanceProvider } from './context/AttendanceContext'
import AppRoutes from './routes/index.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClientsProvider>
          <ReservationsProvider>
            <PaymentsProvider>
              <AttendanceProvider>
                <AppRoutes />
              </AttendanceProvider>
            </PaymentsProvider>
          </ReservationsProvider>
        </ClientsProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
