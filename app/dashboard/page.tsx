import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's pairwises
  const { data: pairwises } = await supabase
    .from("pairwises")
    .select("id, name, description, status, share_token, created_at")
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
          {pairwises.map((pairwise) => (
            <Link key={pairwise.id} href={`/dashboard/${pairwise.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{pairwise.name}</CardTitle>
                      {pairwise.description && (
                        <CardDescription className="mt-1 line-clamp-2">
                          {pairwise.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          pairwise.status === "active"
                            ? "bg-green-50 text-green-700"
                            : pairwise.status === "draft"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {pairwise.status}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {voterCounts.get(pairwise.id) || 0} voters
                      </span>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
