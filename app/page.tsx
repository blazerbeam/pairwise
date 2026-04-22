import { Nav } from "@/components/landing/nav"
import { HeroSection } from "@/components/landing/hero-section"
import { PainPoints } from "@/components/landing/pain-points"
import { HowItWorks } from "@/components/landing/how-it-works"
import { KillerMove } from "@/components/landing/killer-move"
import { BuiltFor } from "@/components/landing/built-for"
import { WaitlistSection } from "@/components/landing/waitlist-section"
import { Footer } from "@/components/landing/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <HeroSection />
      <PainPoints />
      <HowItWorks />
      <KillerMove />
      <BuiltFor />
      <WaitlistSection />
      <Footer />
    </main>
  )
}
