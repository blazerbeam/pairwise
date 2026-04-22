"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Item {
  id: string
  pairwise_id: string
  name: string
  description: string | null
  position: number
}

interface Pairwise {
  id: string
  name: string
  description: string | null
  share_token: string
  show_results_to_voters: boolean
}

interface Question {
  id: string | null
  text: string
  axis_label: string
}

interface Pair {
  itemA: Item
  itemB: Item
}

interface VotingClientProps {
  pairwise: Pairwise
  items: Item[]
  question: Question
}

// Generate round-robin pairs from items
function generatePairs(items: Item[]): Pair[] {
  const pairs: Pair[] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push({ itemA: items[i], itemB: items[j] })
    }
  }
  // Shuffle pairs for variety
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

export function VotingClient({ pairwise, items, question }: VotingClientProps) {
  const [pairs] = useState<Pair[]>(() => generatePairs(items))
  const [currentPairIndex, setCurrentPairIndex] = useState(0)
  const [voterId, setVoterId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createClient()

  // Create or get voter on mount
  useEffect(() => {
    async function initVoter() {
      // Check localStorage for existing voter ID for this pairwise
      const storageKey = `pairwise_voter_${pairwise.id}`
      const existingVoterId = localStorage.getItem(storageKey)

      if (existingVoterId) {
        setVoterId(existingVoterId)
        
        // Check how many votes this voter has already cast
        const { count } = await supabase
          .from("votes")
          .select("*", { count: "exact", head: true })
          .eq("voter_id", existingVoterId)

        if (count && count > 0) {
          // Resume from where they left off
          setCurrentPairIndex(Math.min(count, pairs.length))
        }
        return
      }

      // Create new voter
      const { data: voter, error } = await supabase
        .from("voters")
        .insert({ pairwise_id: pairwise.id })
        .select()
        .single()

      if (!error && voter) {
        setVoterId(voter.id)
        localStorage.setItem(storageKey, voter.id)
      }
    }

    initVoter()
  }, [pairwise.id, supabase, pairs.length])

  const isComplete = currentPairIndex >= pairs.length
  const currentPair = pairs[currentPairIndex]

  const handleVote = useCallback(
    async (winnerId: string, loserId: string) => {
      if (!voterId || isSubmitting) return

      setIsSubmitting(true)

      try {
        const { error } = await supabase.from("votes").insert({
          voter_id: voterId,
          pairwise_id: pairwise.id,
          question_id: question.id,
          winner_item_id: winnerId,
          loser_item_id: loserId,
        })

        if (error) {
          console.error("[v0] Vote error:", error)
        }

        setCurrentPairIndex((prev) => prev + 1)
      } catch (err) {
        console.error("[v0] Vote submission error:", err)
      } finally {
        setIsSubmitting(false)
      }
    },
    [voterId, isSubmitting, supabase, pairwise.id, question.id]
  )

  if (isComplete) {
    return <CompletionScreen pairwiseName={pairwise.name} />
  }

  if (!currentPair || !voterId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const { itemA, itemB } = currentPair

  return (
    <div className="flex min-h-screen flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-20 bg-background/95 px-6 pb-4 pt-6 backdrop-blur-sm">
        <ProgressBar current={currentPairIndex} total={pairs.length} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        {/* Question */}
        <h1 className="mb-8 text-center text-2xl font-semibold text-foreground md:text-3xl text-balance">
          {question.text}
        </h1>

        {/* Cards container */}
        <div className="relative flex w-full max-w-4xl flex-col items-center md:flex-row md:items-stretch md:gap-8">
          {/* Option A */}
          <div className="flex w-full md:flex-1">
            <OptionCard
              name={itemA.name}
              description={itemA.description || ""}
              onSelect={() => handleVote(itemA.id, itemB.id)}
              disabled={isSubmitting}
            />
          </div>

          {/* OR Badge */}
          <div className="z-10 -my-7 flex shrink-0 items-center justify-center md:my-0 md:self-start md:mt-[132px]">
            <OrBadge />
          </div>

          {/* Option B */}
          <div className="flex w-full md:flex-1">
            <OptionCard
              name={itemB.name}
              description={itemB.description || ""}
              onSelect={() => handleVote(itemB.id, itemA.id)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
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

interface OptionCardProps {
  name: string
  description: string
  onSelect: () => void
  disabled?: boolean
}

function OptionCard({ name, description, onSelect, disabled }: OptionCardProps) {
  const [showDescription, setShowDescription] = useState(false)

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "group relative flex min-h-[180px] w-full flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center shadow-sm transition-all duration-200",
        "hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
        "active:scale-[0.98] active:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "md:min-h-[280px]",
        disabled && "pointer-events-none opacity-70"
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-xl font-medium leading-tight text-card-foreground md:text-2xl text-balance">
          {name}
        </span>

        {/* Inline description with smooth expansion */}
        {description && (
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
        )}
      </div>

      {/* Description toggle */}
      {description && (
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
      )}
    </button>
  )
}

function OrBadge() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md">
      OR
    </div>
  )
}

function CompletionScreen({ pairwiseName }: { pairwiseName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Thanks, you&apos;re done!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your votes for <span className="font-medium text-foreground">{pairwiseName}</span> have been recorded.
        </p>
        <p className="mt-2 text-lg text-muted-foreground underline">
          Results dashboard coming next.
        </p>
      </div>
    </div>
  )
}
