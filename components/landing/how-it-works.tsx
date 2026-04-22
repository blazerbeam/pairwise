import { Card, CardContent } from "@/components/ui/card"

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
    <section className="bg-muted/30 px-6 py-20 md:px-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground md:text-3xl">
          How it works
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <Card key={step.number} className="bg-background shadow-none">
              <CardContent className="flex gap-4 pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
