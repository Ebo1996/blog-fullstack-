'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface JoinWaitlistButtonProps {
  eventId: string
  ticketTypeId: string
  ticketTypeName: string
  quantity?: number
  onJoin?: () => Promise<void>
}

export function JoinWaitlistButton({
  eventId: _eventId,
  ticketTypeId: _ticketTypeId,
  ticketTypeName: _ticketTypeName,
  quantity: _quantity = 1,
  onJoin,
}: JoinWaitlistButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleJoin = async () => {
    if (!onJoin) return

    setIsLoading(true)
    try {
      await onJoin()
      router.push('/dashboard/waitlist')
    } catch (error) {
      console.error('[JoinWaitlistButton]:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={isLoading || !onJoin}
      variant="outline"
      className="w-full"
    >
      <Clock className="mr-2 h-4 w-4" />
      {isLoading ? 'Joining...' : 'Join Waitlist'}
    </Button>
  )
}
