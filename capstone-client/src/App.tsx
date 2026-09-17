import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ClaimsPage from './pages/ClaimsPage'
import ClaimDetailPage from './pages/ClaimDetailPage'
import ProtectedRoute from './components/ProtectedRoute'

// Full navigation/layout wiring lands in a later branch.
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims"
        element={
          <ProtectedRoute>
            <ClaimsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims/:id"
        element={
          <ProtectedRoute>
            <ClaimDetailPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

