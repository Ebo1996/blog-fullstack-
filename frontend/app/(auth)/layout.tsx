import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-base tracking-tight w-fit">
          <span className="brand-mark text-sm">E</span>
          <span>eventify</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
      <footer className="text-center text-xs text-[var(--muted-foreground)] py-5 border-t border-[var(--border)]">
        © {new Date().getFullYear()} Eventify Ethiopia. All rights reserved.
      </footer>
    </div>
  )
}
