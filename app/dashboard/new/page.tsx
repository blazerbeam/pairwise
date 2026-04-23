"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent } from "@/components/ui/card"
import { createPairwise } from "./actions"

// Template definitions
const TEMPLATES = [
  {
    id: "value-effort",
    name: "Value vs Effort",
    audiences: [
      { name: "Product", questions: [{ text: "Which would have more impact on our goals?", axis_label: "Impact" }] },
      { name: "Engineering", questions: [{ text: "Which would be faster to build?", axis_label: "Effort" }] },
    ],
  },
  {
    id: "revenue-risk",
    name: "Revenue vs Risk",
    audiences: [
      { name: "Sales", questions: [{ text: "Which would drive more revenue?", axis_label: "Revenue" }] },
      { name: "Finance", questions: [{ text: "Which carries less risk?", axis_label: "Risk" }] },
    ],
  },
  {
    id: "impact-urgency",
    name: "Impact vs Urgency",
    audiences: [
      { name: "Leadership", questions: [{ text: "Which has greater long-term impact?", axis_label: "Impact" }] },
      { name: "Team", questions: [{ text: "Which is more urgent right now?", axis_label: "Urgency" }] },
    ],
  },
  {
    id: "scratch",
    name: "Start from scratch",
    audiences: [],
  },
]

interface ItemRow {
  id: string
  name: string
  description: string
}

interface QuestionRow {
  id: string
  text: string
  axis_label: string
}

interface AudienceRow {
  id: string
  name: string
  questions: QuestionRow[]
}

interface CreatedPairwise {
  id: string
  name: string
  share_token: string
}

export default function NewPairwisePage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [items, setItems] = useState<ItemRow[]>([
    { id: "1", name: "", description: "" },
    { id: "2", name: "", description: "" },
    { id: "3", name: "", description: "" },
  ])
  const [audiences, setAudiences] = useState<AudienceRow[]>([])
  const [audiencesExpanded, setAudiencesExpanded] = useState(true)

  // Post-create state
  const [createdPairwise, setCreatedPairwise] = useState<CreatedPairwise | null>(null)
  const [copied, setCopied] = useState(false)

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      if (template.audiences.length > 0) {
        // Pre-fill audiences and questions
        setAudiences(
          template.audiences.map((a, i) => ({
            id: `aud-${i}`,
            name: a.name,
            questions: a.questions.map((q, j) => ({
              id: `q-${i}-${j}`,
              text: q.text,
              axis_label: q.axis_label,
            })),
          }))
        )
        setAudiencesExpanded(false) // Collapse when template has audiences
      } else {
        // Start from scratch
        setAudiences([])
        setAudiencesExpanded(true)
      }
    }
  }

  // Item handlers
  const handleItemChange = (id: string, field: "name" | "description", value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: `item-${Date.now()}`, name: "", description: "" }])
  }

  const handleRemoveItem = (id: string) => {
    if (items.length <= 2) return // Keep at least 2 items
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  // Audience handlers
  const handleAddAudience = () => {
    setAudiences((prev) => [
      ...prev,
      { id: `aud-${Date.now()}`, name: "", questions: [{ id: `q-${Date.now()}`, text: "", axis_label: "" }] },
    ])
  }

  const handleRemoveAudience = (id: string) => {
    setAudiences((prev) => prev.filter((a) => a.id !== id))
  }

  const handleAudienceNameChange = (id: string, value: string) => {
    setAudiences((prev) => prev.map((a) => (a.id === id ? { ...a, name: value } : a)))
  }

  // Question handlers
  const handleAddQuestion = (audienceId: string) => {
    setAudiences((prev) =>
      prev.map((a) =>
        a.id === audienceId
          ? { ...a, questions: [...a.questions, { id: `q-${Date.now()}`, text: "", axis_label: "" }] }
          : a
      )
    )
  }

  const handleRemoveQuestion = (audienceId: string, questionId: string) => {
    setAudiences((prev) =>
      prev.map((a) =>
        a.id === audienceId ? { ...a, questions: a.questions.filter((q) => q.id !== questionId) } : a
      )
    )
  }

  const handleQuestionChange = (audienceId: string, questionId: string, field: "text" | "axis_label", value: string) => {
    setAudiences((prev) =>
      prev.map((a) =>
        a.id === audienceId
          ? { ...a, questions: a.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)) }
          : a
      )
    )
  }

  // Validation
  const validItems = items.filter((i) => i.name.trim())
  const validAudiences = audiences.filter((a) => a.name.trim() && a.questions.some((q) => q.text.trim()))
  const canCreate = name.trim() && validItems.length >= 2 && validAudiences.length >= 1

  // Submit handler
  const handleCreate = () => {
    if (!canCreate) return
    setError(null)

    startTransition(async () => {
      try {
        const pairwise = await createPairwise(
          name.trim(),
          validItems.map((i, idx) => ({ name: i.name.trim(), description: i.description.trim() || null, position: idx })),
          validAudiences.map((a, aIdx) => ({
            name: a.name.trim(),
            position: aIdx,
            questions: a.questions
              .filter((q) => q.text.trim())
              .map((q, qIdx) => ({
                text: q.text.trim(),
                axis_label: q.axis_label.trim() || null,
                position: qIdx,
              })),
          }))
        )
        setCreatedPairwise(pairwise)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create pairwise")
      }
    })
  }

  // Copy URL handler
  const handleCopyUrl = async () => {
    if (!createdPairwise) return
    const url = `${window.location.origin}/v/${createdPairwise.share_token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // If created, show share screen
  if (createdPairwise) {
    const votingUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/v/${createdPairwise.share_token}`

    return (
      <div className="mx-auto max-w-xl space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">Pairwise created!</h1>
          <p className="mt-2 text-muted-foreground">
            Share this link with your voters to start collecting votes for{" "}
            <span className="font-medium text-foreground">{createdPairwise.name}</span>
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Copy link input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Voting link</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={votingUrl}
                  className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm"
                />
                <button
                  onClick={handleCopyUrl}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* QR code */}
            <div className="flex justify-center rounded-lg border bg-white p-6">
              <QRCodeSVG value={votingUrl} size={180} />
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* Section 1: Template picker */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Choose a template</h2>
        <div className="grid grid-cols-2 gap-4">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template.id)}
              className={`rounded-lg border p-4 text-left transition-all ${
                selectedTemplate === template.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <span className="font-medium text-foreground">{template.name}</span>
              {template.audiences.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {template.audiences.map((a) => a.name).join(" + ")}
                </p>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Section 2: Name */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Name your pairwise</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Q3 Feature Prioritization"
          className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </section>

      {/* Section 3: Items */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Items to compare</h2>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3">
              <span className="mt-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
                  placeholder="Item name (required)"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
              {items.length > 2 && (
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="mt-3 text-muted-foreground hover:text-red-600 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddItem}
            className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            + Add item
          </button>
        </div>
      </section>

      {/* Section 4: Audiences & Questions */}
      <section className="space-y-4">
        <button
          onClick={() => setAudiencesExpanded(!audiencesExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-foreground">Audiences & questions</h2>
          <span className="text-muted-foreground">{audiencesExpanded ? "−" : "+"}</span>
        </button>

        {audiencesExpanded && (
          <div className="space-y-6">
            {audiences.map((audience) => (
              <div key={audience.id} className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={audience.name}
                    onChange={(e) => handleAudienceNameChange(audience.id, e.target.value)}
                    placeholder="Audience name (e.g., Engineering)"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemoveAudience(audience.id)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Questions for this audience */}
                <div className="ml-4 space-y-3 border-l-2 border-muted pl-4">
                  {audience.questions.map((question) => (
                    <div key={question.id} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={question.text}
                            onChange={(e) => handleQuestionChange(audience.id, question.id, "text", e.target.value)}
                            placeholder="Question text (e.g., Which is more important?)"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            value={question.axis_label}
                            onChange={(e) => handleQuestionChange(audience.id, question.id, "axis_label", e.target.value)}
                            placeholder="Axis label for results (e.g., Impact)"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-muted-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        {audience.questions.length > 1 && (
                          <button
                            onClick={() => handleRemoveQuestion(audience.id, question.id)}
                            className="mt-2 text-muted-foreground hover:text-red-600 transition-colors text-sm"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => handleAddQuestion(audience.id)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    + Add question
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddAudience}
              className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + Add audience
            </button>
          </div>
        )}

        {!audiencesExpanded && audiences.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {audiences.length} audience{audiences.length !== 1 ? "s" : ""} configured:{" "}
            {audiences.map((a) => a.name).join(", ")}
          </p>
        )}
      </section>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Create button */}
      <section className="border-t pt-6">
        <button
          onClick={handleCreate}
          disabled={!canCreate || isPending}
          className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating..." : "Create pairwise"}
        </button>
        {!canCreate && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {!name.trim() && "Name required. "}
            {validItems.length < 2 && "At least 2 items required. "}
            {validAudiences.length < 1 && "At least 1 audience with a question required."}
          </p>
        )}
      </section>
    </div>
  )
}
