import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 md:px-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-foreground">Pairwise</span>
          <span className="text-sm text-muted-foreground">© 2026 Pairwise</span>
        </div>
        <Link
          href="/v/demo-q3-features"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Try demo
        </Link>
      </div>
    </footer>
  )
}
