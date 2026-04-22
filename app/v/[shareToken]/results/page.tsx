"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface RankedItem {
  id: string
  name: string
  description: string | null
  elo: number
  rank: number
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
  questions: QuestionResult[]
  items: { id: string; name: string }[]
  voterCount: number
  audienceCount: number
  pairwiseName: string
}

export default function ResultsPage() {
  const params = useParams()
  const shareToken = params.shareToken as string
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [data, setData] = useState<ResultsData | null>(null)

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/v/${shareToken}/results`)
        const result = await response.json()

        if (result.hasAccess) {
          setHasAccess(true)
          setData(result.data)
        } else {
          setHasAccess(false)
        }
      } catch (error) {
        console.error("Failed to fetch results:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [shareToken])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-lg text-muted-foreground">Loading results...</p>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-semibold text-foreground">Results not available yet</h1>
          <p className="mt-3 text-muted-foreground">
            Results will be available after you complete voting.
          </p>
          <Link
            href={`/v/${shareToken}`}
            className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            Vote now
          </Link>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-lg text-muted-foreground">No results data available.</p>
      </div>
    )
  }

  // Check if scatter should be shown (exactly 2 questions and both have votes)
  const canShowScatter = data.questions.length === 2 && 
    data.questions[0].voteCount > 0 && 
    data.questions[1].voteCount > 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
            {data.pairwiseName}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Results based on {data.voterCount} voter{data.voterCount !== 1 ? "s" : ""} across{" "}
            {data.audienceCount} audience{data.audienceCount !== 1 ? "s" : ""}
          </p>
        </header>

        {/* 2D Scatter Chart (only when exactly 2 questions with votes) */}
        {data.questions.length === 2 && (
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>How they compare across both questions</CardTitle>
                <CardDescription>
                  Items in the upper-right are strong on both dimensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canShowScatter ? (
                  <ScatterPlot questions={data.questions} items={data.items} />
                ) : (
                  <div className="flex h-[200px] items-center justify-center">
                    <p className="text-muted-foreground">
                      Scatter view available once both questions have votes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Per-question rankings */}
        <section>
          <h2 className="mb-6 text-xl font-semibold text-foreground">Rankings by Question</h2>
          <div className="space-y-6">
            {data.questions.map((question) => (
              <QuestionRankingCard 
                key={question.questionId} 
                question={question} 
                shareToken={shareToken}
              />
            ))}
          </div>

          {data.questions.length > 2 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Scatter view available when a pairwise has exactly 2 questions.
            </p>
          )}
        </section>

        {/* Back link */}
        <footer className="mt-12 text-center">
          <Link
            href={`/v/${shareToken}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to voting
          </Link>
        </footer>
      </div>
    </div>
  )
}

function QuestionRankingCard({ 
  question, 
  shareToken 
}: { 
  question: QuestionResult
  shareToken: string 
}) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = useCallback(async () => {
    const votingUrl = `${window.location.origin}/v/${shareToken}`
    try {
      await navigator.clipboard.writeText(votingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [shareToken])

  // Empty state - no votes yet
  if (question.voteCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.questionText}</CardTitle>
          <CardDescription>Asked of: {question.audienceName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No votes yet for this question</p>
            <button
              onClick={handleCopyLink}
              className="mt-4 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              {copied ? "Copied!" : "Share voting link"}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{question.questionText}</CardTitle>
        <CardDescription>Asked of: {question.audienceName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {question.rankedItems.map((item, index) => (
            <li key={item.id} className="flex items-center gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {index + 1}
              </span>
              <span className="flex-1 font-medium text-foreground">{item.name}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}

interface ScatterDataPoint {
  id: string
  name: string
  x: number
  y: number
  q1Rank: number
  q2Rank: number
  totalItems: number
  q1Label: string
  q2Label: string
  isEasyWin: boolean
}

function ScatterPlot({
  questions,
  items,
}: {
  questions: QuestionResult[]
  items: { id: string; name: string }[]
}) {
  if (questions.length !== 2) return null

  const q1 = questions[0]
  const q2 = questions[1]

  // Calculate midpoints for quadrant determination
  const q1Elos = q1.rankedItems.map(r => r.elo)
  const q2Elos = q2.rankedItems.map(r => r.elo)
  const q1Mid = (Math.max(...q1Elos) + Math.min(...q1Elos)) / 2
  const q2Mid = (Math.max(...q2Elos) + Math.min(...q2Elos)) / 2

  // Build scatter data
  const scatterData: ScatterDataPoint[] = items.map((item) => {
    const q1Item = q1.rankedItems.find((r) => r.id === item.id)
    const q2Item = q2.rankedItems.find((r) => r.id === item.id)
    const x = q1Item?.elo || 1000
    const y = q2Item?.elo || 1000
    
    return {
      id: item.id,
      name: item.name,
      x,
      y,
      q1Rank: q1Item?.rank || 0,
      q2Rank: q2Item?.rank || 0,
      totalItems: items.length,
      q1Label: q1.axisLabel || q1.questionText,
      q2Label: q2.axisLabel || q2.questionText,
      isEasyWin: x > q1Mid && y > q2Mid,
    }
  })

  // Calculate axis bounds
  const allElos = scatterData.flatMap((d) => [d.x, d.y])
  const minElo = Math.min(...allElos) - 50
  const maxElo = Math.max(...allElos) + 50
  const midPoint = (minElo + maxElo) / 2

  const xLabel = q1.axisLabel || q1.questionText
  const yLabel = q2.axisLabel || q2.questionText

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          
          {/* Highlight upper-right quadrant */}
          <defs>
            <linearGradient id="quadrantFill" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.03} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          
          <XAxis
            type="number"
            dataKey="x"
            domain={[minElo, maxElo]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{
              value: `${xLabel} →`,
              position: "bottom",
              offset: 40,
              fill: "hsl(var(--foreground))",
              fontSize: 13,
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[minElo, maxElo]}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={{ stroke: "hsl(var(--border))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            label={{
              value: `${yLabel} →`,
              angle: -90,
              position: "left",
              offset: 40,
              fill: "hsl(var(--foreground))",
              fontSize: 13,
            }}
          />
          
          <ReferenceLine x={midPoint} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <ReferenceLine y={midPoint} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="hsl(var(--primary))"
                r={5}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
        {scatterData
          .filter(d => d.isEasyWin)
          .map(d => (
            <span key={d.id} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {d.name}
            </span>
          ))}
        {scatterData.filter(d => d.isEasyWin).length === 0 && (
          <span>Hover over dots to see item details</span>
        )}
      </div>
    </div>
  )
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScatterDataPoint }> }) {
  if (!active || !payload || payload.length === 0) return null

  const data = payload[0].payload

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {data.q1Label}: rank {data.q1Rank} of {data.totalItems}
      </p>
      <p className="text-sm text-muted-foreground">
        {data.q2Label}: rank {data.q2Rank} of {data.totalItems}
      </p>
    </div>
  )
}
