import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, CheckCircle2, XCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../hooks'

export function AcceptInvitationPage() {
  const { token: inviteToken } = useParams()
  const navigate = useNavigate()
  const { acceptInvitation } = useAuth()

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleGoogleSuccess = async (credentialResponse) => {
    const googleToken = credentialResponse.credential
    if (!googleToken) {
      setError('No se recibio token de Google')
      return
    }

    setError('')
    setLoading(true)
    try {
      await acceptInvitation(googleToken, inviteToken)
      setSuccess(true)
      setTimeout(() => navigate('/', { replace: true }), 2000)
    } catch (err) {
      setError(err.message || 'Error al aceptar la invitacion')
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
          <p className="text-text-secondary mt-1">Aceptar Invitacion</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border-primary bg-bg-secondary p-6 space-y-5"
        >
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <CheckCircle2 className="w-16 h-16 text-status-approved" />
              <div className="text-center">
                <h2 className="text-lg font-semibold text-text-primary">Invitacion aceptada</h2>
                <p className="text-sm text-text-secondary mt-1">Redirigiendo al dashboard...</p>
              </div>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 text-status-rejected text-sm flex items-start gap-2"
                >
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="flex flex-col items-center gap-2">
                <Mail className="w-10 h-10 text-accent-blue" />
                <p className="text-sm text-text-secondary text-center">
                  Has sido invitado a unirte a una organizacion.
                  Inicia sesion con Google para aceptar.
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
                    <span className="text-text-secondary text-sm">Aceptando invitacion...</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Error al conectar con Google')}
                    theme="filled_black"
                    size="large"
                    width="320"
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              )}
            </>
          )}

          <div className="pt-2 border-t border-border-primary text-center">
            <p className="text-text-muted text-xs">
              <Link to="/login" className="text-accent-blue hover:underline">
                Ir al inicio de sesion
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
