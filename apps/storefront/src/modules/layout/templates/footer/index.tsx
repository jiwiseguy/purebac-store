import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[#dce8f8] bg-[#f5f9ff] w-full">
      <div className="content-container flex flex-col w-full">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 py-16">
          <div className="sm:col-span-2 max-w-sm">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#0d1f3c]"
            >
              <span className="inline-block h-5 w-5 rounded-full bg-[#1e6fbe]" />
              PureBac
            </LocalizedClientLink>
            <p className="mt-4 text-sm leading-relaxed text-[#5a6b85]">
              Pharmaceutical-grade bacteriostatic water with 0.9% benzyl
              alcohol. USP-compliant, third-party lab tested, and shipped with a
              certificate of analysis in every order. Made in the USA.
            </p>
          </div>

          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-semibold text-[#0d1f3c]">Shop</span>
            <ul className="grid grid-cols-1 gap-2 text-sm text-[#5a6b85]">
              <li><LocalizedClientLink className="hover:text-[#1e6fbe]" href="/store">All Products</LocalizedClientLink></li>
              <li><LocalizedClientLink className="hover:text-[#1e6fbe]" href="/products/bac-water-10ml">10 mL Vial</LocalizedClientLink></li>
              <li><LocalizedClientLink className="hover:text-[#1e6fbe]" href="/products/bac-water-30ml">30 mL Vial</LocalizedClientLink></li>
              <li><LocalizedClientLink className="hover:text-[#1e6fbe]" href="/products/bac-water-30ml-10pack">10-Pack Bundle</LocalizedClientLink></li>
            </ul>
          </div>

          <div className="flex flex-col gap-y-2">
            <span className="text-sm font-semibold text-[#0d1f3c]">Company</span>
            <ul className="grid grid-cols-1 gap-2 text-sm text-[#5a6b85]">
              <li><LocalizedClientLink className="hover:text-[#1e6fbe]" href="/#lab-results">Lab Results</LocalizedClientLink></li>
              <li><LocalizedClientLink className="hover:text-[#1e6fbe]" href="/#faq">FAQ</LocalizedClientLink></li>
              <li><a className="hover:text-[#1e6fbe]" href="mailto:support@purebac.com">support@purebac.com</a></li>
              <li><a className="hover:text-[#1e6fbe]" href="tel:+18005550198">(800) 555-0198</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#dce8f8] py-8">
          <p className="text-xs leading-relaxed text-[#6a8aaa]">
            For laboratory and research use only. Not for human or veterinary
            use, and not a drug or medical device. Statements on this site have
            not been evaluated by the FDA. Bacteriostatic water is sold solely
            as a research reagent.
          </p>
          <p className="mt-4 text-xs text-[#6a8aaa]">
            © {year} PureBac. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
