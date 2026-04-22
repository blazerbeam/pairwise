import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"

const VOTER_COOKIE_NAME = "pairwise_voter_session"

interface Vote {
  winner_id: string
  item_a_id: string
  item_b_id: string
}

interface EloScores {
  [itemId: string]: number
}

function computeEloScores(itemIds: string[], votes: Vote[]): EloScores {
  const K = 32
  const scores: EloScores = {}
  
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
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params
  const supabase = await createClient()

  // Fetch pairwise
  const { data: pairwise } = await supabase
    .from("pairwises")
    .select("id, name, owner_id")
    .eq("share_token", shareToken)
    .single()

  if (!pairwise) {
    return NextResponse.json({ error: "Pairwise not found" }, { status: 404 })
  }

  // Check access
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(VOTER_COOKIE_NAME)?.value
  
  // Check if authenticated user is the owner
  const { data: { user } } = await supabase.auth.getUser()
  
  let hasAccess = false
  
  if (user && pairwise.owner_id && user.id === pairwise.owner_id) {
    hasAccess = true
  }
  
  // Check if voter has completed voting
  if (!hasAccess && sessionToken) {
    const { data: voter } = await supabase
      .from("voters")
      .select("id, pairwise_id, completed_at")
      .eq("session_token", sessionToken)
      .single()
    
    if (voter && voter.pairwise_id === pairwise.id && voter.completed_at) {
      hasAccess = true
    }
  }
  
  if (!hasAccess) {
    return NextResponse.json({ hasAccess: false })
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
    .eq("pairwise_id", pairwise.id)
    .order("position")
  
  // Get all items
  const { data: items } = await supabase
    .from("items")
    .select("id, name, description")
    .eq("pairwise_id", pairwise.id)
  
  // Get completed voter count
  const { count: voterCount } = await supabase
    .from("voters")
    .select("*", { count: "exact", head: true })
    .eq("pairwise_id", pairwise.id)
    .not("completed_at", "is", null)
  
  // Get unique audience count from completed voters
  const { data: audienceData } = await supabase
    .from("voters")
    .select("audience_id")
    .eq("pairwise_id", pairwise.id)
    .not("completed_at", "is", null)
  
  const uniqueAudiences = new Set(audienceData?.map(v => v.audience_id) || [])
  
  if (!questions || !items) {
    return NextResponse.json({ hasAccess: true, data: null })
  }
  
  // Compute Elo scores for each question
  const questionResults = []
  const itemIds = items.map(i => i.id)
  
  for (const question of questions) {
    const { data: votes } = await supabase
      .from("votes")
      .select("winner_id, item_a_id, item_b_id, created_at")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true })
    
    const voteCount = votes?.length || 0
    const eloScores = computeEloScores(itemIds, votes || [])
    
    const rankedItems = items
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        elo: Math.round(eloScores[item.id] || 1000),
        rank: 0, // Will be set after sorting
      }))
      .sort((a, b) => b.elo - a.elo)
    
    // Set ranks after sorting
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
    hasAccess: true,
    data: {
      questions: questionResults,
      items: items.map(i => ({ id: i.id, name: i.name })),
      voterCount: voterCount || 0,
      audienceCount: uniqueAudiences.size,
      pairwiseName: pairwise.name,
    },
  })
}
