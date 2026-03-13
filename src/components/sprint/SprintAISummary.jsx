import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, Clock, AlertCircle, AlertTriangle, Settings, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import sprintService from '../../services/sprintService'

const GEMINI_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
]

const MAX_CHARS_OPTIONS = [
  { value: 500, label: '500' },
  { value: 1000, label: '1,000' },
  { value: 2000, label: '2,000' },
  { value: 3000, label: '3,000' },
  { value: 5000, label: '5,000' },
]

export function SprintAISummary({ sprintId, aiSummary: initialSummary, canGenerate = true }) {
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  // Per-sprint settings (initialized from existing summary or defaults)
  const [model, setModel] = useState(initialSummary?.generation_model || 'gemini-2.0-flash')
  const [maxChars, setMaxChars] = useState(initialSummary?.max_chars || 2000)

  // Sync with parent prop
  useEffect(() => {
    setSummary(initialSummary)
    if (initialSummary?.generation_model) setModel(initialSummary.generation_model)
    if (initialSummary?.max_chars) setMaxChars(initialSummary.max_chars)
  }, [initialSummary])

  const handleRegenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setWarning(null)
    try {
      const data = await sprintService.regenerateAISummary(sprintId, {
        model,
        max_chars: maxChars,
      })
      if (data.debounced) {
        setWarning('El resumen fue generado recientemente. Intenta de nuevo en unos minutos.')
        setSummary(data)
      } else {
        setSummary(data)
      }
    } catch (err) {
      if (err.status === 400 && err.message?.toLowerCase().includes('not configured')) {
        setError('No hay token de Gemini configurado. Configuralo en Ajustes de Organizacion.')
      } else if (err.status === 429) {
        setWarning('Ya se esta generando un resumen. Espera unos segundos.')
      } else {
        setError(err.message || 'Error al generar el resumen')
      }
    } finally {
      setLoading(false)
    }
  }, [sprintId, model, maxChars])

  const hasSummary = summary?.summary_text
  const isGenerating = summary?.is_generating || loading
  const generatedAt = summary?.generated_at
    ? formatDistanceToNow(new Date(summary.generated_at), { addSuffix: true, locale: es })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border-primary bg-bg-secondary overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-primary bg-bg-elevated/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-text-primary">Resumen AI</h3>
          {generatedAt && (
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock className="w-3 h-3" />
              {generatedAt}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canGenerate && (
            <>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors',
                  showSettings
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
                )}
              >
                <Settings className="w-3 h-3" />
                <ChevronDown className={clsx('w-2.5 h-2.5 transition-transform', showSettings && 'rotate-180')} />
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRegenerate}
                disabled={isGenerating}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                  isGenerating
                    ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
                    : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                )}
              >
                <RefreshCw className={clsx('w-3 h-3', isGenerating && 'animate-spin')} />
                {hasSummary ? 'Regenerar' : 'Generar'}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && canGenerate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border-primary bg-bg-elevated/30 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider whitespace-nowrap">Modelo</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-border-primary bg-bg-elevated text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-all"
                >
                  {GEMINI_MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-text-muted font-medium uppercase tracking-wider whitespace-nowrap">Max caracteres</label>
                <select
                  value={maxChars}
                  onChange={e => setMaxChars(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-border-primary bg-bg-elevated text-xs text-text-primary focus:outline-none focus:border-accent-blue transition-all"
                >
                  {MAX_CHARS_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {summary?.generation_model && summary.generation_model !== model && (
                <span className="text-[10px] text-text-muted italic">
                  Ultimo: {summary.generation_model}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-4">
        {/* Error (red) */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-rejected/10 border border-status-rejected/20 mb-3">
            <AlertCircle className="w-4 h-4 text-status-rejected shrink-0 mt-0.5" />
            <div className="text-xs text-status-rejected">
              <p>{error}</p>
              {error.includes('Gemini') && (
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-1 mt-1 underline hover:no-underline"
                >
                  <Settings className="w-3 h-3" />
                  Ir a Configuracion
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Warning (yellow/amber) */}
        {warning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">{warning}</p>
          </div>
        )}

        {isGenerating && !hasSummary ? (
          <div className="flex items-center gap-3 py-6 justify-center">
            <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text-muted">Generando resumen con AI...</span>
          </div>
        ) : hasSummary ? (
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {summary.summary_text}
          </div>
        ) : (
          <div className="text-center py-4">
            <Sparkles className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm text-text-muted">
              Sin resumen generado aun.
            </p>
            <p className="text-xs text-text-muted mt-1">
              {canGenerate ? 'Genera uno con el boton de arriba.' : 'Solo los administradores pueden generar resumenes.'}
            </p>
          </div>
        )}

        {summary?.error_message && !error && (
          <div className="mt-3 p-2 rounded-lg bg-status-in-review/10 border border-status-in-review/20">
            <p className="text-xs text-status-in-review">
              Ultimo error: {summary.error_message}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
