import { Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'

// Placeholder home route; replaced with the full route table in a later branch.
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div className="page">Dashboard coming soon</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

