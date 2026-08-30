'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Clock, Mail, User } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import type { WaitlistEntry } from '@/services/waitlist'
import { useState } from 'react'

interface WaitlistStats {
  total: number
  notified: number
  pending: number
  byTicketType: Array<{ name: string; count: number }>
}

interface WaitlistManagementProps {
  eventId: string
  entries: WaitlistEntry[]
  stats: WaitlistStats | null
  onNotify: (eventId: string, ticketTypeId: string, availableSlots: number) => Promise<{ success: boolean; notifiedCount: number }>
}

export function WaitlistManagement({ eventId, entries, stats, onNotify }: WaitlistManagementProps) {
  const [notifying, setNotifying] = useState<string | null>(null)

  const handleNotify = async (ticketTypeId: string, count: number) => {
    setNotifying(ticketTypeId)
    try {
      const result = await onNotify(eventId, ticketTypeId, count)
      if (result.success) {
        alert(`Successfully notified ${result.notifiedCount} users`)
      }
    } catch (error) {
      console.error('[WaitlistManagement]:', error)
      alert('Failed to notify users')
    } finally {
      setNotifying(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Waitlist</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Users waiting</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Not yet notified</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notified</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notified}</div>
              <p className="text-xs text-muted-foreground">Awaiting purchase</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* By Ticket Type */}
      {stats && stats.byTicketType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Waitlist by Ticket Type</CardTitle>
            <CardDescription>Number of people waiting for each ticket type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byTicketType.map((type) => (
                <div key={type.name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-muted-foreground">{type.count} waiting</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={notifying !== null}
                    onClick={() => {
                      const entry = entries.find(e => e.ticket_type_name === type.name)
                      if (entry) {
                        const count = parseInt(prompt(`How many slots are available for ${type.name}?`) || '0')
                        if (count > 0) {
                          handleNotify(entry.ticket_type_id, count)
                        }
                      }
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Notify Next
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waitlist Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Queue</CardTitle>
          <CardDescription>Users waiting for tickets, ordered by position</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No one on the waitlist</div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg font-bold">
                      #{entry.waitlist_position}
                    </Badge>
                    <div>
                      <p className="font-medium">{entry.user_name}</p>
                      <p className="text-sm text-muted-foreground">{entry.user_email}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{entry.ticket_type_name}</span>
                        <span>Qty: {entry.quantity}</span>
                        <span>
                          Joined {formatDate(entry.created_at)} at {formatTime(entry.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {entry.notified_at && (
                    <Badge variant="secondary" className="gap-1">
                      <Bell className="h-3 w-3" />
                      Notified {formatDate(entry.notified_at)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
