import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's pairwises
  const { data: pairwises } = await supabase
    .from("pairwises")
    .select("id, name, status, share_token, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  // Get voter counts for each pairwise
  const voterCounts: Map<string, number> = new Map()

  if (pairwises && pairwises.length > 0) {
    for (const pairwise of pairwises) {
      const { count } = await supabase
        .from("voters")
        .select("*", { count: "exact", head: true })
        .eq("pairwise_id", pairwise.id)
        .not("completed_at", "is", null)
      voterCounts.set(pairwise.id, count || 0)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Your Pairwises</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your prioritization sessions
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          + New Pairwise
        </Link>
      </div>

      {/* Pairwise list */}
      {(!pairwises || pairwises.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No pairwises yet.</p>
            <Link
              href="/dashboard/new"
              className="mt-4 text-sm text-primary hover:underline"
            >
              Create your first one
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pairwises.map((pairwise) => {
            const voterCount = voterCounts.get(pairwise.id) || 0
            const votingUrl = `/v/${pairwise.share_token}`
            const resultsUrl = `/dashboard/${pairwise.id}/results`

            return (
              <Card key={pairwise.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{pairwise.name}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {voterCount} voter{voterCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Link
                      href={votingUrl}
                      target="_blank"
                      className="text-sm text-primary hover:underline"
                    >
                      Voting link →
                    </Link>
                    <Link
                      href={resultsUrl}
                      className="text-sm text-primary hover:underline"
                    >
                      Results →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
