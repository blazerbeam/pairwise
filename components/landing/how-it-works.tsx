const steps = [
  {
    number: "1",
    title: "Add your items",
    description:
      "Paste a list of features, ideas, or options. Each item gets a name and optional description.",
  },
  {
    number: "2",
    title: "Share the link",
    description:
      "Send a unique voting link to your team. Each person answers simple A-or-B comparisons.",
  },
  {
    number: "3",
    title: "See the ranking",
    description:
      "Pairwise computes a ranked list from all votes. No more tie-breaker debates.",
  },
]

export function HowItWorks() {
  return (
    <section className="border-t border-border bg-muted/30 px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          How it works
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
          Three steps to go from chaos to clarity
        </p>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              {/* Step number */}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                {step.number}
              </div>
              
              <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
