import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bug } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks'

export function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleGoogleSuccess = async (credentialResponse) => {
    const googleToken = credentialResponse.credential
    if (!googleToken) {
      setError('No se recibio token de Google')
      return
    }

    setError('')
    setLoading(true)
    try {
      const result = await loginWithGoogle(googleToken)

      switch (result.type) {
        case 'authenticated':
          navigate(from, { replace: true })
          break

        case 'select_org':
          navigate('/select-org', {
            state: {
              organizations: result.organizations,
              user: result.user,
              googleToken,
            },
            replace: true,
          })
          break

        case 'register':
          navigate('/register', {
            state: {
              googleData: result.googleData,
              googleToken,
            },
            replace: true,
          })
          break

        default:
          setError('Respuesta inesperada del servidor')
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion con Google')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Error al conectar con Google. Intenta de nuevo.')
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
            <Bug className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-text-primary">Dev Threads</h1>
          <p className="text-text-secondary mt-1">Inicia sesion para continuar</p>
        </div>

        {/* Sign-In Card */}
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

          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-text-secondary text-sm">Conectando...</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <p className="text-text-secondary text-sm">
                Usa tu cuenta de Google para acceder
              </p>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                width="320"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          )}

          {/* Register link */}
          <div className="pt-2 border-t border-border-primary text-center">
            <p className="text-text-muted text-xs">
              Nueva organizacion?{' '}
              <Link
                to="/register"
                className="text-accent-blue hover:underline"
              >
                Registrate aqui
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
