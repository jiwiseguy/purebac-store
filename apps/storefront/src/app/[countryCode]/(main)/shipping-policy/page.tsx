import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping Policy — PureBac",
  description: "PureBac order processing, shipping rates, and delivery times.",
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-[#0d1f3c] mt-8 mb-2">{children}</h2>
)

export default function ShippingPolicyPage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <h1 className="text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
        Shipping Policy
      </h1>
      <p className="mt-2 text-sm text-[#6a8aaa]">Last updated: June 20, 2026</p>

      <div className="mt-8 text-sm leading-relaxed text-[#41506a]">
        <H2>Where we ship</H2>
        <p>
          We currently ship within the United States only. We are unable to ship
          internationally at this time.
        </p>

        <H2>Processing time</H2>
        <p>
          Orders are processed within 1–2 business days. Orders placed on weekends
          or holidays are processed the next business day.
        </p>

        <H2>Rates &amp; delivery</H2>
        <p>
          Standard shipping is a flat <strong>$6.95</strong> and typically arrives
          in <strong>3–5 business days</strong> after processing. The 10-Pack
          Bundle includes priority shipping at no extra charge. Delivery estimates
          are not guaranteed and may be affected by carrier delays.
        </p>

        <H2>Discreet packaging</H2>
        <p>
          All orders ship in plain, discreet packaging. A certificate of analysis
          may be included with your shipment.
        </p>

        <H2>Tracking</H2>
        <p>
          You&apos;ll receive a tracking number by email once your order ships. If
          your tracking hasn&apos;t updated within a few business days, contact us
          and we&apos;ll help.
        </p>

        <H2>Lost or delayed packages</H2>
        <p>
          If a package is lost or significantly delayed in transit, email{" "}
          <a className="text-[#1e6fbe] hover:underline" href="mailto:purebackwater1@gmail.com">
            purebackwater1@gmail.com
          </a>{" "}
          and we&apos;ll work with the carrier to resolve it.
        </p>
      </div>
    </div>
  )
}
