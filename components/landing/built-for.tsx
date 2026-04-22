export function BuiltFor() {
  const audiences = [
    "PMs who want fast alignment without another meeting",
    "Founders who want to know what their team actually thinks",
    "Anyone tired of HiPPO-driven decisions",
  ]

  return (
    <section className="px-6 py-20 md:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
          Built for the people who lead product
        </h2>
        <ul className="mt-8 space-y-3">
          {audiences.map((audience, index) => (
            <li
              key={index}
              className="text-muted-foreground"
            >
              {audience}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
