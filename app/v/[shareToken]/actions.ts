"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { randomUUID } from "crypto"

const VOTER_COOKIE_NAME = "pairwise_voter_session"

export async function getVoterSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(VOTER_COOKIE_NAME)?.value
  
  console.log("[v0] getVoterSession: sessionToken exists?", !!sessionToken)
  
  if (!sessionToken) {
    return null
  }

  const supabase = await createClient()
  const { data: voter, error } = await supabase
    .from("voters")
    .select("id, pairwise_id, audience_id, display_name, email")
    .eq("session_token", sessionToken)
    .single()

  console.log("[v0] getVoterSession: found voter?", !!voter, "error?", error?.message, "audienceId:", voter?.audience_id)

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

  // Set httpOnly cookie
  const cookieStore = await cookies()
  cookieStore.set(VOTER_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  return voter
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
