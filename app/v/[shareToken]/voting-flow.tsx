"use client"

import { useState, useCallback, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createVoter, submitVote } from "./actions"
import { cn } from "@/lib/utils"

interface Pairwise {
  id: string
  name: string
  share_token: string
}

interface Audience {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  description: string | null
}

interface Question {
  id: string
  text: string
  axis_label: string | null
  position: number
}

interface Voter {
  id: string
  pairwise_id: string
  audience_id: string
}

interface Vote {
  question_id: string
  item_a_id: string
  item_b_id: string
}

interface Pair {
  itemA: Item
  itemB: Item
}

interface VotingFlowProps {
  pairwise: Pairwise
  audiences: Audience[]
  items: Item[]
  existingVoter: Voter | null
  existingQuestions: Question[]
  existingProgress: Vote[]
}

// Generate all unique pairs from items
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

// Check if a pair has been voted on
function isPairVoted(pair: Pair, questionId: string, votes: Vote[]): boolean {
  return votes.some(
    (v) =>
      v.question_id === questionId &&
      ((v.item_a_id === pair.itemA.id && v.item_b_id === pair.itemB.id) ||
        (v.item_a_id === pair.itemB.id && v.item_b_id === pair.itemA.id))
  )
}

export function VotingFlow({
  pairwise,
  audiences,
  items,
  existingVoter,
  existingQuestions,
  existingProgress,
}: VotingFlowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // State - sync with props when they change (after router.refresh())
  const [voter, setVoter] = useState<Voter | null>(existingVoter)
  const [questions, setQuestions] = useState<Question[]>(existingQuestions)
  const [votes, setVotes] = useState<Vote[]>(existingProgress)
  const [selectedAudience, setSelectedAudience] = useState<string | null>(null)
  const [isCreatingVoter, setIsCreatingVoter] = useState(false)

  // Sync state with props when they change (e.g., after router.refresh())
  // Always sync voter - if null from server, set null; if exists, set it
  useEffect(() => {
    console.log("[v0] useEffect: existingVoter changed", existingVoter?.id)
    setVoter(existingVoter)
    if (existingVoter) {
      setIsCreatingVoter(false) // Voter loaded from server, stop loading
    }
  }, [existingVoter])

  // Always sync questions from props
  useEffect(() => {
    console.log("[v0] useEffect: existingQuestions changed, length:", existingQuestions.length)
    setQuestions(existingQuestions)
  }, [existingQuestions])

  // Always sync votes from props
  useEffect(() => {
    console.log("[v0] useEffect: existingProgress changed, length:", existingProgress.length)
    setVotes(existingProgress)
  }, [existingProgress])

  // Generate all pairs from items
  const [allPairs] = useState(() => generatePairs(items))

  // Find the current question and pair to vote on
  const findCurrentPosition = useCallback(() => {
    for (const question of questions) {
      for (const pair of allPairs) {
        if (!isPairVoted(pair, question.id, votes)) {
          return { question, pair }
        }
      }
    }
    return null // All done
  }, [questions, allPairs, votes])

  const currentPosition = findCurrentPosition()
  const totalVotesNeeded = questions.length * allPairs.length
  const votesCompleted = votes.length
  const progress = totalVotesNeeded > 0 ? Math.round((votesCompleted / totalVotesNeeded) * 100) : 0

  // Debug logging
  console.log("[v0] VotingFlow state:", {
    hasVoter: !!voter,
    voterId: voter?.id,
    questionsCount: questions.length,
    questionsFromProps: existingQuestions.length,
    itemsCount: items.length,
    pairsCount: allPairs.length,
    votesCount: votes.length,
    currentPosition: currentPosition ? { questionId: currentPosition.question.id } : null,
  })

  // Handle audience selection and voter creation
  const handleAudienceSelect = (audienceId: string) => {
    setSelectedAudience(audienceId)
  }

  const handleStartVoting = () => {
    if (!selectedAudience) return

    setIsCreatingVoter(true)
    startTransition(async () => {
      try {
        const result = await createVoter(pairwise.id, selectedAudience)
        // Set voter and questions directly from server action response
        // This avoids timing issues with cookie/refresh
        console.log("[v0] handleStartVoting: got result", { 
          voterId: result.voter.id, 
          questionsCount: result.questions.length 
        })
        setVoter(result.voter)
        setQuestions(result.questions)
        setIsCreatingVoter(false)
      } catch (error) {
        console.error("Failed to start voting:", error)
        setIsCreatingVoter(false)
      }
    })
  }

  // Handle vote submission
  const handleVote = (winnerId: string) => {
    if (!voter || !currentPosition) return

    const { question, pair } = currentPosition

    startTransition(async () => {
      try {
        await submitVote(voter.id, question.id, pair.itemA.id, pair.itemB.id, winnerId)
        setVotes((prev) => [
          ...prev,
          { question_id: question.id, item_a_id: pair.itemA.id, item_b_id: pair.itemB.id },
        ])
      } catch (error) {
        console.error("Failed to submit vote:", error)
      }
    })
  }

  // Show audience picker if no voter yet (or still creating)
  if (!voter || isCreatingVoter) {
    return (
      <AudiencePicker
        pairwiseName={pairwise.name}
        audiences={audiences}
        selectedAudience={selectedAudience}
        onSelect={handleAudienceSelect}
        onStart={handleStartVoting}
        isPending={isPending || isCreatingVoter}
      />
    )
  }

  // Show error state if no items exist
  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">No items to compare</h2>
          <p className="mt-2 text-muted-foreground">This pairwise has no items configured yet.</p>
        </div>
      </div>
    )
  }

  // Show error state if no questions exist for this audience
  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground">No questions found</h2>
          <p className="mt-2 text-muted-foreground">No questions are configured for your team.</p>
        </div>
      </div>
    )
  }

  // Show completion screen if all votes are in
  if (!currentPosition) {
    return <CompletionScreen pairwiseName={pairwise.name} />
  }

  // Show voting interface
  return (
    <VotingInterface
      question={currentPosition.question}
      pair={currentPosition.pair}
      onVote={handleVote}
      progress={progress}
      isPending={isPending}
    />
  )
}

// Audience Picker Component
function AudiencePicker({
  pairwiseName,
  audiences,
  selectedAudience,
  onSelect,
  onStart,
  isPending,
}: {
  pairwiseName: string
  audiences: Audience[]
  selectedAudience: string | null
  onSelect: (id: string) => void
  onStart: () => void
  isPending: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-semibold text-foreground md:text-3xl text-balance">
          {pairwiseName}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Select your team to get started
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {audiences.map((audience) => (
            <button
              key={audience.id}
              onClick={() => onSelect(audience.id)}
              className={cn(
                "rounded-lg border px-6 py-4 text-left transition-all",
                "hover:border-primary/40 hover:shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selectedAudience === audience.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card"
              )}
            >
              <span className="text-base font-medium text-card-foreground">
                {audience.name}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onStart}
          disabled={!selectedAudience || isPending}
          className={cn(
            "mt-8 w-full rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all",
            "hover:bg-primary/90 hover:shadow-md",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          {isPending ? "Starting..." : "Start voting"}
        </button>
      </div>
    </div>
  )
}

// Voting Interface Component
function VotingInterface({
  question,
  pair,
  onVote,
  progress,
  isPending,
}: {
  question: Question
  pair: Pair
  onVote: (winnerId: string) => void
  progress: number
  isPending: boolean
}) {
  const [expandedA, setExpandedA] = useState(false)
  const [expandedB, setExpandedB] = useState(false)

  // Reset expanded state when pair changes
  useEffect(() => {
    setExpandedA(false)
    setExpandedB(false)
  }, [pair.itemA.id, pair.itemB.id])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-20 bg-background/95 px-6 pb-4 pt-6 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="relative h-2 w-full max-w-md overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {progress}% complete
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        {/* Question text */}
        <h2 className="mb-8 max-w-2xl text-center text-xl font-medium text-foreground md:text-2xl text-balance">
          {question.text}
        </h2>

        {/* Cards container */}
        <div className="relative flex w-full max-w-4xl flex-col items-center md:flex-row md:items-stretch md:gap-8">
          {/* Option A */}
          <div className="flex w-full md:flex-1">
            <OptionCard
              item={pair.itemA}
              onSelect={() => onVote(pair.itemA.id)}
              expanded={expandedA}
              onToggleExpand={() => setExpandedA(!expandedA)}
              disabled={isPending}
            />
          </div>

          {/* OR Badge */}
          <div className="z-10 -my-7 flex shrink-0 items-center justify-center md:my-0 md:self-start md:mt-[132px]">
            <OrBadge />
          </div>

          {/* Option B */}
          <div className="flex w-full md:flex-1">
            <OptionCard
              item={pair.itemB}
              onSelect={() => onVote(pair.itemB.id)}
              expanded={expandedB}
              onToggleExpand={() => setExpandedB(!expandedB)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Option Card Component
function OptionCard({
  item,
  onSelect,
  expanded,
  onToggleExpand,
  disabled,
}: {
  item: Item
  onSelect: () => void
  expanded: boolean
  onToggleExpand: () => void
  disabled: boolean
}) {
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
        "disabled:cursor-not-allowed disabled:opacity-70"
      )}
    >
      <div className="flex flex-1 flex-col items-center justify-center">
        <span className="text-xl font-medium leading-tight text-card-foreground md:text-2xl text-balance">
          {item.name}
        </span>

        {/* Inline description with smooth expansion */}
        {item.description && (
          <div
            className={cn(
              "grid transition-all duration-300 ease-out",
              expanded ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="overflow-hidden">
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Description toggle */}
      {item.description && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation()
            onToggleExpand()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation()
              onToggleExpand()
            }
          }}
          className="absolute bottom-4 right-4 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          {expanded ? "Hide description" : "See description"}
        </span>
      )}
    </button>
  )
}

// OR Badge Component
function OrBadge() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md">
      OR
    </div>
  )
}

// Completion Screen Component
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
