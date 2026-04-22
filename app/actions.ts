"use server"

import { createClient } from "@/lib/supabase/server"

export async function joinWaitlist(email: string, source: string = "homepage") {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("waitlist_signups")
    .insert({ 
      email: email.toLowerCase().trim(),
      source,
    })

  if (error) {
    // Check for unique constraint violation
    if (error.code === "23505") {
      return { success: false, error: "You're already on the list — thanks!" }
    }
    console.error("Waitlist signup error:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true }
}
