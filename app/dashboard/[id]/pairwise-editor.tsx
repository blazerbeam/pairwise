"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  updatePairwise,
  addAudience,
  updateAudience,
  deleteAudience,
  addItem,
  updateItem,
  deleteItem,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  activatePairwise,
} from "./actions"

interface Pairwise {
  id: string
  name: string
  description: string | null
  status: string
  share_token: string
  show_results_to_voters: boolean
}

interface Audience {
  id: string
  name: string
  position: number
}

interface Item {
  id: string
  name: string
  description: string | null
  position: number
}

interface Question {
  id: string
  audience_id: string
  text: string
  axis_label: string | null
  position: number
}

interface PairwiseEditorProps {
  pairwise: Pairwise
  audiences: Audience[]
  items: Item[]
  questions: Question[]
  voterCount: number
}

export function PairwiseEditor({
  pairwise: initialPairwise,
  audiences: initialAudiences,
  items: initialItems,
  questions: initialQuestions,
  voterCount,
}: PairwiseEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Local state
  const [pairwise, setPairwise] = useState(initialPairwise)
  const [audiences, setAudiences] = useState(initialAudiences)
  const [items, setItems] = useState(initialItems)
  const [questions, setQuestions] = useState(initialQuestions)

  // UI state
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"setup" | "share">("setup")
  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)

  const votingUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/v/${pairwise.share_token}`
    : `/v/${pairwise.share_token}`

  const resultsUrl = typeof window !== "undefined"
    ? `${window.location.origin}/v/${pairwise.share_token}/results`
    : `/v/${pairwise.share_token}/results`

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(votingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Pairwise handlers
  const handleUpdateName = (name: string) => {
    if (!name.trim()) return
    startTransition(async () => {
      await updatePairwise(pairwise.id, { name: name.trim() })
      setPairwise((p) => ({ ...p, name: name.trim() }))
      setEditingName(false)
    })
  }

  const handleUpdateDescription = (description: string) => {
    startTransition(async () => {
      await updatePairwise(pairwise.id, { description: description.trim() || null })
      setPairwise((p) => ({ ...p, description: description.trim() || null }))
      setEditingDescription(false)
    })
  }

  const handleActivate = () => {
    if (items.length < 2) {
      alert("Add at least 2 items before activating")
      return
    }
    if (audiences.length === 0) {
      alert("Add at least 1 audience before activating")
      return
    }
    if (questions.length === 0) {
      alert("Add at least 1 question before activating")
      return
    }

    startTransition(async () => {
      await activatePairwise(pairwise.id)
      setPairwise((p) => ({ ...p, status: "active" }))
    })
  }

  // Audience handlers
  const handleAddAudience = () => {
    const name = prompt("Audience name (e.g., Engineering, Sales)")
    if (!name?.trim()) return

    startTransition(async () => {
      const audience = await addAudience(pairwise.id, name.trim(), audiences.length)
      setAudiences((a) => [...a, audience])
    })
  }

  const handleUpdateAudience = (id: string, name: string) => {
    if (!name.trim()) return
    startTransition(async () => {
      await updateAudience(id, { name: name.trim() })
      setAudiences((a) => a.map((aud) => (aud.id === id ? { ...aud, name: name.trim() } : aud)))
    })
  }

  const handleDeleteAudience = (id: string) => {
    if (!confirm("Delete this audience? Questions for this audience will also be deleted.")) return
    startTransition(async () => {
      await deleteAudience(id)
      setAudiences((a) => a.filter((aud) => aud.id !== id))
      setQuestions((q) => q.filter((que) => que.audience_id !== id))
    })
  }

  // Item handlers
  const handleAddItem = () => {
    const name = prompt("Item name")
    if (!name?.trim()) return

    startTransition(async () => {
      const item = await addItem(pairwise.id, name.trim(), null, items.length)
      setItems((i) => [...i, item])
    })
  }

  const handleUpdateItem = (id: string, updates: { name?: string; description?: string | null }) => {
    startTransition(async () => {
      await updateItem(id, updates)
      setItems((i) => i.map((item) => (item.id === id ? { ...item, ...updates } : item)))
    })
  }

  const handleDeleteItem = (id: string) => {
    if (!confirm("Delete this item?")) return
    startTransition(async () => {
      await deleteItem(id)
      setItems((i) => i.filter((item) => item.id !== id))
    })
  }

  // Question handlers
  const handleAddQuestion = (audienceId: string) => {
    const text = prompt("Question text (e.g., Which is more important?)")
    if (!text?.trim()) return

    const axisLabel = prompt("Axis label for results chart (e.g., Importance, Effort)") || null

    startTransition(async () => {
      const question = await addQuestion(
        pairwise.id,
        audienceId,
        text.trim(),
        axisLabel?.trim() || null,
        questions.filter((q) => q.audience_id === audienceId).length
      )
      setQuestions((q) => [...q, question])
    })
  }

  const handleUpdateQuestion = (id: string, updates: { text?: string; axis_label?: string | null }) => {
    startTransition(async () => {
      await updateQuestion(id, updates)
      setQuestions((q) => q.map((que) => (que.id === id ? { ...que, ...updates } : que)))
    })
  }

  const handleDeleteQuestion = (id: string) => {
    if (!confirm("Delete this question?")) return
    startTransition(async () => {
      await deleteQuestion(id)
      setQuestions((q) => q.filter((que) => que.id !== id))
    })
  }

  const isReady = items.length >= 2 && audiences.length >= 1 && questions.length >= 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {editingName ? (
            <input
              autoFocus
              defaultValue={pairwise.name}
              onBlur={(e) => handleUpdateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateName(e.currentTarget.value)
                if (e.key === "Escape") setEditingName(false)
              }}
              className="text-2xl font-semibold bg-transparent border-b border-primary focus:outline-none"
            />
          ) : (
            <h1
              className="text-2xl font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => setEditingName(true)}
            >
              {pairwise.name}
            </h1>
          )}
          {editingDescription ? (
            <textarea
              autoFocus
              defaultValue={pairwise.description || ""}
              onBlur={(e) => handleUpdateDescription(e.target.value)}
              className="w-full text-sm text-muted-foreground bg-transparent border rounded-lg p-2 focus:outline-none focus:border-primary resize-none"
              rows={2}
            />
          ) : (
            <p
              className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={() => setEditingDescription(true)}
            >
              {pairwise.description || "Add a description..."}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              pairwise.status === "active"
                ? "bg-green-50 text-green-700"
                : pairwise.status === "draft"
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {pairwise.status}
          </span>
          <span className="text-sm text-muted-foreground">{voterCount} voters</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("setup")}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === "setup"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Setup
        </button>
        <button
          onClick={() => setActiveTab("share")}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === "share"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Share & Results
        </button>
      </div>

      {activeTab === "setup" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items to Compare</CardTitle>
              <CardDescription>Add the options voters will prioritize</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-2 group">
                  <div className="flex-1 space-y-1">
                    <input
                      defaultValue={item.name}
                      onBlur={(e) => {
                        if (e.target.value !== item.name) {
                          handleUpdateItem(item.id, { name: e.target.value })
                        }
                      }}
                      className="w-full text-sm font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                    />
                    <input
                      defaultValue={item.description || ""}
                      placeholder="Description (optional)"
                      onBlur={(e) => {
                        if (e.target.value !== (item.description || "")) {
                          handleUpdateItem(item.id, { description: e.target.value || null })
                        }
                      }}
                      className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddItem}
                disabled={isPending}
                className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Add item
              </button>
            </CardContent>
          </Card>

          {/* Audiences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audiences</CardTitle>
              <CardDescription>Different groups who will vote (each can have different questions)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {audiences.map((audience) => (
                <div key={audience.id} className="space-y-2">
                  <div className="flex items-center gap-2 group">
                    <input
                      defaultValue={audience.name}
                      onBlur={(e) => {
                        if (e.target.value !== audience.name) {
                          handleUpdateAudience(audience.id, e.target.value)
                        }
                      }}
                      className="flex-1 text-sm font-medium bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={() => handleDeleteAudience(audience.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all text-sm"
                    >
                      ×
                    </button>
                  </div>
                  {/* Questions for this audience */}
                  <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                    {questions
                      .filter((q) => q.audience_id === audience.id)
                      .map((question) => (
                        <div key={question.id} className="flex items-start gap-2 group">
                          <div className="flex-1 space-y-1">
                            <input
                              defaultValue={question.text}
                              onBlur={(e) => {
                                if (e.target.value !== question.text) {
                                  handleUpdateQuestion(question.id, { text: e.target.value })
                                }
                              }}
                              className="w-full text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                            />
                            <input
                              defaultValue={question.axis_label || ""}
                              placeholder="Axis label (optional)"
                              onBlur={(e) => {
                                if (e.target.value !== (question.axis_label || "")) {
                                  handleUpdateQuestion(question.id, { axis_label: e.target.value || null })
                                }
                              }}
                              className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600 transition-all text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    <button
                      onClick={() => handleAddQuestion(audience.id)}
                      disabled={isPending}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      + Add question
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddAudience}
                disabled={isPending}
                className="w-full rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Add audience
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "share" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Share card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Share Voting Link</CardTitle>
              <CardDescription>Send this link to your voters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex justify-center rounded-lg border bg-white p-4">
                <QRCodeSVG value={votingUrl} size={160} />
              </div>
            </CardContent>
          </Card>

          {/* Results card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
              <CardDescription>View aggregated rankings from all voters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {voterCount === 0
                  ? "No votes yet. Share the link to start collecting votes."
                  : `${voterCount} voter${voterCount !== 1 ? "s" : ""} completed.`}
              </p>
              <a
                href={resultsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                View Results →
              </a>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer actions */}
      {pairwise.status === "draft" && (
        <div className="flex items-center justify-between border-t pt-6">
          <p className="text-sm text-muted-foreground">
            {isReady
              ? "Ready to go! Activate to start collecting votes."
              : `Need: ${items.length < 2 ? "2+ items" : ""}${items.length < 2 && audiences.length < 1 ? ", " : ""}${audiences.length < 1 ? "1+ audience" : ""}${(items.length < 2 || audiences.length < 1) && questions.length < 1 ? ", " : ""}${questions.length < 1 ? "1+ question" : ""}`}
          </p>
          <button
            onClick={handleActivate}
            disabled={!isReady || isPending}
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Activate Pairwise
          </button>
        </div>
      )}

      {/* Back link */}
      <div className="pt-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to all pairwises
        </button>
      </div>
    </div>
  )
}
