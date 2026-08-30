'use client'

import { QRCodeSVG } from 'qrcode.react'

interface TicketQRCodeProps {
  token: string
  size?: number
}

// The QR code encodes only the opaque qr_token — never any PII or ticket details.
// The server resolves token → ticket → event during check-in.
export function TicketQRCode({ token, size = 145 }: TicketQRCodeProps) {
  return (
    <div className="qr-pattern" role="img" aria-label="Ticket QR code — scan at entry">
      <QRCodeSVG
        value={token}
        size={size}
        bgColor="#ffffff"
        fgColor="#151512"
        level="H"          // High error correction so it scans even if slightly obscured
        includeMargin={false}
      />
    </div>
  )
}
