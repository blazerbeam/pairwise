import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PairwiseEditor } from "./pairwise-editor"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PairwiseDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get pairwise with all related data
  const { data: pairwise, error } = await supabase
    .from("pairwises")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single()

  if (error || !pairwise) {
    notFound()
  }

  // Get audiences
  const { data: audiences } = await supabase
    .from("audiences")
    .select("*")
    .eq("pairwise_id", id)
    .order("position")

  // Get items
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("pairwise_id", id)
    .order("position")

  // Get questions
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("pairwise_id", id)
    .order("position")

  // Get voter count
  const { count: voterCount } = await supabase
    .from("voters")
    .select("*", { count: "exact", head: true })
    .eq("pairwise_id", id)
    .not("completed_at", "is", null)

  return (
    <PairwiseEditor
      pairwise={pairwise}
      audiences={audiences || []}
      items={items || []}
      questions={questions || []}
      voterCount={voterCount || 0}
    />
  )
}
