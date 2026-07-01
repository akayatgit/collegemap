export default function MarqueeStrip({
  dark = false,
  branches = 50,
  colleges = 6,
}: {
  dark?: boolean;
  branches?: number;
  colleges?: number;
}) {
  const ITEMS = [
    "TNEA 2025",
    "★",
    `${colleges} COLLEGES TO CHOOSE FROM`,
    "★",
    "YOUR CUTOFF · YOUR FUTURE",
    "★",
    "OC · BC · BCM · MBC · SC · SCA · ST",
    "★",
    "FREE TO USE · ALWAYS",
    "★",
    "FIND WHERE YOU BELONG",
    "★",
    "NGCULT",
    "★",
    `${branches} COURSE OFFERINGS`,
    "★",
  ];
  const repeated = [...ITEMS, ...ITEMS];

  return (
    <div
      className="overflow-hidden border-y-2 py-4"
      style={{
        background: dark ? "var(--color-teal)" : "var(--color-pink)",
        borderColor: "var(--color-ink)",
      }}
    >
      <div className="marquee-inner">
        {repeated.map((item, i) => (
          <span
            key={i}
            className="mx-5 text-sm font-extrabold uppercase tracking-widest whitespace-nowrap"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              color: "var(--color-ink)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
