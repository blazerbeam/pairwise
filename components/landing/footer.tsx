export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <svg
              className="h-4 w-4 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <span className="font-medium text-foreground">Pairwise</span>
        </div>

        {/* Copyright */}
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Pairwise. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
