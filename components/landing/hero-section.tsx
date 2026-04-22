"use client"

import { useState, useTransition } from "react"
import { joinWaitlist } from "@/app/actions"

export function HeroSection() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const result = await joinWaitlist(email)
      if (result.success) {
        setMessage({ type: "success", text: "You're on the list! We'll be in touch soon." })
        setEmail("")
      } else {
        setMessage({ type: "error", text: result.error || "Something went wrong" })
      }
    })
  }

  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-6 py-24">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" />
      
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        {/* Logo/Brand */}
        <div className="mb-8 inline-flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg
              className="h-5 w-5 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-foreground">Pairwise</span>
        </div>

        {/* Headline */}
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Prioritize anything,
          <br />
          <span className="text-primary">one choice at a time</span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
          Stop debating endless lists. Pairwise asks simple A-or-B questions, 
          then computes a ranked priority from your team&apos;s votes.
        </p>

        {/* Waitlist form */}
        <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={isPending}
            className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? "Joining..." : "Join waitlist"}
          </button>
        </form>

        {/* Message */}
        {message && (
          <p
            className={`mt-4 text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-500"
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Social proof hint */}
        <p className="mt-8 text-sm text-muted-foreground">
          Early access coming soon. No spam, ever.
        </p>
      </div>
    </section>
  )
}
