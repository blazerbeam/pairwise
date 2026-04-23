"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Helper to verify ownership
async function verifyOwnership(pairwiseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  const { data: pairwise } = await supabase
    .from("pairwises")
    .select("id")
    .eq("id", pairwiseId)
    .eq("owner_id", user.id)
    .single()

  if (!pairwise) {
    throw new Error("Not authorized")
  }

  return { supabase, user }
}

// Pairwise actions
export async function updatePairwise(
  pairwiseId: string,
  updates: { name?: string; description?: string | null; show_results_to_voters?: boolean }
) {
  const { supabase } = await verifyOwnership(pairwiseId)

  const { error } = await supabase
    .from("pairwises")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", pairwiseId)

  if (error) {
    console.error("Failed to update pairwise:", error)
    throw new Error("Failed to update pairwise")
  }

  return { success: true }
}

export async function activatePairwise(pairwiseId: string) {
  const { supabase } = await verifyOwnership(pairwiseId)

  const { error } = await supabase
    .from("pairwises")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", pairwiseId)

  if (error) {
    console.error("Failed to activate pairwise:", error)
    throw new Error("Failed to activate pairwise")
  }

  return { success: true }
}

// Audience actions
export async function addAudience(pairwiseId: string, name: string, position: number) {
  const { supabase } = await verifyOwnership(pairwiseId)

  const { data: audience, error } = await supabase
    .from("audiences")
    .insert({ pairwise_id: pairwiseId, name, position })
    .select()
    .single()

  if (error) {
    console.error("Failed to add audience:", error)
    throw new Error("Failed to add audience")
  }

  return audience
}

export async function updateAudience(audienceId: string, updates: { name?: string; position?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Verify ownership via join
  const { data: audience } = await supabase
    .from("audiences")
    .select("pairwise_id, pairwises!inner(owner_id)")
    .eq("id", audienceId)
    .single()

  if (!audience || (audience.pairwises as { owner_id: string }).owner_id !== user.id) {
    throw new Error("Not authorized")
  }

  const { error } = await supabase
    .from("audiences")
    .update(updates)
    .eq("id", audienceId)

  if (error) {
    console.error("Failed to update audience:", error)
    throw new Error("Failed to update audience")
  }

  return { success: true }
}

export async function deleteAudience(audienceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Verify ownership via join
  const { data: audience } = await supabase
    .from("audiences")
    .select("pairwise_id, pairwises!inner(owner_id)")
    .eq("id", audienceId)
    .single()

  if (!audience || (audience.pairwises as { owner_id: string }).owner_id !== user.id) {
    throw new Error("Not authorized")
  }

  // Delete questions for this audience first
  await supabase.from("questions").delete().eq("audience_id", audienceId)

  const { error } = await supabase.from("audiences").delete().eq("id", audienceId)

  if (error) {
    console.error("Failed to delete audience:", error)
    throw new Error("Failed to delete audience")
  }

  return { success: true }
}

// Item actions
export async function addItem(
  pairwiseId: string,
  name: string,
  description: string | null,
  position: number
) {
  const { supabase } = await verifyOwnership(pairwiseId)

  const { data: item, error } = await supabase
    .from("items")
    .insert({ pairwise_id: pairwiseId, name, description, position })
    .select()
    .single()

  if (error) {
    console.error("Failed to add item:", error)
    throw new Error("Failed to add item")
  }

  return item
}

export async function updateItem(itemId: string, updates: { name?: string; description?: string | null }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Verify ownership via join
  const { data: item } = await supabase
    .from("items")
    .select("pairwise_id, pairwises!inner(owner_id)")
    .eq("id", itemId)
    .single()

  if (!item || (item.pairwises as { owner_id: string }).owner_id !== user.id) {
    throw new Error("Not authorized")
  }

  const { error } = await supabase
    .from("items")
    .update(updates)
    .eq("id", itemId)

  if (error) {
    console.error("Failed to update item:", error)
    throw new Error("Failed to update item")
  }

  return { success: true }
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Verify ownership via join
  const { data: item } = await supabase
    .from("items")
    .select("pairwise_id, pairwises!inner(owner_id)")
    .eq("id", itemId)
    .single()

  if (!item || (item.pairwises as { owner_id: string }).owner_id !== user.id) {
    throw new Error("Not authorized")
  }

  const { error } = await supabase.from("items").delete().eq("id", itemId)

  if (error) {
    console.error("Failed to delete item:", error)
    throw new Error("Failed to delete item")
  }

  return { success: true }
}

// Question actions
export async function addQuestion(
  pairwiseId: string,
  audienceId: string,
  text: string,
  axisLabel: string | null,
  position: number
) {
  const { supabase } = await verifyOwnership(pairwiseId)

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      pairwise_id: pairwiseId,
      audience_id: audienceId,
      text,
      axis_label: axisLabel,
      position,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to add question:", error)
    throw new Error("Failed to add question")
  }

  return question
}

export async function updateQuestion(questionId: string, updates: { text?: string; axis_label?: string | null }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Verify ownership via join
  const { data: question } = await supabase
    .from("questions")
    .select("pairwise_id, pairwises!inner(owner_id)")
    .eq("id", questionId)
    .single()

  if (!question || (question.pairwises as { owner_id: string }).owner_id !== user.id) {
    throw new Error("Not authorized")
  }

  const { error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", questionId)

  if (error) {
    console.error("Failed to update question:", error)
    throw new Error("Failed to update question")
  }

  return { success: true }
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  // Verify ownership via join
  const { data: question } = await supabase
    .from("questions")
    .select("pairwise_id, pairwises!inner(owner_id)")
    .eq("id", questionId)
    .single()

  if (!question || (question.pairwises as { owner_id: string }).owner_id !== user.id) {
    throw new Error("Not authorized")
  }

  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) {
    console.error("Failed to delete question:", error)
    throw new Error("Failed to delete question")
  }

  return { success: true }
}
