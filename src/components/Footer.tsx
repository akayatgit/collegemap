const COLLEGES_ROW1 = [
  "CEG Campus — Anna University",
  "PSG College of Technology",
  "Coimbatore Institute of Technology",
  "Thiagarajar College of Engineering",
  "GCT Coimbatore",
  "MIT Campus — Anna University",
  "ACT Campus — Anna University",
  "Bannari Amman Institute of Technology",
  "Kongu Engineering College",
  "SRM Valliammai Engineering",
  "NIT Trichy",
  "REC Tirunelveli",
];

const COLLEGES_ROW2 = [
  "Sona College of Technology",
  "SSN College of Engineering",
  "Sri Venkateswara College of Engineering",
  "KCE — KPR Institute",
  "Alagappa Chettiar GCE",
  "Sri Sivasubramaniya Nadar",
  "Meenakshi Sundararajan Engineering",
  "Mepco Schlenk Engineering",
  "Jerusalem College of Engineering",
  "Rajalakshmi Engineering College",
  "Saveetha Engineering College",
  "Jeppiaar Engineering College",
];

const LINKS = {
  NGCult: ["About", "Blog", "Careers", "Press"],
  Tools: ["CollegeMap", "RankFinder", "MentorMatch", "Alumni Network"],
  Resources: ["TNEA Guide", "Counselling Tips", "Branch Profiles", "FAQ"],
  Connect: ["Twitter / X", "Instagram", "LinkedIn", "Discord"],
};

export default function Footer() {
  return (
    <footer style={{ background: "#ffffff", color: "var(--color-ink)" }}>
      {/* ── "Ready" block ── */}
      <div
        className="border-b-2"
        style={{ borderColor: "#e5e5e0" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12">
          {/* Headline */}
          <div className="flex-1">
            <p
              className="text-sm font-bold uppercase tracking-widest mb-4"
              style={{ color: "#aaa", fontFamily: "var(--font-body)" }}
            >
              Part of NGCult
            </p>
            <h2
              className="leading-[0.88] tracking-tighter uppercase"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(3rem,8vw,7rem)",
                color: "var(--color-ink)",
              }}
            >
              READY FOR
              <br />
              YOUR{" "}
              <span style={{ color: "var(--color-pink)" }}>GREAT</span>
              <br />
              FUTURE.
            </h2>
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-5">
            <p
              className="max-w-xs"
              style={{
                fontFamily: "var(--font-body)",
                color: "#666",
                lineHeight: 1.6,
              }}
            >
              NGCult builds free tools to help Tamil Nadu engineering students
              from admission to employment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#explore"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-105"
                style={{
                  background: "var(--color-ink)",
                  color: "#ffffff",
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  boxShadow: "3px 3px 0 var(--color-pink)",
                }}
              >
                Find My College ↗
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm border-2 transition-all hover:bg-black hover:text-white"
                style={{
                  borderColor: "#ddd",
                  color: "#999",
                  fontFamily: "var(--font-body)",
                }}
              >
                Join Community
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── College logos marquee strips ── */}
      <div
        className="border-b-2 py-6 overflow-hidden"
        style={{ borderColor: "#e5e5e0" }}
      >
        <p
          className="text-center text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: "#bbb", fontFamily: "var(--font-body)" }}
        >
          Covering admissions to all of these institutions & more
        </p>

        {/* Row 1 */}
        <div className="overflow-hidden mb-4">
          <div className="marquee-inner">
            {[...COLLEGES_ROW1, ...COLLEGES_ROW1].map((name, i) => (
              <div
                key={i}
                className="mx-4 px-5 py-2.5 rounded-full border-2 flex-shrink-0 flex items-center"
                style={{
                  borderColor: "#e5e5e0",
                  background: "#f8f8f6",
                }}
              >
                <span
                  className="text-sm font-bold whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    color: "#555",
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2 – reverse direction */}
        <div className="overflow-hidden">
          <div
            className="marquee-inner"
            style={{ animationDirection: "reverse" }}
          >
            {[...COLLEGES_ROW2, ...COLLEGES_ROW2].map((name, i) => (
              <div
                key={i}
                className="mx-4 px-5 py-2.5 rounded-full border-2 flex-shrink-0 flex items-center"
                style={{
                  borderColor: "#e5e5e0",
                  background: "#f8f8f6",
                }}
              >
                <span
                  className="text-sm font-bold whitespace-nowrap"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    color: "#555",
                  }}
                >
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer links grid ── */}
      <div
        className="border-b-2"
        style={{ borderColor: "#e5e5e0" }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-5"
                style={{ color: "#aaa", fontFamily: "var(--font-body)" }}
              >
                {section}
              </h3>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm font-medium transition-colors hover:text-pink-500"
                      style={{
                        color: "#666",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="font-extrabold text-lg"
            style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-ink)" }}
          >
            ng<span style={{ color: "var(--color-pink)" }}>cult</span>
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{ borderColor: "#ddd", color: "#aaa", fontFamily: "var(--font-body)" }}
          >
            CollegeMap
          </span>
        </div>
        <p
          className="text-xs text-center"
          style={{ color: "#aaa", fontFamily: "var(--font-body)" }}
        >
          © 2025 NGCult. Data sourced from TNEA 2025 official counselling.
          Made with ♥ for Tamil Nadu engineering aspirants.
        </p>
        <div className="flex items-center gap-1">
          {["★", "★", "★", "★", "★"].map((s, i) => (
            <span
              key={i}
              className="text-xs"
              style={{ color: "var(--color-pink)" }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
