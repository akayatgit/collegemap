import EmailReportButton from "./EmailReportButton";

function buildQuestions(branches: number) {
  return [
  {
    num: "01",
    question: "WHICH COLLEGE IS YOURS?",
    answer:
      "Enter your cutoff score and category — we show every college you can walk into, ranked by how comfortable your score is. No guessing, no anxiety, just your list.",
    accent: "var(--color-pink)",
    highlightWord: "CUTOFF?",
    visual: (
      <div className="relative w-48 h-48 lg:w-64 lg:h-64 flex-shrink-0">
        {/* Pill shape with score */}
        <div
          className="absolute inset-0 rounded-[40%] flex items-center justify-center border-2"
          style={{
            background: "var(--color-pink)",
            borderColor: "var(--color-ink)",
            boxShadow: "6px 6px 0 var(--color-ink)",
          }}
        >
          <div className="text-center">
            <div
              className="text-5xl font-extrabold leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                color: "var(--color-ink)",
              }}
            >
              196.5
            </div>
            <div
              className="text-xs mt-1 font-bold uppercase tracking-wider"
              style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}
            >
              OC Cutoff
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    question: "WHAT CAN YOU ACTUALLY STUDY?",
    answer:
      `${branches} course offerings. Every department, every cutoff, across every college in Tamil Nadu — search by department, filter by your quota, and see what your score unlocks.`,
    accent: "var(--color-teal)",
    highlightWord: "STUDY?",
    visual: (
      <div className="relative w-48 h-48 lg:w-64 lg:h-64 flex-shrink-0">
        <div
          className="absolute inset-0 rounded-full flex flex-col items-center justify-center border-2"
          style={{
            background: "var(--color-teal)",
            borderColor: "var(--color-ink)",
            boxShadow: "6px 6px 0 var(--color-ink)",
          }}
        >
          <div
            className="text-6xl font-extrabold leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              color: "var(--color-ink)",
            }}
          >
            {branches}
          </div>
          <div
            className="text-xs mt-2 font-bold uppercase tracking-wider"
            style={{ fontFamily: "var(--font-body)", color: "var(--color-ink)" }}
          >
            Branch Entries
          </div>
        </div>
      </div>
    ),
  },
  {
    num: "03",
    question: "DOES YOUR QUOTA MATTER HERE?",
    answer:
      "OC, BC, BCM, MBC, SC, SCA, ST — every category cutoff is listed side by side. Switch between quotas in one tap and see exactly how many more doors open up for you.",
    accent: "#ffffff",
    highlightWord: "COVERED?",
    visual: (
      <div className="flex-shrink-0 flex flex-col gap-2 w-48 lg:w-60">
        {["OC", "BC", "BCM", "MBC", "SC", "SCA", "ST"].map((cat, i) => (
          <div
            key={cat}
            className="flex items-center justify-between px-4 py-2 rounded-full border-2 font-bold text-sm"
            style={{
              borderColor: "var(--color-ink)",
              background:
                i % 3 === 0
                  ? "var(--color-yellow)"
                  : i % 3 === 1
                  ? "var(--color-pink)"
                  : "var(--color-teal)",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <span>{cat}</span>
            <span className="text-xs font-medium opacity-70">Category</span>
          </div>
        ))}
      </div>
    ),
  },
  ];
}

export default function QuestionsSection({ branches }: { branches: number }) {
  const questions = buildQuestions(branches);
  return (
    <section
      id="how"
      className="relative"
      style={{ background: "#ffffff" }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 flex justify-end">
        <EmailReportButton sourcePage="faq" variant="secondary" />
      </div>
      {questions.map((q, idx) => (
        <div
          key={q.num}
          className="border-b-2 relative overflow-hidden"
          style={{ borderColor: "var(--color-ink)" }}
        >
          {/* Background accent shape */}
          <div
            className="absolute -right-20 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 pointer-events-none"
            style={{ background: q.accent }}
            aria-hidden
          />

          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
            <div
              className={`flex flex-col ${
                idx % 2 === 0
                  ? "lg:flex-row"
                  : "lg:flex-row-reverse"
              } items-start lg:items-center gap-10 lg:gap-20`}
            >
              {/* Text side */}
              <div className="flex-1">
                {/* Section number */}
                <span
                  className="section-num mb-6 inline-block"
                  style={{ color: "var(--color-ink)" }}
                >
                  {q.num}
                </span>

                <h2
                  className="leading-[0.9] tracking-tighter uppercase"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: "clamp(2.5rem,6vw,5rem)",
                    color: "var(--color-ink)",
                  }}
                >
                  {q.question.split(q.highlightWord).map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span
                          className="inline-block px-3 pb-1 rounded-lg mx-1"
                          style={{
                            background: q.accent,
                            color:
                              q.accent === "#ffffff"
                                ? "var(--color-ink)"
                                : "var(--color-ink)",
                            border: "2px solid var(--color-ink)",
                          }}
                        >
                          {q.highlightWord}
                        </span>
                      )}
                    </span>
                  ))}
                </h2>

                <p
                  className="mt-6 max-w-lg leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 400,
                    fontSize: "1.05rem",
                    color: "var(--color-ink-soft)",
                  }}
                >
                  {q.answer}
                </p>
              </div>

              {/* Visual side */}
              <div className="flex items-center justify-center">
                {q.visual}
              </div>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
