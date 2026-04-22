"use server"

import { createClient } from "@/lib/supabase/server"

export async function joinWaitlist(email: string) {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" }
  }

  const supabase = await createClient()

  // Check if email already exists
  const { data: existing } = await supabase
    .from("waitlist_signups")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single()

  if (existing) {
    return { success: false, error: "You're already on the waitlist!" }
  }

  const { error } = await supabase
    .from("waitlist_signups")
    .insert({ email: email.toLowerCase().trim() })

  if (error) {
    console.error("Waitlist signup error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true }
}
