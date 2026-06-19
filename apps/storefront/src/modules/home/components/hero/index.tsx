import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative w-full overflow-hidden border-b border-[#dce8f8] bg-gradient-to-b from-[#f5f9ff] via-[#EBF3FF] to-white">
      <div className="content-container flex flex-col items-center text-center py-20 small:py-28 gap-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#cfe0f6] bg-white/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1e6fbe]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1e6fbe]" />
          Peptide-Grade · Third-Party Verified
        </span>

        <h1 className="max-w-3xl text-4xl small:text-6xl font-semibold leading-[1.05] tracking-tight text-[#0a0a0a]">
          Bacteriostatic Water
          <br />
          <span className="text-[#1e6fbe]">You Can Trust</span>
        </h1>

        <p className="max-w-2xl text-base small:text-lg leading-relaxed text-[#41506a]">
          Pharmaceutical-grade sterile water with 0.9% benzyl alcohol.
          USP-compliant, third-party lab tested, and shipped with a full
          certificate of analysis — every order, every time.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <LocalizedClientLink
            href="/store"
            className="rounded-full bg-[#1e6fbe] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#155a9e]"
          >
            Shop Now
          </LocalizedClientLink>
          <a
            href="#lab-results"
            className="rounded-full border border-[#cfe0f6] bg-white px-8 py-3.5 text-sm font-semibold text-[#1e6fbe] transition-colors hover:bg-[#f5f9ff]"
          >
            View Lab Results
          </a>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl">
          {[
            { k: "Preservative", v: "0.9% Benzyl Alcohol" },
            { k: "pH (USP)", v: "6.66 — in spec" },
            { k: "Verified by", v: "Vanguard Laboratory" },
          ].map((item) => (
            <div
              key={item.k}
              className="rounded-xl border border-[#dce8f8] bg-white/70 px-5 py-4 text-left"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#6a8aaa]">
                {item.k}
              </div>
              <div className="mt-1 text-sm font-semibold text-[#0d1f3c]">
                {item.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Hero
