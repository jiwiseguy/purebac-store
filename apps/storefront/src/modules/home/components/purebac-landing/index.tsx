import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const money = (amount?: number, currency = "USD") =>
  amount == null
    ? ""
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount)

const BULLETS: Record<string, string[]> = {
  "bac-water-30ml": [
    "0.9% benzyl alcohol",
    "30 mL multiple-use vial",
    "Safe 28 days post-open",
    "Third-party lab tested",
  ],
  "bac-water-30ml-10pack": [
    "10 × 30 mL sterile vials",
    "Priority shipping included",
    "Lowest per-vial price",
    "Third-party lab tested",
  ],
}

type Props = {
  products: HttpTypes.StoreProduct[]
}

const PureBacLanding = ({ products }: Props) => {
  const sorted = [...products].sort(
    (a, b) =>
      (a.variants?.[0]?.calculated_price?.calculated_amount ?? 0) -
      (b.variants?.[0]?.calculated_price?.calculated_amount ?? 0)
  )

  return (
    <div className="w-full">
      {/* ── Trust strip ─────────────────────────────────────────── */}
      <div className="bg-[#0d1f3c] text-white">
        <div className="content-container flex flex-wrap items-center justify-center gap-x-10 gap-y-2 py-3 text-xs small:text-sm font-medium">
          <span>✓ Third-party lab tested</span>
          <span>✓ USP-compliant · 0.9% Benzyl Alcohol</span>
          <span>✓ Made in the USA</span>
        </div>
      </div>

      {/* ── Products ────────────────────────────────────────────── */}
      <section id="products" className="content-container py-20 small:py-24">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1e6fbe]">
            Products
          </span>
          <h2 className="mt-2 text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
            Choose Your Size
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-[#41506a]">
            Every vial is individually sealed, sterile-filtered, and
            third-party lab tested for purity and consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {sorted.map((p) => {
            const popular = p.handle === "bac-water-30ml"
            const price = money(
              p.variants?.[0]?.calculated_price?.calculated_amount ?? undefined,
              p.variants?.[0]?.calculated_price?.currency_code?.toUpperCase()
            )
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-7 transition-shadow hover:shadow-lg ${
                  popular
                    ? "border-[#1e6fbe] ring-1 ring-[#1e6fbe] shadow-md"
                    : "border-[#dce8f8]"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1e6fbe] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Most Popular
                  </span>
                )}
                <div className="mb-5 overflow-hidden rounded-xl border border-[#eef4fc] bg-[#f5f9ff]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/products/bio-water.png"
                    alt={p.title}
                    className="h-52 w-full object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold text-[#0a0a0a]">
                  {p.title.replace(" Reconstitution Water Vial", "").replace(" — 30 mL Vials", "")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5a6b85] min-h-[60px]">
                  {p.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#0d1f3c]">{price}</span>
                  {p.handle !== "bac-water-30ml-10pack" && (
                    <span className="text-sm text-[#6a8aaa]">/ vial</span>
                  )}
                </div>
                <ul className="mt-5 space-y-2 flex-1">
                  {(BULLETS[p.handle] ?? []).map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-sm text-[#41506a]"
                    >
                      <span className="text-[#1e6fbe]">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <LocalizedClientLink
                  href={`/products/${p.handle}`}
                  className={`mt-6 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-colors ${
                    popular
                      ? "bg-[#1e6fbe] text-white hover:bg-[#155a9e]"
                      : "border border-[#1e6fbe] text-[#1e6fbe] hover:bg-[#f5f9ff]"
                  }`}
                >
                  Add to Cart
                </LocalizedClientLink>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Lab results / why third-party testing ───────────────── */}
      <section id="lab-results" className="bg-[#f5f9ff] border-y border-[#dce8f8]">
        <div className="content-container py-20 small:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1e6fbe]">
              Lab Results
            </span>
            <h2 className="mt-2 text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
              Why Third-Party Testing Matters
            </h2>
            <p className="mt-4 text-[#41506a] leading-relaxed">
              Anyone can print “sterile” on a label. We batch-test through{" "}
              <strong>Vanguard Laboratory</strong>, an independent third party,
              so you can trust exactly what you’re putting into your protocol.
            </p>
            <div className="mt-6 flex gap-3">
              <LocalizedClientLink
                href="/store"
                className="rounded-full bg-[#1e6fbe] px-6 py-3 text-sm font-semibold text-white hover:bg-[#155a9e]"
              >
                Shop Products
              </LocalizedClientLink>
            </div>
          </div>
          <div className="rounded-2xl border border-[#dce8f8] bg-white p-7">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0d1f3c]">
              What We Test For
            </h3>
            <dl className="mt-4 divide-y divide-[#eef4fc]">
              {[
                ["Appearance", "Clear, colorless, particle-free"],
                ["pH Range", "5.0 – 7.0 (USP) · measured 6.66"],
                ["Sterility", "USP <71> — passes"],
                ["Endotoxins", "Within USP limits"],
                ["Total Organic Carbon", "< 500 ppb"],
                ["Total Dissolved Solids", "Within USP limits"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3">
                  <dt className="text-sm text-[#5a6b85]">{k}</dt>
                  <dd className="text-sm font-semibold text-[#0d1f3c] text-right">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ── Specifications ──────────────────────────────────────── */}
      <section id="specs" className="content-container py-20 small:py-24">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1e6fbe]">
            Specifications
          </span>
          <h2 className="mt-2 text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
            Built to Standard
          </h2>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-1">
          {[
            ["Preservative", "0.9% Benzyl Alcohol (USP)"],
            ["Water grade", "USP Sterile Water for Injection"],
            ["Stopper", "20mm bromobutyl, sterile flip-top cap"],
            ["Storage temp", "20–25°C (room temperature)"],
            ["Shelf life", "24 months sealed"],
            ["After opening", "Multi-dose rated 28 days"],
          ].map(([k, v]) => (
            <div
              key={k}
              className="flex items-center justify-between border-b border-[#eef4fc] py-3.5"
            >
              <span className="text-sm text-[#5a6b85]">{k}</span>
              <span className="text-sm font-semibold text-[#0d1f3c] text-right">
                {v}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="bg-[#f5f9ff] border-y border-[#dce8f8]">
        <div className="content-container py-20 small:py-24 max-w-3xl mx-auto">
          <h2 className="text-center text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a] mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              [
                "What is reconstitution water used for?",
                "Reconstitution water is sterile water containing 0.9% benzyl alcohol, a preservative that inhibits bacterial growth. It is commonly used in research settings to reconstitute lyophilized (freeze-dried) compounds.",
              ],
              [
                "How long is it good for after opening?",
                "The 0.9% benzyl alcohol preservative allows a 30 mL multi-dose vial to be used safely for up to 28 days after the first puncture when stored at room temperature.",
              ],
              [
                "How is my order shipped?",
                "Orders ship in discreet packaging within the United States, typically arriving in 3–5 business days. The 10-pack bundle includes priority shipping.",
              ],
            ].map(([q, a]) => (
              <details
                key={q}
                className="group rounded-xl border border-[#dce8f8] bg-white px-6 py-4"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-[#0d1f3c] list-none">
                  {q}
                  <span className="text-[#1e6fbe] transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[#5a6b85]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────── */}
      <section id="contact" className="content-container py-20 small:py-24">
        <div className="max-w-3xl mx-auto rounded-2xl bg-[#0d1f3c] px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-semibold tracking-tight">Questions? Talk to us.</h2>
          <p className="mt-3 text-white/70">
            Wholesale, bulk orders, or general questions — we&apos;re happy to help.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
            <a
              href="mailto:support@purebac.com"
              className="rounded-full bg-[#1e6fbe] px-7 py-3 font-semibold hover:bg-[#155a9e]"
            >
              support@purebac.com
            </a>
            <a href="tel:+18005550198" className="font-semibold text-white/90 hover:text-white">
              (800) 555-0198
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PureBacLanding
