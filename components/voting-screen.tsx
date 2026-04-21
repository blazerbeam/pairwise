"use client"

import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"

// Sample data - 5 items create 10 unique pairs
const ITEMS = [
  { id: 1, name: "Slack integration", description: "Connect Pairwise with Slack for seamless team collaboration and notifications." },
  { id: 2, name: "Mobile reviews", description: "Enable reviewing and voting on comparisons directly from mobile devices." },
  { id: 3, name: "SSO support", description: "Single sign-on integration for enterprise security and convenience." },
  { id: 4, name: "API rate limits dashboard", description: "Monitor and manage API usage with a dedicated analytics dashboard." },
  { id: 5, name: "Bulk export to CSV", description: "Export all comparison results and rankings to CSV format." },
]

const QUESTION = "Which initiative should we prioritize first?"

// Generate all unique pairs from items
function generatePairs<T extends { id: number }>(items: T[]): [T, T][] {
  const pairs: [T, T][] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]])
    }
  }
  return pairs
}

const ALL_PAIRS = generatePairs(ITEMS)

interface OptionCardProps {
  name: string
  description: string
  onSelect: () => void
}

function OptionCard({ name, description, onSelect }: OptionCardProps) {
  const [showDescription, setShowDescription] = useState(false)

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex min-h-[180px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-sm transition-all duration-200",
        "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
        "active:scale-[0.98] active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "md:min-h-[280px]"
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-xl font-medium leading-tight text-card-foreground md:text-2xl text-balance">
          {name}
        </span>
        
        {/* Inline description with smooth expansion */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            showDescription ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Description toggle */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation()
          setShowDescription(!showDescription)
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation()
            setShowDescription(!showDescription)
          }
        }}
        className="absolute bottom-4 right-4 text-xs text-muted-foreground transition-colors hover:text-primary"
      >
        {showDescription ? "Hide description" : "See description"}
      </span>
    </button>
  )
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = Math.round((current / total) * 100)
  
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
        {percentage}% complete
      </span>
    </div>
  )
}

function OrBadge() {
  return (
    <div className="z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-lg md:h-16 md:w-16 md:text-base">
      OR
    </div>
  )
}

function CompletionScreen({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Thanks, you&apos;re done!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground underline">
          Results dashboard coming next.
        </p>
        <button
          onClick={onReset}
          className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Start over
        </button>
      </div>
    </div>
  )
}

export function VotingScreen() {
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [votes, setVotes] = useState<Map<string, number>>(new Map())

  const isComplete = currentPairIndex >= ALL_PAIRS.length
  const currentPair = ALL_PAIRS[currentPairIndex]

  const handleVote = useCallback((winnerId: number) => {
    setVotes((prev) => {
      const newVotes = new Map(prev)
      newVotes.set(String(winnerId), (newVotes.get(String(winnerId)) || 0) + 1)
      return newVotes
    })
    setCurrentPairIndex((prev) => prev + 1)
  }, [])

  const handleReset = useCallback(() => {
    setCurrentPairIndex(0)
    setVotes(new Map())
  }, [])

  if (isComplete) {
    return <CompletionScreen onReset={handleReset} />
  }

  const [optionA, optionB] = currentPair

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-20 bg-background/95 px-6 pb-4 pt-6 backdrop-blur-sm">
        <ProgressBar current={currentPairIndex} total={ALL_PAIRS.length} />
      </div>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-8 md:px-12">
        {/* Question */}
        <h1 className="mb-12 max-w-2xl text-center text-2xl font-semibold leading-snug text-foreground md:mb-16 md:text-3xl lg:text-4xl text-balance">
          {QUESTION}
        </h1>

        {/* Cards container */}
        <div className="relative flex w-full max-w-4xl flex-col items-center md:flex-row md:items-stretch md:gap-8">
          {/* Option A */}
          <div className="flex w-full md:flex-1">
            <OptionCard
              name={optionA.name}
              description={optionA.description}
              onSelect={() => handleVote(optionA.id)}
            />
          </div>

          {/* OR Badge - sits in the seam between stacked cards on mobile, between side-by-side cards on desktop */}
          <div className="z-10 -my-7 flex shrink-0 items-center justify-center md:my-0 md:self-start md:mt-[132px]">
            <OrBadge />
          </div>

          {/* Option B */}
          <div className="flex w-full md:flex-1">
            <OptionCard
              name={optionB.name}
              description={optionB.description}
              onSelect={() => handleVote(optionB.id)}
            />
          </div>
        </div>

        {/* Pair counter */}
        <p className="mt-10 text-sm text-muted-foreground">
          {currentPairIndex + 1} of {ALL_PAIRS.length} comparisons
        </p>
      </main>
    </div>
  )
}
