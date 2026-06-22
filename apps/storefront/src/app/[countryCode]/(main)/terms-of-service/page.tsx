import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service — PureBac",
  description: "The terms governing your use of PureBac and purchases from us.",
}

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold text-[#0d1f3c] mt-8 mb-2">{children}</h2>
)

export default function TermsOfServicePage() {
  return (
    <div className="content-container py-16 max-w-3xl">
      <h1 className="text-3xl small:text-4xl font-semibold tracking-tight text-[#0a0a0a]">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-[#6a8aaa]">Last updated: June 20, 2026</p>

      <div className="mt-8 text-sm leading-relaxed text-[#41506a]">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use
          of purebac.com and any purchase you make from PureBac. By using the site
          or placing an order, you agree to these Terms.
        </p>

        <H2>Research use only</H2>
        <p>
          All products sold by PureBac are intended{" "}
          <strong>for laboratory and research use only</strong>. They are not
          drugs, dietary supplements, or medical devices, are not intended for
          human or veterinary use, and have not been evaluated by the FDA. You are
          solely responsible for handling, storing, and using products in
          compliance with all applicable laws and regulations.
        </p>

        <H2>Eligibility</H2>
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract to purchase from us. By ordering, you represent that you meet
          these requirements and that the products will be used lawfully and for
          their intended research purpose.
        </p>

        <H2>Orders &amp; pricing</H2>
        <p>
          We may accept or decline any order at our discretion. Prices and
          availability are subject to change without notice. We reserve the right
          to correct pricing errors and to cancel and refund affected orders.
        </p>

        <H2>No warranties beyond product specifications</H2>
        <p>
          Products are provided &quot;as is&quot; except for the specifications
          stated on the product page and certificate of analysis. To the fullest
          extent permitted by law, we disclaim all other warranties, express or
          implied.
        </p>

        <H2>Limitation of liability</H2>
        <p>
          To the fullest extent permitted by law, PureBac is not liable for any
          indirect, incidental, or consequential damages, and our total liability
          for any claim will not exceed the amount you paid for the product giving
          rise to the claim.
        </p>

        <H2>Governing law</H2>
        <p>
          These Terms are governed by the laws of the State of [your state],
          United States, without regard to conflict-of-law principles.
        </p>

        <H2>Contact</H2>
        <p>
          Questions about these Terms? Email{" "}
          <a className="text-[#1e6fbe] hover:underline" href="mailto:support@purebac.com">
            support@purebac.com
          </a>
          .
        </p>
      </div>
    </div>
  )
}
