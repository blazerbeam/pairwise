import Link from "next/link"

export function HeroSection() {
  return (
    <section className="px-6 pb-24 pt-16 md:px-12 md:pt-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
          Stop debating. Start prioritizing.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Pairwise turns &quot;everyone has an opinion&quot; into &quot;here&apos;s what we agreed on&quot; by asking your team to decide one comparison at a time.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/v/demo-q3-features"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Try the demo
          </Link>
          <Link
            href="#waitlist"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-background px-8 text-sm font-medium text-foreground transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Request early access
          </Link>
        </div>
      </div>
    </section>
  )
}
