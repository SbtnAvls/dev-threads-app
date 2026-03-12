import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import {
  Dashboard,
  DevelopersPage,
  DevDetailPage,
  IssuesPage,
  IssueDetailPage,
  SprintsPage,
  SprintDetailPage,
  MetricsPage,
  LoginPage,
  RegisterOrgPage,
  OrgSelectorPage,
  OrgSettingsPage,
  AcceptInvitationPage,
} from './pages'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterOrgPage />} />
      <Route path="/select-org" element={<OrgSelectorPage />} />
      <Route path="/invite/:token" element={<AcceptInvitationPage />} />

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
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/issue/:id" element={<IssueDetailPage />} />
                <Route path="/sprints" element={<SprintsPage />} />
                <Route path="/sprint/:id" element={<SprintDetailPage />} />
                <Route path="/metrics" element={<MetricsPage />} />
                <Route path="/settings" element={<OrgSettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
App.displayName = 'DevThreadsApp'
export default App
