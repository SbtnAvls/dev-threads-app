import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Briefcase } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks'

const ORG_TYPES = [
  'Software Development',
  'Marketing Agency',
  'Consulting',
  'Startup',
  'Enterprise',
  'Education',
  'Other',
]

export function RegisterOrgPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registerOrg, loginWithGoogle } = useAuth()
  const [searchParams] = useSearchParams()

  // State from login redirect (user already authenticated with Google)
  const googleToken = location.state?.googleToken || null
  const googleData = location.state?.googleData || null
  const forceCreate = location.state?.forceCreate || searchParams.get('create') === 'true'

  const [orgName, setOrgName] = useState('')
  const [orgType, setOrgType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(googleToken ? 'form' : 'google')

  // Temp storage for google token when user arrives directly
  const [pendingGoogleToken, setPendingGoogleToken] = useState(googleToken)
  const [pendingGoogleData, setPendingGoogleData] = useState(googleData)

  const handleGoogleSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential
    if (!token) {
      setError('No se recibio token de Google')
      return
    }

    setError('')
    setLoading(true)
    try {
      if (forceCreate) {
        // Skip login flow — go straight to org creation form
        // Decode basic info from Google JWT for the preview
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          setPendingGoogleData({
            email: payload.email,
            first_name: payload.given_name || '',
            last_name: payload.family_name || '',
            avatar_url: payload.picture || '',
          })
        } catch {
          setPendingGoogleData(null)
        }
        setPendingGoogleToken(token)
        setStep('form')
        return
      }

      // Normal flow: Check if user already exists
      const result = await loginWithGoogle(token)

      if (result.type === 'authenticated') {
        navigate('/', { replace: true })
        return
      }

      if (result.type === 'select_org') {
        navigate('/select-org', {
          state: {
            organizations: result.organizations,
            user: result.user,
            googleToken: token,
          },
          replace: true,
        })
        return
      }

      // type === 'register' — proceed to org form
      setPendingGoogleToken(token)
      setPendingGoogleData(result.googleData)
      setStep('form')
    } catch (err) {
      setError(err.message || 'Error al conectar con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!orgName.trim()) return

    setError('')
    setLoading(true)
    try {
      await registerOrg(pendingGoogleToken, orgName.trim(), orgType)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al crear la organizacion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-accent-blue to-purple-600 mb-4"
          >
            <img src="/devthreads-icon.png" alt="Dev Threads" className="w-12 h-12 object-cover" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary">Dev Threads</h1>
          <p className="text-text-secondary mt-1">Registra tu organizacion</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border-primary bg-bg-secondary p-6 space-y-5"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm"
            >
              {error}
            </motion.div>
          )}

          {step === 'google' && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-text-secondary text-sm text-center">
                Primero, inicia sesion con Google para crear tu cuenta
              </p>
              {loading ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                  <span className="text-text-secondary text-sm">Conectando...</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Error al conectar con Google')}
                  theme="filled_black"
                  size="large"
                  width="320"
                  text="signup_with"
                  shape="rectangular"
                />
              )}
            </div>
          )}

          {step === 'form' && (
            <>
              {/* User preview */}
              {pendingGoogleData && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary border border-border-primary">
                  {pendingGoogleData.avatar_url && (
                    <img
                      src={pendingGoogleData.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {pendingGoogleData.first_name} {pendingGoogleData.last_name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {pendingGoogleData.email}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Org Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    Nombre de la organizacion
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Mi Empresa"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Org Type */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-secondary">
                    Tipo de organizacion
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-primary bg-bg-primary text-sm text-text-primary focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 transition-all appearance-none"
                    >
                      <option value="">Selecciona un tipo (opcional)</option>
                      {ORG_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading || !orgName.trim()}
                  className="w-full py-2.5 rounded-lg bg-accent-blue text-white font-medium text-sm hover:bg-accent-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando organizacion...
                    </div>
                  ) : (
                    'Crear Organizacion'
                  )}
                </motion.button>
              </form>
            </>
          )}

          {/* Back to login */}
          <div className="pt-2 border-t border-border-primary text-center">
            <p className="text-text-muted text-xs">
              Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accent-blue hover:underline">
                Inicia sesion
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
