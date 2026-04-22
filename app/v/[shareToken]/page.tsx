import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { VotingFlow } from "./voting-flow"
import { getVoterSession, getVoterProgress } from "./actions"

interface PageProps {
  params: Promise<{ shareToken: string }>
}

export default async function VotePage({ params }: PageProps) {
  const { shareToken } = await params
  const supabase = await createClient()

  // Fetch pairwise by share_token
  const { data: pairwise, error: pairwiseError } = await supabase
    .from("pairwises")
    .select("id, name, share_token")
    .eq("share_token", shareToken)
    .single()

  if (pairwiseError || !pairwise) {
    notFound()
  }

  // Fetch audiences for this pairwise
  const { data: audiences } = await supabase
    .from("audiences")
    .select("id, name")
    .eq("pairwise_id", pairwise.id)
    .order("name")

  // Fetch items for this pairwise
  const { data: items } = await supabase
    .from("items")
    .select("id, name, description")
    .eq("pairwise_id", pairwise.id)
    .order("name")

  // Check if voter already has a session
  const voter = await getVoterSession()
  let voterProgress: { question_id: string; item_a_id: string; item_b_id: string }[] = []
  let questions: { id: string; text: string; axis_label: string | null; position: number }[] = []

  if (voter && voter.pairwise_id === pairwise.id) {
    // Voter exists and belongs to this pairwise - fetch their progress and questions
    voterProgress = await getVoterProgress(voter.id)
    
    const { data: audienceQuestions } = await supabase
      .from("questions")
      .select("id, text, axis_label, position")
      .eq("pairwise_id", pairwise.id)
      .eq("audience_id", voter.audience_id)
      .order("position")

    questions = audienceQuestions || []
  }

  return (
    <VotingFlow
      pairwise={pairwise}
      audiences={audiences || []}
      items={items || []}
      existingVoter={voter && voter.pairwise_id === pairwise.id ? voter : null}
      existingQuestions={questions}
      existingProgress={voterProgress}
    />
  )
}
