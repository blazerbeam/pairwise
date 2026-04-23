"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
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
  template: string | null
}

// Quadrant color scheme - pastel fills with saturated dot colors
// Value vs Effort template uses these exact colors at full opacity
const QUADRANT_COLORS = {
  upperRight: { fill: "#D1F2DD", fillOpacity: 1, dot: "#3FA968", border: "#2E8B57", label: "#2E7D52" }, // Green - Quick wins
  upperLeft:  { fill: "#FAD9E5", fillOpacity: 1, dot: "#D85C8C", border: "#C44D7D", label: "#B84574" }, // Pink - Fill-ins
  lowerRight: { fill: "#D4E6F7", fillOpacity: 1, dot: "#2E7BC4", border: "#1E5A9C", label: "#1E5A9C" }, // Blue - Big projects
  lowerLeft:  { fill: "#E8E8E8", fillOpacity: 1, dot: "#6B6B6B", border: "#525252", label: "#525252" }, // Gray - Time sinks
}

// Custom pairwise fallback (no template) - all neutral
const CUSTOM_QUADRANT_COLORS = {
  fill: "#E8E8E8",
  fillOpacity: 0.10,
  dot: "hsl(var(--primary))", // Brand accent color
  border: "hsl(var(--primary))",
}

// Named quadrants by template - EXACT strings per spec
const QUADRANT_LABELS: Record<string, { upperRight: string; upperLeft: string; lowerRight: string; lowerLeft: string; xAxis: string; yAxis: string }> = {
  value_vs_effort: {
    upperRight: "QUICK WINS",      // high Impact, easy Effort
    upperLeft: "FILL-INS",         // low Impact, easy Effort  
    lowerRight: "BIG PROJECTS",    // high Impact, hard Effort
    lowerLeft: "TIME SINKS",       // low Impact, hard Effort
    xAxis: "IMPACT",
    yAxis: "EFFORT (EASIER →)",
  },
  revenue_vs_risk: {
    upperRight: "SAFE BETS",
    upperLeft: "HIGH REWARD",
    lowerRight: "LOW RISK, LOW REWARD",
    lowerLeft: "RISKY & LOW VALUE",
    xAxis: "REVENUE",
    yAxis: "RISK (LOWER →)",
  },
  impact_vs_urgency: {
    upperRight: "DO NOW",
    upperLeft: "PLAN FOR LATER",
    lowerRight: "QUICK WINS",
    lowerLeft: "DEPRIORITIZE",
    xAxis: "IMPACT",
    yAxis: "URGENCY",
  },
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
                  <ScatterPlot questions={data.questions} items={data.items} template={data.template} />
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
  x: number // Inverted rank (higher = better)
  y: number // Inverted rank (higher = better)
  q1Rank: number
  q2Rank: number
  totalItems: number
  q1Label: string
  q2Label: string
  quadrant: "upperRight" | "upperLeft" | "lowerRight" | "lowerLeft"
}

function ScatterPlot({
  questions,
  items,
  template,
}: {
  questions: QuestionResult[]
  items: { id: string; name: string }[]
  template: string | null
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  if (questions.length !== 2) return null

  const q1 = questions[0]
  const q2 = questions[1]

  // Get quadrant labels from template or use axis labels as fallback
  const quadrantConfig = template ? QUADRANT_LABELS[template] : null
  const hasTemplate = !!template && !!quadrantConfig
  const xLabel = quadrantConfig?.xAxis || (q1.axisLabel?.toUpperCase()) || q1.questionText.toUpperCase()
  const yLabel = quadrantConfig?.yAxis || (q2.axisLabel?.toUpperCase()) || q2.questionText.toUpperCase()

  // Build scatter data using ranks (inverted so higher rank = higher position)
  const totalItems = items.length
  const midPoint = (totalItems + 1) / 2
  
  const scatterData: ScatterDataPoint[] = items.map((item) => {
    const q1Item = q1.rankedItems.find((r) => r.id === item.id)
    const q2Item = q2.rankedItems.find((r) => r.id === item.id)
    // Invert ranks so rank 1 = highest position on chart
    const x = totalItems - (q1Item?.rank || totalItems) + 1
    const y = totalItems - (q2Item?.rank || totalItems) + 1
    
    // Determine quadrant
    const isHighX = x > midPoint
    const isHighY = y > midPoint
    let quadrant: "upperRight" | "upperLeft" | "lowerRight" | "lowerLeft"
    if (isHighX && isHighY) quadrant = "upperRight"
    else if (!isHighX && isHighY) quadrant = "upperLeft"
    else if (isHighX && !isHighY) quadrant = "lowerRight"
    else quadrant = "lowerLeft"
    
    return {
      id: item.id,
      name: item.name,
      x,
      y,
      q1Rank: q1Item?.rank || 0,
      q2Rank: q2Item?.rank || 0,
      totalItems,
      q1Label: q1.axisLabel || q1.questionText,
      q2Label: q2.axisLabel || q2.questionText,
      quadrant,
    }
  })

  // Calculate axis bounds
  const minVal = 0.5
  const maxVal = totalItems + 0.5

  // Get dot color based on quadrant and template
  const getDotColor = (quadrant: string) => {
    if (!hasTemplate) return CUSTOM_QUADRANT_COLORS.dot
    return QUADRANT_COLORS[quadrant as keyof typeof QUADRANT_COLORS]?.dot || CUSTOM_QUADRANT_COLORS.dot
  }
  
  const getDotBorder = (quadrant: string) => {
    if (!hasTemplate) return CUSTOM_QUADRANT_COLORS.border
    return QUADRANT_COLORS[quadrant as keyof typeof QUADRANT_COLORS]?.border || CUSTOM_QUADRANT_COLORS.border
  }

  // Generate custom quadrant labels for non-template pairwises
  const getCustomQuadrantLabel = (position: "upperRight" | "upperLeft" | "lowerRight" | "lowerLeft") => {
    const xAxisLabel = q1.axisLabel || "X"
    const yAxisLabel = q2.axisLabel || "Y"
    switch (position) {
      case "upperRight": return `HIGH ${yAxisLabel}, HIGH ${xAxisLabel}`
      case "upperLeft": return `HIGH ${yAxisLabel}, LOW ${xAxisLabel}`
      case "lowerRight": return `LOW ${yAxisLabel}, HIGH ${xAxisLabel}`
      case "lowerLeft": return `LOW ${yAxisLabel}, LOW ${xAxisLabel}`
    }
  }

  return (
    <div className="relative">
      {/* Quadrant labels - positioned in top-inner corner of each quadrant */}
      <div className="pointer-events-none absolute inset-0" style={{ margin: "20px 30px 60px 60px" }}>
        <div className="relative h-full w-full">
          {/* Upper right label */}
          <span 
            className="absolute text-[11px] font-medium tracking-wide"
            style={{ 
              right: "14px", 
              top: "calc(50% - 32px)", 
              color: hasTemplate ? QUADRANT_COLORS.upperRight.label : "#737373",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {quadrantConfig?.upperRight || getCustomQuadrantLabel("upperRight")}
          </span>
          {/* Upper left label */}
          <span 
            className="absolute text-[11px] font-medium tracking-wide"
            style={{ 
              left: "14px", 
              top: "calc(50% - 32px)", 
              color: hasTemplate ? QUADRANT_COLORS.upperLeft.label : "#737373",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {quadrantConfig?.upperLeft || getCustomQuadrantLabel("upperLeft")}
          </span>
          {/* Lower right label */}
          <span 
            className="absolute text-[11px] font-medium tracking-wide"
            style={{ 
              right: "14px", 
              bottom: "calc(50% - 32px)", 
              color: hasTemplate ? QUADRANT_COLORS.lowerRight.label : "#737373",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {quadrantConfig?.lowerRight || getCustomQuadrantLabel("lowerRight")}
          </span>
          {/* Lower left label */}
          <span 
            className="absolute text-[11px] font-medium tracking-wide"
            style={{ 
              left: "14px", 
              bottom: "calc(50% - 32px)", 
              color: hasTemplate ? QUADRANT_COLORS.lowerLeft.label : "#737373",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {quadrantConfig?.lowerLeft || getCustomQuadrantLabel("lowerLeft")}
          </span>
        </div>
      </div>
      
      <div className="h-[380px] w-full rounded-lg bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 24, right: 40, bottom: 60, left: 60 }}>
            {/* Quadrant background fills - pastel colors */}
            {hasTemplate ? (
              <>
                <ReferenceArea 
                  x1={minVal} x2={midPoint} y1={minVal} y2={midPoint} 
                  fill={QUADRANT_COLORS.lowerLeft.fill} 
                  fillOpacity={QUADRANT_COLORS.lowerLeft.fillOpacity} 
                />
                <ReferenceArea 
                  x1={midPoint} x2={maxVal} y1={minVal} y2={midPoint} 
                  fill={QUADRANT_COLORS.lowerRight.fill} 
                  fillOpacity={QUADRANT_COLORS.lowerRight.fillOpacity} 
                />
                <ReferenceArea 
                  x1={minVal} x2={midPoint} y1={midPoint} y2={maxVal} 
                  fill={QUADRANT_COLORS.upperLeft.fill} 
                  fillOpacity={QUADRANT_COLORS.upperLeft.fillOpacity} 
                />
                <ReferenceArea 
                  x1={midPoint} x2={maxVal} y1={midPoint} y2={maxVal} 
                  fill={QUADRANT_COLORS.upperRight.fill} 
                  fillOpacity={QUADRANT_COLORS.upperRight.fillOpacity} 
                />
              </>
            ) : (
              <>
                <ReferenceArea 
                  x1={minVal} x2={midPoint} y1={minVal} y2={midPoint} 
                  fill={CUSTOM_QUADRANT_COLORS.fill} 
                  fillOpacity={CUSTOM_QUADRANT_COLORS.fillOpacity} 
                />
                <ReferenceArea 
                  x1={midPoint} x2={maxVal} y1={minVal} y2={midPoint} 
                  fill={CUSTOM_QUADRANT_COLORS.fill} 
                  fillOpacity={CUSTOM_QUADRANT_COLORS.fillOpacity} 
                />
                <ReferenceArea 
                  x1={minVal} x2={midPoint} y1={midPoint} y2={maxVal} 
                  fill={CUSTOM_QUADRANT_COLORS.fill} 
                  fillOpacity={CUSTOM_QUADRANT_COLORS.fillOpacity} 
                />
                <ReferenceArea 
                  x1={midPoint} x2={maxVal} y1={midPoint} y2={maxVal} 
                  fill={CUSTOM_QUADRANT_COLORS.fill} 
                  fillOpacity={CUSTOM_QUADRANT_COLORS.fillOpacity} 
                />
              </>
            )}
            
            <XAxis
              type="number"
              dataKey="x"
              domain={[minVal, maxVal]}
              tick={false}
              tickLine={false}
              axisLine={false}
              label={{
                value: `${xLabel} →`,
                position: "bottom",
                offset: 24,
                fill: "#525252",
                fontSize: 11,
                style: { textTransform: "uppercase", letterSpacing: "0.05em" },
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[minVal, maxVal]}
              tick={false}
              tickLine={false}
              axisLine={false}
              label={{
                value: `↑ ${yLabel}`,
                angle: -90,
                position: "left",
                offset: 24,
                fill: "#525252",
                fontSize: 11,
                style: { textTransform: "uppercase", letterSpacing: "0.05em" },
              }}
            />
            
            {/* Median dividers - hairline style */}
            <ReferenceLine x={midPoint} stroke="#D4D4D4" strokeWidth={1} strokeDasharray="4 4" />
            <ReferenceLine y={midPoint} stroke="#D4D4D4" strokeWidth={1} strokeDasharray="4 4" />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Scatter 
              data={scatterData}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {scatterData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getDotColor(entry.quadrant)}
                  stroke={hoveredIndex === index ? "#FFFFFF" : getDotBorder(entry.quadrant)}
                  strokeWidth={2}
                  r={hoveredIndex === index ? 9 : 6}
                  style={{ cursor: "pointer", transition: "all 0.15s ease" }}
                  onMouseEnter={() => setHoveredIndex(index)}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - all items, color-coded by quadrant */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {scatterData.map(d => (
          <span key={d.id} className="flex items-center gap-1.5">
            <span 
              className="h-2.5 w-2.5 rounded-full" 
              style={{ 
                backgroundColor: getDotColor(d.quadrant),
                border: `1.5px solid ${getDotBorder(d.quadrant)}`,
              }} 
            />
            <span className="text-gray-600">{d.name}</span>
          </span>
        ))}
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
