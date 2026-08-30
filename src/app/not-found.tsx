import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}
        >
          Page not found
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginBottom: 28 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="button button-primary">
          Go home
        </Link>
      </div>
    </div>
  )
}
