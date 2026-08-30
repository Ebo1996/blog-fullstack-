'use client'

import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatTime } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface WaitlistEntryData {
  id: string
  quantity: number
  waitlist_position: number
  notified_at: string | null
  created_at: string
  event: {
    id: string
    title: string
    slug: string
    start_time: string
    location: string
    image_url: string | null
  }
  ticket_type: {
    id: string
    name: string
    price: number
  }
}

interface WaitlistEntriesProps {
  entries: WaitlistEntryData[]
  onRemove: (id: string) => Promise<void>
}

export function WaitlistEntries({ entries, onRemove }: WaitlistEntriesProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Waitlist Entries</h3>
        <p className="text-muted-foreground">
          You&apos;re not on any event waitlists. Browse events to join a waitlist when tickets are sold out.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              {/* Event Image */}
              <Link href={`/events/${entry.event.slug}`} className="flex-shrink-0">
                <div className="relative w-32 h-24 rounded-lg overflow-hidden">
                  <Image
                    src={entry.event.image_url || '/placeholder.svg'}
                    alt={entry.event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/events/${entry.event.slug}`}
                      className="font-semibold text-lg hover:underline line-clamp-1"
                    >
                      {entry.event.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(entry.event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(entry.event.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{entry.event.location}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(entry.id)}
                    title="Remove from waitlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Waitlist Info */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-sm">
                    <span className="font-medium">Position:</span>
                    <span className="font-bold">#{entry.waitlist_position}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-sm">
                    <span className="font-medium">Ticket Type:</span>
                    <span>{entry.ticket_type.name}</span>
                  </div>

                  <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-sm">
                    <span className="font-medium">Quantity:</span>
                    <span>{entry.quantity}</span>
                  </div>

                  {entry.notified_at && (
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/20 text-green-900 dark:text-green-100 px-3 py-1.5 rounded-md text-sm font-medium">
                      ✓ Tickets Available - Check your notifications
                    </div>
                  )}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                  Joined {formatDate(entry.created_at)} at {formatTime(entry.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
