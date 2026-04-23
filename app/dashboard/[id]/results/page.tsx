"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts"

interface RankedItem {
  id: string
  name: string
  rank: number
  elo: number
}

interface QuestionResult {
  questionId: string
  questionText: string
  axisLabel: string | null
  audienceName: string
  rankedItems: RankedItem[]
  voteCount: number
  totalItems: number
}

interface ResultsData {
  pairwise: {
    id: string
    name: string
    share_token: string
  }
  questions: QuestionResult[]
  voterCount: number
  audienceCount: number
}

export default function OwnerResultsPage() {
  const params = useParams()
  const pairwiseId = params.id as string
  const [data, setData] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/dashboard/${pairwiseId}/results`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to fetch results")
        }
        const results = await response.json()
        setData(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load results")
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [pairwiseId])

  const copyVotingLink = async () => {
    if (!data) return
    const url = `${window.location.origin}/v/${data.pairwise.share_token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-destructive">{error || "Failed to load results"}</p>
        <Link href="/dashboard" className="mt-4 text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    )
  }

  const { pairwise, questions, voterCount, audienceCount } = data
  const hasVotes = voterCount > 0

  // Check if we can show scatter plot (exactly 2 questions with votes)
  const questionsWithVotes = questions.filter(q => q.voteCount > 0)
  const canShowScatter = questionsWithVotes.length === 2

  // Prepare scatter data if applicable
  let scatterData: { name: string; x: number; y: number }[] = []
  let xAxisLabel = ""
  let yAxisLabel = ""

  if (canShowScatter) {
    const [q1, q2] = questionsWithVotes
    xAxisLabel = q1.axisLabel || q1.audienceName
    yAxisLabel = q2.axisLabel || q2.audienceName

    // Create a map of item ranks for each question
    const q1Ranks = new Map(q1.rankedItems.map(item => [item.id, item.rank]))
    const q2Ranks = new Map(q2.rankedItems.map(item => [item.id, item.rank]))

    // Build scatter data - lower rank = better, so invert for display
    const totalItems = q1.totalItems
    scatterData = q1.rankedItems.map(item => ({
      name: item.name,
      x: totalItems - (q1Ranks.get(item.id) || totalItems) + 1,
      y: totalItems - (q2Ranks.get(item.id) || totalItems) + 1,
    }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">{pairwise.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {voterCount} voter{voterCount !== 1 ? "s" : ""} across {audienceCount} audience{audienceCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={copyVotingLink}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copied ? "Copied!" : "Copy voting link"}
        </button>
      </div>

      {/* Empty state */}
      {!hasVotes && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-foreground">No votes yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Share the voting link to start collecting responses.
            </p>
            <button
              onClick={copyVotingLink}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {copied ? "Copied!" : "Copy voting link"}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Scatter plot for 2-question pairwises with votes */}
      {canShowScatter && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Priority Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={xAxisLabel}
                    domain={[0, scatterData.length + 1]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    label={{
                      value: xAxisLabel,
                      position: "bottom",
                      offset: 20,
                      fill: "hsl(var(--foreground))",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={yAxisLabel}
                    domain={[0, scatterData.length + 1]}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickLine={{ stroke: "hsl(var(--border))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    label={{
                      value: yAxisLabel,
                      angle: -90,
                      position: "left",
                      offset: 20,
                      fill: "hsl(var(--foreground))",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  />
                  {/* Highlight upper-right quadrant */}
                  <ReferenceArea
                    x1={(scatterData.length + 1) / 2}
                    x2={scatterData.length + 1}
                    y1={(scatterData.length + 1) / 2}
                    y2={scatterData.length + 1}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.08}
                  />
                  <ReferenceLine
                    x={(scatterData.length + 1) / 2}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    y={(scatterData.length + 1) / 2}
                    stroke="hsl(var(--border))"
                    strokeDasharray="3 3"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                            <p className="font-medium text-popover-foreground">{item.name}</p>
                            <p className="text-muted-foreground">
                              {xAxisLabel}: rank {scatterData.length - item.x + 1}
                            </p>
                            <p className="text-muted-foreground">
                              {yAxisLabel}: rank {scatterData.length - item.y + 1}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    fill="hsl(var(--primary))"
                    r={6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Items in the upper-right are ranked highly on both axes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Per-question rankings */}
      {hasVotes && (
        <div className="grid gap-6 md:grid-cols-2">
          {questions.map((question) => (
            <Card key={question.questionId}>
              <CardHeader>
                <CardTitle className="text-base">
                  {question.axisLabel || question.audienceName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {question.audienceName} · {question.voteCount} comparison{question.voteCount !== 1 ? "s" : ""}
                </p>
              </CardHeader>
              <CardContent>
                {question.voteCount === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No votes yet for this question
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {question.rankedItems.map((item) => (
                      <li key={item.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {item.rank}
                        </span>
                        <span className="font-medium text-foreground">{item.name}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
