import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { VotingClient } from "./voting-client"

interface PageProps {
  params: Promise<{ shareToken: string }>
}

export default async function VotePage({ params }: PageProps) {
  const { shareToken } = await params
  const supabase = await createClient()

  // Fetch pairwise by share token
  const { data: pairwise, error: pairwiseError } = await supabase
    .from("pairwises")
    .select("*")
    .eq("share_token", shareToken)
    .eq("status", "active")
    .single()

  if (pairwiseError || !pairwise) {
    notFound()
  }

  // Fetch items for this pairwise
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("*")
    .eq("pairwise_id", pairwise.id)
    .order("position", { ascending: true })

  if (itemsError || !items || items.length < 2) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Not enough items</h1>
          <p className="mt-2 text-muted-foreground">This pairwise needs at least 2 items to vote on.</p>
        </div>
      </div>
    )
  }

  // Fetch questions for this pairwise (use first question for now)
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("pairwise_id", pairwise.id)
    .order("position", { ascending: true })

  const question = questions?.[0] || {
    id: null,
    text: "Which do you prefer?",
    axis_label: "Preference",
  }

  return (
    <VotingClient
      pairwise={pairwise}
      items={items}
      question={question}
    />
  )
}
