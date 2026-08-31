'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { QrCode, ArrowLeft, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ticketsApi } from '@/lib/api/tickets'
import { formatDateTime } from '@/lib/utils'

type ScanResult =
  | { type: 'success'; attendeeName: string; ticketType: string; message: string }
  | { type: 'already_used'; checkedInAt: string; message: string }
  | { type: 'invalid'; message: string }
  | null

export default function QRScannerPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const [manualToken, setManualToken] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus the input for USB scanners that behave like keyboards
  useEffect(() => { inputRef.current?.focus() }, [])

  const handleScan = async (token: string) => {
    if (!token.trim() || scanning) return
    setScanning(true)
    setResult(null)
    try {
      const res = await ticketsApi.scan(token.trim(), eventId)
      const data = res.data
      setResult({
        type: 'success',
        attendeeName: data.attendeeName ?? data.ticket?.ownerId?.name ?? 'Attendee',
        ticketType: data.ticketTypeName ?? data.ticket?.ticketTypeName ?? 'Ticket',
        message: 'Checked in successfully',
      })
    } catch (err: any) {
      const msg: string = err?.message ?? 'Invalid ticket'
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('used')) {
        setResult({
          type: 'already_used',
          checkedInAt: err?.errors?.checkedInAt ?? '',
          message: msg,
        })
      } else {
        setResult({ type: 'invalid', message: msg })
      }
    } finally {
      setScanning(false)
      setManualToken('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleScan(manualToken)
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER · CHECK-IN</div>
          <h1>QR Scanner</h1>
        </div>
      </header>

      <div className="page-content max-w-lg">
        <Link href="/organizer/events" className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to events
        </Link>

        {/* Scanner input area */}
        <div className="panel text-center py-10 mb-6">
          <div className="w-16 h-16 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto mb-5">
            {scanning
              ? <Loader2 className="w-7 h-7 text-[var(--primary)] animate-spin" />
              : <QrCode className="w-7 h-7 text-[var(--primary)]" />
            }
          </div>
          <h2 className="font-semibold text-sm mb-2">Scan a QR ticket</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-6 max-w-xs mx-auto">
            Point a barcode scanner at the ticket QR code, or paste the token manually below.
          </p>

          {/* Manual / scanner input */}
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              ref={inputRef}
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scan or paste QR token…"
              className="input-field flex-1 text-sm font-mono"
              autoComplete="off"
              aria-label="QR token input"
            />
            <button
              onClick={() => handleScan(manualToken)}
              disabled={!manualToken.trim() || scanning}
              className="btn btn-primary"
            >
              Check in
            </button>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-3">
            Press <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] font-mono text-[10px]">Enter</kbd> or click Check in
          </p>
        </div>

        {/* Result display */}
        {result && (
          <div className={`scanner-result ${
            result.type === 'success' ? 'scanner-result-success' :
            result.type === 'already_used' ? 'scanner-result-used' :
            'scanner-result-invalid'
          }`}>
            {result.type === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--success)' }} />
                <p className="font-bold text-base mb-1" style={{ color: 'var(--success)' }}>✓ Valid ticket</p>
                <p className="font-semibold text-sm mb-1">{result.attendeeName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{result.ticketType}</p>
                <p className="text-xs mt-2 font-medium" style={{ color: 'var(--success)' }}>Checked in successfully</p>
              </>
            )}
            {result.type === 'already_used' && (
              <>
                <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: '#d8ae62' }} />
                <p className="font-bold text-base mb-1" style={{ color: '#d8ae62' }}>⚠ Ticket already used</p>
                <p className="text-xs text-[var(--muted-foreground)]">{result.message}</p>
                {result.checkedInAt && (
                  <p className="text-xs mt-1" style={{ color: '#d8ae62' }}>
                    Checked in at {formatDateTime(result.checkedInAt)}
                  </p>
                )}
              </>
            )}
            {result.type === 'invalid' && (
              <>
                <XCircle className="w-12 h-12 mx-auto mb-4 text-[var(--destructive)]" />
                <p className="font-bold text-base mb-1 text-[var(--destructive)]">✕ Invalid ticket</p>
                <p className="text-xs text-[var(--muted-foreground)]">{result.message}</p>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}
