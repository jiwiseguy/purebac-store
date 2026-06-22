import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy — PureBac",
  description: "How PureBac collects, uses, and protects your information.",
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-[#0d1f3c] mt-8 mb-2">{children}</h2>
)

export default function PrivacyPolicyPage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <h1 className="text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-[#6a8aaa]">Last updated: June 20, 2026</p>

      <div className="mt-8 text-sm leading-relaxed text-[#41506a]">
        <p>
          PureBac (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects
          your privacy. This policy explains what information we collect when you
          visit purebac.com or place an order, how we use it, and your choices.
        </p>

        <H2>Information we collect</H2>
        <p>
          When you place an order or contact us, we collect the information you
          provide: name, email address, shipping address, phone number, and
          order details. Payment is processed by our payment providers (such as
          PayPal); we do not store full card or bank details on our servers. We
          also collect basic technical data automatically, such as IP address,
          browser type, and pages viewed, to operate and secure the site.
        </p>

        <H2>How we use your information</H2>
        <p>
          We use your information to process and ship orders, provide customer
          support, send order-related communications, prevent fraud, comply with
          legal obligations, and improve our products and website. We do not sell
          your personal information.
        </p>

        <H2>Cookies</H2>
        <p>
          We use essential cookies to keep your cart and session working. You can
          control non-essential cookies through your browser settings.
        </p>

        <H2>Sharing</H2>
        <p>
          We share information only with service providers who help us run the
          business — for example, payment processors, shipping carriers, email
          providers, and hosting providers — and only as needed to perform their
          services, or when required by law.
        </p>

        <H2>Data retention &amp; security</H2>
        <p>
          We retain order records as required for tax, accounting, and legal
          purposes, and use reasonable safeguards to protect your information. No
          method of transmission or storage is 100% secure.
        </p>

        <H2>Your rights</H2>
        <p>
          Depending on where you live, you may have the right to access, correct,
          or delete your personal information, or to opt out of certain
          processing. To make a request, email us at the address below.
        </p>

        <H2>Contact</H2>
        <p>
          Questions about this policy? Email{" "}
          <a className="text-[#1e6fbe] hover:underline" href="mailto:support@purebac.com">
            support@purebac.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}
