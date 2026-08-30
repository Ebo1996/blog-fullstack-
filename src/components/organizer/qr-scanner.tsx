'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff, RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'
import type { ScanResponse, ScanResult } from '@/types'

interface QRScannerProps {
  eventId: string
}

type ScanState = 'idle' | 'scanning' | 'processing' | 'result'

interface LastResult {
  response: ScanResponse
  scannedAt: Date
  rawToken: string
}

// Cooldown between scans to prevent rapid re-scanning the same QR (ms)
const SCAN_COOLDOWN_MS = 2500

export function QRScanner({ eventId }: QRScannerProps) {
  const scannerDivRef  = useRef<HTMLDivElement>(null)
  const scannerRef     = useRef<unknown>(null)
  const lastTokenRef   = useRef<string>('')
  const cooldownRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingRef  = useRef(false)

  const [scanState, setScanState]       = useState<ScanState>('idle')
  const [lastResult, setLastResult]     = useState<LastResult | null>(null)
  const [error, setError]               = useState<string | null>(null)
  const [scanCount, setScanCount]       = useState(0)
  const [cameraStarting, setCameraStarting] = useState(false)

  // ── Validate token against server ────────────────────────────────────────
  const validateToken = useCallback(async (token: string) => {
    if (processingRef.current) return
    if (token === lastTokenRef.current) return  // same QR — ignore
    processingRef.current = true
    lastTokenRef.current  = token
    setScanState('processing')

    try {
      const res  = await fetch('/api/tickets/validate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ qrToken: token, eventId }),
      })
      const data = await res.json() as ScanResponse

      setLastResult({ response: data, scannedAt: new Date(), rawToken: token })
      setScanState('result')
      if (data.success) setScanCount((n) => n + 1)

      // Resume scanning after cooldown
      cooldownRef.current = setTimeout(() => {
        lastTokenRef.current  = ''
        processingRef.current = false
        setScanState('scanning')
      }, SCAN_COOLDOWN_MS)
    } catch {
      setError('Network error — check your connection.')
      processingRef.current = false
      setScanState('scanning')
    }
  }, [eventId])

  // ── Start camera ─────────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    if (!scannerDivRef.current) return
    setCameraStarting(true)
    setError(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-scanner-div')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => { void validateToken(decodedText) },
        () => { /* ignore scan errors — they fire constantly */ },
      )

      setScanState('scanning')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera error'
      if (msg.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access and try again.')
      } else {
        setError(`Could not start camera: ${msg}`)
      }
      setScanState('idle')
    } finally {
      setCameraStarting(false)
    }
  }, [validateToken])

  // ── Stop camera ───────────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (cooldownRef.current) clearTimeout(cooldownRef.current)
    if (scannerRef.current) {
      try {
        const s = scannerRef.current as { stop: () => Promise<void>; clear: () => void }
        await s.stop()
        s.clear()
      } catch { /* ignore */ }
      scannerRef.current = null
    }
    processingRef.current = false
    lastTokenRef.current  = ''
    setScanState('idle')
    setLastResult(null)
  }, [])

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => { void stopScanner() }
  }, [stopScanner])

  const isActive = scanState === 'scanning' || scanState === 'processing' || scanState === 'result'

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* ── Scanner frame ─────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          background: '#000',
          aspectRatio: '1 / 1',
          marginBottom: 20,
        }}
      >
        {/* html5-qrcode mounts into this div */}
        <div
          id="qr-scanner-div"
          ref={scannerDivRef}
          style={{ width: '100%', height: '100%' }}
        />

        {/* Idle overlay */}
        {!isActive && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 16, background: '#111',
            }}
          >
            <span
              style={{
                display: 'grid', placeItems: 'center',
                width: 64, height: 64, borderRadius: 'var(--radius-lg)',
                background: 'rgba(124,106,245,0.15)', color: 'var(--organizer-accent)',
              }}
              aria-hidden="true"
            >
              <Camera size={30} />
            </span>
            <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>Camera not started</p>
          </div>
        )}

        {/* Processing overlay */}
        {scanState === 'processing' && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.7)',
            }}
            role="status"
            aria-label="Validating ticket"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: 'var(--organizer-accent)',
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p style={{ color: '#fff', fontSize: 13, margin: 0 }}>Validating…</p>
            </div>
          </div>
        )}

        {/* Viewfinder corners (decorative) */}
        {scanState === 'scanning' && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            {/* Four corner brackets */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
              <span
                key={corner}
                style={{
                  position: 'absolute',
                  width: 40, height: 40,
                  borderColor: 'var(--primary)',
                  borderStyle: 'solid',
                  borderWidth: 0,
                  ...(corner === 'tl' && { top: '22%', left: '22%', borderTopWidth: 3, borderLeftWidth: 3 }),
                  ...(corner === 'tr' && { top: '22%', right: '22%', borderTopWidth: 3, borderRightWidth: 3 }),
                  ...(corner === 'bl' && { bottom: '22%', left: '22%', borderBottomWidth: 3, borderLeftWidth: 3 }),
                  ...(corner === 'br' && { bottom: '22%', right: '22%', borderBottomWidth: 3, borderRightWidth: 3 }),
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Result card ───────────────────────────────────────── */}
      {lastResult && (
        <ScanResultCard result={lastResult} />
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </div>
      )}

      {/* ── Controls ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        {!isActive ? (
          <button
            className="button button-primary"
            style={{ flex: 1, gap: 8, fontSize: 14, minHeight: 46 }}
            onClick={() => void startScanner()}
            disabled={cameraStarting}
            aria-busy={cameraStarting}
          >
            <Camera size={17} aria-hidden="true" />
            {cameraStarting ? 'Starting camera…' : 'Start scanning'}
          </button>
        ) : (
          <>
            <button
              className="button button-outline"
              style={{ flex: 1, gap: 8 }}
              onClick={() => void stopScanner()}
            >
              <CameraOff size={15} aria-hidden="true" />
              Stop
            </button>
            <button
              className="button button-outline"
              style={{ gap: 8 }}
              onClick={() => {
                lastTokenRef.current  = ''
                processingRef.current = false
                setLastResult(null)
                setScanState('scanning')
              }}
              aria-label="Scan next ticket"
            >
              <RefreshCw size={15} aria-hidden="true" />
              Next
            </button>
          </>
        )}
      </div>

      {/* ── Session count ─────────────────────────────────────── */}
      {scanCount > 0 && (
        <p
          style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)', marginTop: 16 }}
          aria-live="polite"
        >
          {scanCount} attendee{scanCount !== 1 ? 's' : ''} checked in this session
        </p>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Result card ──────────────────────────────────────────────────────────────

const RESULT_CONFIG: Record<ScanResult, {
  icon: React.ReactNode
  label: string
  className: string
  color: string
}> = {
  valid: {
    icon: <CheckCircle size={28} />,
    label: 'Valid — check in!',
    className: 'scanner-result valid',
    color: 'var(--success)',
  },
  already_checked_in: {
    icon: <Clock size={28} />,
    label: 'Already checked in',
    className: 'scanner-result used',
    color: 'var(--warning)',
  },
  wrong_event: {
    icon: <XCircle size={28} />,
    label: 'Wrong event',
    className: 'scanner-result invalid',
    color: 'var(--error)',
  },
  invalid: {
    icon: <XCircle size={28} />,
    label: 'Invalid ticket',
    className: 'scanner-result invalid',
    color: 'var(--error)',
  },
  cancelled: {
    icon: <XCircle size={28} />,
    label: 'Ticket cancelled',
    className: 'scanner-result invalid',
    color: 'var(--error)',
  },
  expired: {
    icon: <XCircle size={28} />,
    label: 'Ticket expired',
    className: 'scanner-result invalid',
    color: 'var(--error)',
  },
  transferred: {
    icon: <XCircle size={28} />,
    label: 'Ticket transferred',
    className: 'scanner-result invalid',
    color: 'var(--error)',
  },
}

function ScanResultCard({ result }: { result: LastResult }) {
  const status = result.response.status as ScanResult
  const cfg    = RESULT_CONFIG[status] ?? RESULT_CONFIG['invalid']

  return (
    <div
      className={cfg.className}
      style={{ marginBottom: 16 }}
      role="status"
      aria-live="assertive"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0' }}>
        <span style={{ color: cfg.color }} aria-hidden="true">{cfg.icon}</span>
        <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: cfg.color }}>
          {cfg.label}
        </p>

        {result.response.attendeeName && (
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
            {result.response.attendeeName}
          </p>
        )}
        {result.response.ticketType && (
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
            {result.response.ticketType}
          </p>
        )}
        {status === 'already_checked_in' && result.response.checkedInAt && (
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
            Checked in at {new Date(result.response.checkedInAt).toLocaleTimeString()}
          </p>
        )}
        <p style={{ fontSize: 10, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
          {result.scannedAt.toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
