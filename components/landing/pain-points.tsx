export function PainPoints() {
  const pains = [
    {
      headline: "Meetings that go nowhere",
      body: "Three hours of debate and you still don't have a decision.",
    },
    {
      headline: "Stuck in the middle",
      body: "Sales says one thing. Engineering says another. Product owns the call but feels caught between them.",
    },
    {
      headline: "The loudest voice wins",
      body: "The roadmap gets shaped by who talks the most, not by what the data says.",
    },
  ]

  return (
    <section className="px-6 py-20 md:px-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-2xl font-semibold text-foreground md:text-3xl">
          Sound familiar?
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {pains.map((pain, index) => (
            <div
              key={index}
              className="rounded-xl bg-stone-50 p-6 shadow-sm"
            >
              {/* Orange accent bar */}
              <div className="mb-4 h-1 w-10 rounded-full bg-primary" />
              
              <h3 className="text-lg font-bold leading-tight text-foreground">
                {pain.headline}
              </h3>
              <p className="mt-2 text-sm leading-snug text-gray-600">
                {pain.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
