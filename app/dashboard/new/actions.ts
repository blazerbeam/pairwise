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

export async function createPairwise(name: string, description: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const shareToken = generateShareToken(name)

  const { data: pairwise, error } = await supabase
    .from("pairwises")
    .insert({
      owner_id: user.id,
      name,
      description,
      status: "draft",
      share_token: shareToken,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Failed to create pairwise:", error)
    throw new Error("Failed to create pairwise")
  }

  return pairwise
}
