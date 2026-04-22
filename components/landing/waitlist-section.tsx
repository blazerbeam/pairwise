"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { joinWaitlist } from "@/app/actions"

export function WaitlistSection() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const result = await joinWaitlist(email, "homepage")
      if (result.success) {
        setStatus("success")
      } else {
        setStatus("error")
        setErrorMessage(result.error || "Something went wrong")
      }
    })
  }

  return (
    <section id="waitlist" className="bg-muted/50 px-6 py-20 md:px-12">
      <div className="mx-auto max-w-md text-center">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
          Pairwise is in early access
        </h2>
        <p className="mt-3 text-muted-foreground">
          Add your email and we&apos;ll be in touch when we open it up.
        </p>

        {status === "success" ? (
          <div className="mt-8">
            <p className="text-lg font-medium text-foreground">
              Thanks! You&apos;re on the list.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-12 flex-1 rounded-lg border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                disabled={isPending}
                className="h-12 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {isPending ? "..." : "Notify me"}
              </button>
            </div>
            {status === "error" && (
              <p className="mt-3 text-sm text-destructive">{errorMessage}</p>
            )}
          </form>
        )}

        <p className="mt-6 text-sm text-muted-foreground">
          Or{" "}
          <Link
            href="/v/demo-q3-features"
            className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary"
          >
            try the demo →
          </Link>
        </p>
      </div>
    </section>
  )
}
