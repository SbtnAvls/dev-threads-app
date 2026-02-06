import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import {
  Dashboard,
  DevelopersPage,
  DevDetailPage,
  QAsPage,
  QADetailPage,
  LoginPage
} from './pages'

function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/developers" element={<DevelopersPage />} />
                <Route path="/developer/:id" element={<DevDetailPage />} />
                <Route path="/qas" element={<QAsPage />} />
                <Route path="/qa/:id" element={<QADetailPage />} />
                <Route path="/settings" element={<ComingSoon title="Configuracion" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

// Placeholder component for routes not yet implemented
function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-6xl mb-4">🚧</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">{title}</h1>
      <p className="text-text-secondary">Esta pagina estara disponible pronto</p>
    </div>
  )
}

export default App
