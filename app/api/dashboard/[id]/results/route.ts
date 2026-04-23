import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Elo calculation
function computeEloScores(
  itemIds: string[],
  votes: { winner_id: string; item_a_id: string; item_b_id: string }[]
): Record<string, number> {
  const K = 32
  const scores: Record<string, number> = {}

  for (const itemId of itemIds) {
    scores[itemId] = 1000
  }

  for (const vote of votes) {
    const winnerId = vote.winner_id
    const loserId = vote.item_a_id === winnerId ? vote.item_b_id : vote.item_a_id

    const winnerScore = scores[winnerId] || 1000
    const loserScore = scores[loserId] || 1000

    const expectedWinner = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400))

    scores[winnerId] = winnerScore + K * (1 - expectedWinner)
    scores[loserId] = loserScore - K * (1 - expectedWinner)
  }

  return scores
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: pairwiseId } = await params
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get pairwise and verify ownership
  const { data: pairwise, error: pairwiseError } = await supabase
    .from("pairwises")
    .select("id, name, share_token, owner_id")
    .eq("id", pairwiseId)
    .single()

  if (pairwiseError || !pairwise) {
    return NextResponse.json({ error: "Pairwise not found" }, { status: 404 })
  }

  if (pairwise.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Get all questions with their audiences
  const { data: questions } = await supabase
    .from("questions")
    .select(`
      id,
      text,
      axis_label,
      position,
      audience_id,
      audiences!inner (
        id,
        name,
        position
      )
    `)
    .eq("pairwise_id", pairwiseId)
    .order("position")

  // Get all items
  const { data: items } = await supabase
    .from("items")
    .select("id, name, description")
    .eq("pairwise_id", pairwiseId)

  // Get completed voter count
  const { count: voterCount } = await supabase
    .from("voters")
    .select("*", { count: "exact", head: true })
    .eq("pairwise_id", pairwiseId)
    .not("completed_at", "is", null)

  // Get unique audience count from completed voters
  const { data: audienceData } = await supabase
    .from("voters")
    .select("audience_id")
    .eq("pairwise_id", pairwiseId)
    .not("completed_at", "is", null)

  const uniqueAudiences = new Set(audienceData?.map((v) => v.audience_id) || [])

  if (!questions || !items) {
    return NextResponse.json({
      pairwise: { id: pairwise.id, name: pairwise.name, share_token: pairwise.share_token },
      questions: [],
      voterCount: 0,
      audienceCount: 0,
    })
  }

  // Compute Elo scores for each question
  const questionResults = []
  const itemIds = items.map((i) => i.id)

  for (const question of questions) {
    const { data: votes } = await supabase
      .from("votes")
      .select("winner_id, item_a_id, item_b_id, created_at")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true })

    const voteCount = votes?.length || 0
    const eloScores = computeEloScores(itemIds, votes || [])

    const rankedItems = items
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        elo: Math.round(eloScores[item.id] || 1000),
        rank: 0,
      }))
      .sort((a, b) => b.elo - a.elo)

    rankedItems.forEach((item, index) => {
      item.rank = index + 1
    })

    questionResults.push({
      questionId: question.id,
      questionText: question.text,
      axisLabel: question.axis_label,
      audienceName: (question.audiences as { name: string })?.name || "All",
      audiencePosition: (question.audiences as { position: number })?.position || 0,
      position: question.position,
      rankedItems,
      voteCount,
      totalItems: items.length,
    })
  }

  // Sort by audience position, then question position
  questionResults.sort((a, b) => {
    if (a.audiencePosition !== b.audiencePosition) {
      return a.audiencePosition - b.audiencePosition
    }
    return a.position - b.position
  })

  return NextResponse.json({
    pairwise: { id: pairwise.id, name: pairwise.name, share_token: pairwise.share_token },
    questions: questionResults,
    voterCount: voterCount || 0,
    audienceCount: uniqueAudiences.size,
  })
}
