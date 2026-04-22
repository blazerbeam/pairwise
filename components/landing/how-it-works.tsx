export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Add your items and your audiences",
      description:
        "Items are what you're prioritizing. Audiences are the groups whose opinions matter (Sales, Engineering, Product Leadership).",
    },
    {
      number: 2,
      title: "Ask each audience the question that fits them",
      description:
        'Engineering gets "which would be easier to build?" Sales gets "which would customers value most?" Each team answers what only they can answer.',
    },
    {
      number: 3,
      title: "Everyone votes — one comparison at a time, in 2 minutes",
      description:
        "No long surveys. Two cards, one question, pick one. Repeat. Works on phone or desktop.",
    },
    {
      number: 4,
      title: "See the ranked results, plus the 2D scatter",
      description:
        "Stack-ranked list per question. With multiple questions, see the 2D plot that shows the obvious wins.",
    },
  ]

  return (
    <section className="px-6 py-20 md:px-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground md:text-3xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                {step.number}
              </div>
              <div>
                <h3 className="font-medium text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
