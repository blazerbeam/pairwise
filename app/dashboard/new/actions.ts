"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

function generateShareToken(name: string): string {
  // Create a URL-friendly slug from the name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30)
  
  // Add a random suffix for uniqueness
  const suffix = Math.random().toString(36).slice(2, 8)
  
  return `${slug}-${suffix}`
}

interface ItemInput {
  name: string
  description: string | null
  position: number
}

interface QuestionInput {
  text: string
  axis_label: string | null
  position: number
}

interface AudienceInput {
  name: string
  position: number
  questions: QuestionInput[]
}

export async function createPairwise(
  name: string,
  description: string | null,
  items: ItemInput[],
  audiences: AudienceInput[],
  template: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const shareToken = generateShareToken(name)

  // Create pairwise with status='active'
  const { data: pairwise, error: pairwiseError } = await supabase
    .from("pairwises")
    .insert({
      owner_id: user.id,
      name,
      description,
      status: "active",
      share_token: shareToken,
      template,
    })
    .select("id, name, share_token")
    .single()

  if (pairwiseError || !pairwise) {
    console.error("Failed to create pairwise:", pairwiseError)
    throw new Error("Failed to create pairwise")
  }

  // Create items
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("items")
      .insert(
        items.map((item) => ({
          pairwise_id: pairwise.id,
          name: item.name,
          description: item.description,
          position: item.position,
        }))
      )

    if (itemsError) {
      console.error("Failed to create items:", itemsError)
      // Clean up pairwise on failure
      await supabase.from("pairwises").delete().eq("id", pairwise.id)
      throw new Error("Failed to create items")
    }
  }

  // Create audiences and questions
  for (const audience of audiences) {
    const { data: createdAudience, error: audienceError } = await supabase
      .from("audiences")
      .insert({
        pairwise_id: pairwise.id,
        name: audience.name,
        position: audience.position,
      })
      .select("id")
      .single()

    if (audienceError || !createdAudience) {
      console.error("Failed to create audience:", audienceError)
      // Clean up on failure
      await supabase.from("items").delete().eq("pairwise_id", pairwise.id)
      await supabase.from("audiences").delete().eq("pairwise_id", pairwise.id)
      await supabase.from("pairwises").delete().eq("id", pairwise.id)
      throw new Error("Failed to create audience")
    }

    // Create questions for this audience
    if (audience.questions.length > 0) {
      const { error: questionsError } = await supabase
        .from("questions")
        .insert(
          audience.questions.map((q) => ({
            pairwise_id: pairwise.id,
            audience_id: createdAudience.id,
            text: q.text,
            axis_label: q.axis_label,
            position: q.position,
          }))
        )

      if (questionsError) {
        console.error("Failed to create questions:", questionsError)
        // Clean up on failure
        await supabase.from("questions").delete().eq("pairwise_id", pairwise.id)
        await supabase.from("items").delete().eq("pairwise_id", pairwise.id)
        await supabase.from("audiences").delete().eq("pairwise_id", pairwise.id)
        await supabase.from("pairwises").delete().eq("id", pairwise.id)
        throw new Error("Failed to create questions")
      }
    }
  }

  return pairwise
}
