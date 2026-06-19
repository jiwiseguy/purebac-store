import { Metadata } from "next"

import Hero from "@modules/home/components/hero"
import PureBacLanding from "@modules/home/components/purebac-landing"
import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "PureBac — Pharmaceutical-Grade Reconstitution Water",
  description:
    "USP-compliant reconstitution water with 0.9% benzyl alcohol. Third-party lab tested for purity and consistency. Made in the USA.",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: { limit: 6 },
  })

  return (
    <>
      <Hero />
      <PureBacLanding products={products} />
    </>
  )
}
