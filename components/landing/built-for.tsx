import { Card, CardContent } from "@/components/ui/card"

export function BuiltFor() {
  const audiences = [
    "PMs who want fast alignment without another meeting",
    "Founders who want to know what their team actually thinks",
    "Anyone tired of HiPPO-driven decisions",
  ]

  return (
    <section className="bg-muted/30 px-6 py-20 md:px-12">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
          Built for the people who lead product
        </h2>
        <div className="mt-10 space-y-4">
          {audiences.map((audience, index) => (
            <Card key={index} className="bg-background shadow-none">
              <CardContent className="py-4">
                <p className="text-muted-foreground">
                  {audience}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
