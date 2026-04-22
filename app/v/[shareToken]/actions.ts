"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"

const VOTER_COOKIE_NAME = "pairwise_voter_session"

export async function getVoterSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(VOTER_COOKIE_NAME)?.value
  
  if (!sessionToken) {
    return null
  }

  const supabase = await createClient()
  const { data: voter } = await supabase
    .from("voters")
    .select("id, pairwise_id, audience_id, display_name, email")
    .eq("session_token", sessionToken)
    .single()

  return voter
}

export async function createVoter(pairwiseId: string, audienceId: string) {
  const sessionToken = randomUUID()
  
  const supabase = await createClient()
  const { data: voter, error } = await supabase
    .from("voters")
    .insert({
      pairwise_id: pairwiseId,
      audience_id: audienceId,
      session_token: sessionToken,
    })
    .select("id, pairwise_id, audience_id")
    .single()

  if (error) {
    console.error("Failed to create voter:", error)
    throw new Error("Failed to create voter session")
  }

  // Fetch questions for this audience
  const { data: questions } = await supabase
    .from("questions")
    .select("id, text, axis_label, position")
    .eq("pairwise_id", pairwiseId)
    .eq("audience_id", audienceId)
    .order("position")

  // Set httpOnly cookie
  const cookieStore = await cookies()
  cookieStore.set(VOTER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  return { 
    voter, 
    questions: questions || [] 
  }
}

export async function submitVote(
  voterId: string,
  questionId: string,
  itemAId: string,
  itemBId: string,
  winnerId: string
) {
  const supabase = await createClient()
  
  const { error } = await supabase.from("votes").insert({
    voter_id: voterId,
    question_id: questionId,
    item_a_id: itemAId,
    item_b_id: itemBId,
    winner_id: winnerId,
  })

  if (error) {
    console.error("Failed to submit vote:", error)
    throw new Error("Failed to submit vote")
  }

  return { success: true }
}

export async function getVoterProgress(voterId: string) {
  const supabase = await createClient()
  
  const { data: votes } = await supabase
    .from("votes")
    .select("question_id, item_a_id, item_b_id")
    .eq("voter_id", voterId)

  return votes || []
}

export async function markVoterCompleted(voterId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("voters")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", voterId)

  if (error) {
    console.error("Failed to mark voter completed:", error)
    throw new Error("Failed to mark voter completed")
  }

  return { success: true }
}

export async function clearVoterSession() {
  const cookieStore = await cookies()
  cookieStore.delete(VOTER_COOKIE_NAME)
  return { success: true }
}

export async function checkResultsAccess(pairwiseId: string, ownerId: string | null) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(VOTER_COOKIE_NAME)?.value
  
  // Check if authenticated user is the owner
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user && ownerId && user.id === ownerId) {
    return { hasAccess: true, reason: "owner" as const }
  }
  
  // Check if voter has completed voting
  if (sessionToken) {
    const { data: voter } = await supabase
      .from("voters")
      .select("id, pairwise_id, completed_at")
      .eq("session_token", sessionToken)
      .single()
    
    if (voter && voter.pairwise_id === pairwiseId && voter.completed_at) {
      return { hasAccess: true, reason: "completed_voter" as const }
    }
  }
  
  return { hasAccess: false, reason: "not_authorized" as const }
}

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
  
  // Initialize all items at 1000
  for (const itemId of itemIds) {
    scores[itemId] = 1000
  }
  
  // Process votes in order
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

export async function getResultsData(pairwiseId: string) {
  const supabase = await createClient()
  
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
  
  const uniqueAudiences = new Set(audienceData?.map(v => v.audience_id) || [])
  
  if (!questions || !items) {
    return null
  }
  
  // Compute Elo scores for each question
  const questionResults = []
  const itemIds = items.map(i => i.id)
  
  for (const question of questions) {
    // Get all votes for this question, ordered by created_at
    const { data: votes } = await supabase
      .from("votes")
      .select("winner_id, item_a_id, item_b_id, created_at")
      .eq("question_id", question.id)
      .order("created_at", { ascending: true })
    
    const eloScores = computeEloScores(itemIds, votes || [])
    
    // Create ranked list
    const rankedItems = items
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        elo: Math.round(eloScores[item.id] || 1000),
      }))
      .sort((a, b) => b.elo - a.elo)
    
    questionResults.push({
      questionId: question.id,
      questionText: question.text,
      axisLabel: question.axis_label,
      audienceName: (question.audiences as { name: string })?.name || "All",
      audiencePosition: (question.audiences as { position: number })?.position || 0,
      position: question.position,
      rankedItems,
    })
  }
  
  // Sort by audience position, then question position
  questionResults.sort((a, b) => {
    if (a.audiencePosition !== b.audiencePosition) {
      return a.audiencePosition - b.audiencePosition
    }
    return a.position - b.position
  })
  
  return {
    questions: questionResults,
    items: items.map(i => ({ id: i.id, name: i.name })),
    voterCount: voterCount || 0,
    audienceCount: uniqueAudiences.size,
  }
}
