import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us — PureBac",
  description: "Get in touch with the PureBac team.",
}

export default function ContactPage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <h1 className="text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
        Contact Us
      </h1>
      <p className="mt-3 text-[#41506a] leading-relaxed">
        Questions about an order, wholesale and bulk pricing, or a certificate of
        analysis? We&apos;re happy to help.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[#dce8f8] bg-white p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6a8aaa]">
            Email
          </div>
          <a
            href="mailto:support@purebac.com"
            className="mt-1 block text-base font-semibold text-[#1e6fbe] hover:underline"
          >
            support@purebac.com
          </a>
          <p className="mt-2 text-sm text-[#5a6b85]">
            Best for order questions and COA requests. We reply within 1 business
            day.
          </p>
        </div>

        <div className="rounded-2xl border border-[#dce8f8] bg-white p-6">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6a8aaa]">
            Phone
          </div>
          <a
            href="tel:+18005550198"
            className="mt-1 block text-base font-semibold text-[#1e6fbe] hover:underline"
          >
            (800) 555-0198
          </a>
          <p className="mt-2 text-sm text-[#5a6b85]">
            Monday–Friday, 9am–5pm ET.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-[#0d1f3c] px-8 py-10 text-center text-white">
        <h2 className="text-2xl font-semibold tracking-tight">
          Wholesale &amp; bulk orders
        </h2>
        <p className="mt-2 text-white/70">
          Reselling or buying in volume? Email us for bulk pricing.
        </p>
        <a
          href="mailto:support@purebac.com"
          className="mt-5 inline-block rounded-full bg-[#1e6fbe] px-7 py-3 text-sm font-semibold hover:bg-[#155a9e]"
        >
          Email support@purebac.com
        </a>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-[#6a8aaa]">
        For laboratory and research use only. Not for human or veterinary use, and
        not a drug or medical device.
      </p>
    </div>
  )
}
