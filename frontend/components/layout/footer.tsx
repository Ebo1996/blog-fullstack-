import Link from 'next/link'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)] mt-20">
      <div className="max-w-7xl mx-auto px-5 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2.5 font-bold text-[17px] mb-4">
              <span className="brand-mark text-sm">E</span>
              <span>eventify</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Ethiopia's premier event management and ticketing platform.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold mb-4 tracking-widest text-[var(--muted-foreground)]">DISCOVER</h3>
            <div className="flex flex-col gap-2.5">
              {[['Events', '/events'], ['Categories', '/categories'], ['Search', '/search']].map(([label, href]) => (
                <Link key={href} href={href} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold mb-4 tracking-widest text-[var(--muted-foreground)]">ORGANIZERS</h3>
            <div className="flex flex-col gap-2.5">
              {[['Create Event', '/organizer/events/new'], ['Dashboard', '/organizer'], ['Analytics', '/organizer/analytics']].map(([label, href]) => (
                <Link key={href} href={href} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold mb-4 tracking-widest text-[var(--muted-foreground)]">COMPANY</h3>
            <div className="flex flex-col gap-2.5">
              {[['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy']].map(([label, href]) => (
                <Link key={href} href={href} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)] pt-6 text-center">
          <p className="text-xs text-[var(--muted-foreground)]">© {year} Eventify Ethiopia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
