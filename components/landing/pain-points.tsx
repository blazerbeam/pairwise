export function PainPoints() {
  const pains = [
    "Three-hour prioritization meetings that end without a decision",
    "Sales says one thing, engineering says another, and product owns the call but feels stuck in the middle",
    "The loudest voice in the room shapes the roadmap, not the data",
  ]

  return (
    <section className="bg-muted/50 px-6 py-20 md:px-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground md:text-3xl">
          Sound familiar?
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pains.map((pain, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-background p-6"
            >
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                {pain}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
