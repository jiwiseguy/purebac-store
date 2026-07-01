import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund Policy — PureBac",
  description: "PureBac returns, refunds, and replacement policy.",
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-[#0d1f3c] mt-8 mb-2">{children}</h2>
)

export default function RefundPolicyPage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <h1 className="text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
        Refund Policy
      </h1>
      <p className="mt-2 text-sm text-[#6a8aaa]">Last updated: June 20, 2026</p>

      <div className="mt-8 text-sm leading-relaxed text-[#41506a]">
        <p>
          We want you to be confident in every order. Because our products are
          sterile reagents, the policy below balances your protection with the
          integrity of the product.
        </p>

        <H2>Damaged, defective, or incorrect items</H2>
        <p>
          If your order arrives damaged, defective, or incorrect, contact us
          within <strong>7 days</strong> of delivery with your order number and a
          photo. We will replace the affected items or issue a full refund,
          including shipping.
        </p>

        <H2>Unopened items</H2>
        <p>
          Unopened, undamaged vials in their original sealed packaging may be
          returned within <strong>30 days</strong> of delivery for a refund of the
          product price (original shipping is non-refundable). Contact us first to
          start a return; return shipping is the customer&apos;s responsibility
          unless the return is due to our error.
        </p>

        <H2>Non-returnable items</H2>
        <p>
          For safety and sterility, <strong>opened or used vials cannot be
          returned</strong> and are not eligible for refund except where the
          product was defective on arrival.
        </p>

        <H2>How refunds are issued</H2>
        <p>
          Approved refunds are issued to your original payment method. Please allow
          5–10 business days for the refund to appear after we process it.
        </p>

        <H2>How to request</H2>
        <p>
          Email{" "}
          <a className="text-[#1e6fbe] hover:underline" href="mailto:purebackwater1@gmail.com">
            purebackwater1@gmail.com
          </a>{" "}
          with your order number and the reason for the return, and we&apos;ll
          guide you through the next steps.
        </p>
      </div>
    </div>
  )
}
