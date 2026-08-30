import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { RefundDetails } from '@/services/refunds'

interface RefundHistoryProps {
  refunds: RefundDetails[]
  currency: string
}

const STATUS_CONFIG = {
  pending: {
    icon: <Clock size={14} />,
    badge: <Badge variant="warning">Pending</Badge>,
    color: 'var(--warning)',
  },
  succeeded: {
    icon: <CheckCircle size={14} />,
    badge: <Badge variant="success">Succeeded</Badge>,
    color: 'var(--success)',
  },
  failed: {
    icon: <XCircle size={14} />,
    badge: <Badge variant="error">Failed</Badge>,
    color: 'var(--error)',
  },
}

export function RefundHistory({ refunds, currency }: RefundHistoryProps) {
  if (refunds.length === 0) {
    return (
      <EmptyState
        icon={<DollarSign size={20} />}
        title="No refunds"
        description="Refund history will appear here when refunds are issued."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {refunds.map((refund) => {
        const config = STATUS_CONFIG[refund.status]
        return (
          <div
            key={refund.id}
            className="panel"
            style={{ padding: '14px 18px' }}
          >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* Icon */}
              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: refund.status === 'succeeded' ? 'var(--success-bg)' : 'var(--muted)',
                  color: config.color,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {config.icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 6 }}>
                  <div>
                    <strong style={{ fontSize: 16, fontWeight: 700, display: 'block', marginBottom: 2 }}>
                      {formatCurrency(refund.amount, currency)}
                    </strong>
                    <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                      {formatDate(refund.created_at, 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                  {config.badge}
                </div>

                {refund.reason && (
                  <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '8px 0 0', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--foreground)' }}>Reason:</strong> {refund.reason}
                  </p>
                )}

                {refund.stripe_refund_id && (
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '6px 0 0', fontFamily: 'var(--font-mono)' }}>
                    Chapa Ref: {refund.stripe_refund_id}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Total refunded */}
      <div
        style={{
          borderTop: '2px solid var(--border)',
          paddingTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong style={{ fontSize: 14 }}>Total refunded</strong>
        <strong style={{ fontSize: 18, fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
          {formatCurrency(
            refunds
              .filter((r) => r.status === 'succeeded')
              .reduce((sum, r) => sum + r.amount, 0),
            currency,
          )}
        </strong>
      </div>
    </div>
  )
}
