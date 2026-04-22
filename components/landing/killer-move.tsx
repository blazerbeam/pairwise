export function KillerMove() {
  return (
    <section className="bg-muted/50 px-6 py-20 md:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Different teams know different things.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
            Pairwise lets each team answer the question only they can answer — then plots the results so the obvious wins jump off the page.
          </p>
        </div>

        {/* 2D Scatter Plot Mockup */}
        <div className="mx-auto mt-12 max-w-lg">
          <div className="relative aspect-square rounded-lg border border-border bg-background p-8">
            {/* Y-axis label */}
            <div className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground">
              More valuable →
            </div>
            
            {/* X-axis label */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground">
              Easier to build →
            </div>

            {/* Grid lines */}
            <svg className="absolute inset-8" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Vertical grid lines */}
              <line x1="25" y1="0" x2="25" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              <line x1="75" y1="0" x2="75" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              {/* Horizontal grid lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-border" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </svg>

            {/* Data points */}
            <svg className="absolute inset-8" viewBox="0 0 100 100">
              {/* Low value, hard to build */}
              <circle cx="20" cy="70" r="4" className="fill-muted-foreground/40" />
              {/* Medium value, medium difficulty */}
              <circle cx="45" cy="55" r="4" className="fill-muted-foreground/40" />
              {/* High value, hard to build */}
              <circle cx="30" cy="25" r="4" className="fill-muted-foreground/40" />
              {/* Low value, easy to build */}
              <circle cx="70" cy="80" r="4" className="fill-muted-foreground/40" />
              {/* HIGH VALUE, EASY TO BUILD - the winner */}
              <circle cx="82" cy="15" r="6" className="fill-primary" />
            </svg>

            {/* Label for the winner */}
            <div className="absolute right-12 top-12 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Slack integration
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
