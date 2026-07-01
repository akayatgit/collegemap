export default function HeroSection({
  totalColleges,
  totalBranches,
}: {
  totalColleges: number;
  totalBranches: number;
}) {
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden noise-overlay"
      style={{ background: "var(--color-yellow)" }}
    >
      {/* ── Floating blob – right ── */}
      <div
        className="blob-pink absolute -right-24 top-28 w-72 h-72 lg:w-96 lg:h-96 opacity-90"
        aria-hidden
      />

      {/* ── Floating blob – left bottom ── */}
      <div
        className="blob-teal absolute -left-16 bottom-32 w-56 h-56 lg:w-72 lg:h-72 opacity-80"
        aria-hidden
      />

      {/* ── Small confetti dots ── */}
      <div
        className="absolute top-48 left-1/4 w-5 h-5 rounded-full"
        style={{ background: "var(--color-ink)" }}
        aria-hidden
      />
      <div
        className="absolute top-72 right-1/3 w-3 h-3 rounded-full"
        style={{ background: "var(--color-pink)" }}
        aria-hidden
      />
      <div
        className="absolute bottom-48 left-1/2 w-4 h-4 rounded-full"
        style={{ background: "var(--color-teal)" }}
        aria-hidden
      />

      {/* ── Floating badge – new ── */}
      <div className="relative z-10 flex justify-center pt-32 lg:pt-36">
        <span
          className="pill text-xs uppercase tracking-widest"
          style={{
            background: "var(--color-teal)",
            color: "var(--color-ink)",
            border: "2px solid var(--color-ink)",
            fontFamily: "var(--font-body)",
          }}
        >
          ✦ &nbsp; TNEA 2025 &nbsp;•&nbsp; Tamil Nadu Engineering Admissions
        </span>
      </div>

      {/* ── Main headline ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 mt-8 lg:mt-12">
        <h1
          className="leading-[0.88] tracking-tighter uppercase select-none"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--color-ink)",
          }}
        >
          {/* Line 1 */}
          <span className="block text-[clamp(4rem,14vw,10.5rem)]">
            COLLEGE
          </span>

          {/* Line 2 – "MAP" highlighted */}
          <span className="block text-[clamp(4.2rem,15vw,11.5rem)]">
            <span
              className="relative inline-block"
              style={{ color: "var(--color-pink)" }}
            >
              MAP
              {/* underline scribble */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M4 12 C60 4, 120 18, 180 10 S 260 4, 296 10"
                  stroke="var(--color-ink)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </span>

          {/* Line 3 */}
          <span className="block text-[clamp(2.5rem,8vw,6rem)] mt-4">
            IS YOUR
            <span
              className="inline-block ml-4 px-5 py-1 rounded-full align-middle"
              style={{
                background: "var(--color-ink)",
                color: "var(--color-yellow)",
                fontSize: "clamp(1.8rem,5.5vw,4.2rem)",
                lineHeight: 1.1,
              }}
            >
              KEY.
            </span>
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className="mt-8 lg:mt-10 max-w-2xl text-center leading-relaxed"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 400,
            fontSize: "clamp(1rem,2vw,1.2rem)",
            color: "var(--color-ink-soft)",
          }}
        >
          Know your cutoff? Find every engineering college &amp; branch
          available to you across Tamil Nadu — compare, shortlist, and connect
          with seniors who've been exactly where you are.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
          <a
            href="#explore"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base transition-all duration-200 hover:scale-105 active:scale-100 shadow-lg"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-yellow)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              boxShadow: "4px 4px 0 var(--color-pink)",
            }}
          >
            Explore Colleges
            <span className="text-xl">↓</span>
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-bold text-base border-2 transition-all duration-200 hover:bg-black hover:text-yellow-400"
            style={{
              borderColor: "var(--color-ink)",
              color: "var(--color-ink)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
            }}
          >
            How It Works
          </a>
        </div>

        {/* ── Floating stat cards ── */}
        <div className="relative z-10 flex flex-wrap justify-center gap-4 mt-14 mb-12">
          {[
            {
              label: "Colleges",
              value: totalColleges.toLocaleString("en-IN"),
              bg: "var(--color-ink)",
              fg: "var(--color-yellow)",
            },
            {
              label: "Branches",
              value: totalBranches.toLocaleString("en-IN"),
              bg: "var(--color-teal)",
              fg: "var(--color-ink)",
            },
            {
              label: "Max Cutoff",
              value: "200.0",
              bg: "var(--color-pink)",
              fg: "var(--color-ink)",
            },
            {
              label: "Categories",
              value: "7",
              bg: "#ffffff",
              fg: "var(--color-ink)",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2"
              style={{
                background: stat.bg,
                color: stat.fg,
                borderColor: "var(--color-ink)",
                boxShadow: "3px 3px 0 var(--color-ink)",
              }}
            >
              <span
                className="text-2xl leading-none font-bold"
                style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}
              >
                {stat.value}
              </span>
              <span
                className="text-xs mt-1 font-semibold uppercase tracking-wider"
                style={{ fontFamily: "var(--font-body)", opacity: 0.85 }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom wave divider ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10" aria-hidden>
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 30 C240 0, 480 60, 720 30 S1200 0, 1440 30 L1440 60 L0 60 Z"
            fill="#0a0a0a"
          />
        </svg>
      </div>
    </section>
  );
}
