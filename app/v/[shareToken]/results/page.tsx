"use client"

import { useEffect, useState } from "react"
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
  LabelList,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface RankedItem {
  id: string
  name: string
  description: string | null
  elo: number
}

interface QuestionResult {
  questionId: string
  questionText: string
  axisLabel: string | null
  audienceName: string
  rankedItems: RankedItem[]
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

  const showScatter = data.questions.length === 2

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

        {/* 2D Scatter Chart (only when exactly 2 questions) */}
        {showScatter && (
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>How they compare across both questions</CardTitle>
                <CardDescription>
                  Items in the upper-right are strong on both dimensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScatterPlot questions={data.questions} items={data.items} />
              </CardContent>
            </Card>
          </section>
        )}

        {/* Per-question rankings */}
        <section>
          <h2 className="mb-6 text-xl font-semibold text-foreground">Rankings by Question</h2>
          <div className="space-y-6">
            {data.questions.map((question) => (
              <QuestionRankingCard key={question.questionId} question={question} />
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

function QuestionRankingCard({ question }: { question: QuestionResult }) {
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
              <span className="text-sm text-muted-foreground">{item.elo}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
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

  // Build scatter data: x = q1 elo, y = q2 elo for each item
  const scatterData = items.map((item) => {
    const q1Item = q1.rankedItems.find((r) => r.id === item.id)
    const q2Item = q2.rankedItems.find((r) => r.id === item.id)
    return {
      id: item.id,
      name: item.name,
      x: q1Item?.elo || 1000,
      y: q2Item?.elo || 1000,
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
          <rect
            x={midPoint}
            y={midPoint}
            width={maxElo - midPoint}
            height={maxElo - midPoint}
            fill="url(#quadrantFill)"
          />
          
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
          
          <Scatter data={scatterData} fill="hsl(var(--primary))">
            {scatterData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
            ))}
            <LabelList
              dataKey="name"
              position="top"
              offset={10}
              fill="hsl(var(--foreground))"
              fontSize={11}
            />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
