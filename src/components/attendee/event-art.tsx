// Deterministic color + initials artwork — matches prototype exactly

const ART_COLORS = [
  'event-violet', // #4b455f
  'event-amber',  // #735c35
  'event-teal',   // #3e6460
  'event-rose',   // #6b3a3a
  'event-indigo', // #2e3860
  'event-sage',   // #3a5e45
]

export function getEventArtColor(seed: string): string {
  const sum = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return ART_COLORS[sum % ART_COLORS.length] ?? 'event-violet'
}

export function getEventInitials(title: string): string {
  return title
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => (w[0] ?? '').toUpperCase())
    .join('')
}

interface EventArtProps {
  title: string
  id: string
  small?: boolean
}

export function EventArt({ title, id, small = false }: EventArtProps) {
  const color = getEventArtColor(id)
  const initials = getEventInitials(title)
  return (
    <div
      className={`event-art ${color}${small ? ' event-art-small' : ''}`}
      aria-hidden="true"
    >
      <span>{initials}</span>
    </div>
  )
}
