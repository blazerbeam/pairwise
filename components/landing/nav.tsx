import Link from "next/link"

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 md:px-12">
      <Link href="/" className="text-lg font-semibold text-foreground">
        Pairwise
      </Link>
      <Link 
        href="/login" 
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign in
      </Link>
    </nav>
  )
}
