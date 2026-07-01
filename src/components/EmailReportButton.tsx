"use client";

import { useState } from "react";
import EmailReportModal from "./EmailReportModal";

type Variant = "primary" | "secondary" | "compact";

type Props = {
  sourcePage: string;
  variant?: Variant;
  label?: string;
  className?: string;
};

export default function EmailReportButton({
  sourcePage,
  variant = "secondary",
  label = "✉ Email Report",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const styles: Record<Variant, React.CSSProperties> = {
    primary: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "12px 24px",
      borderRadius: 14,
      background: "var(--color-ink)",
      color: "var(--color-yellow)",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "0.85rem",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      border: "2px solid var(--color-ink)",
      boxShadow: "4px 4px 0 var(--color-pink)",
      cursor: "pointer",
    },
    secondary: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "9px 18px",
      borderRadius: 9999,
      background: "#ffffff",
      color: "var(--color-ink)",
      fontFamily: "var(--font-body)",
      fontWeight: 700,
      fontSize: "0.82rem",
      border: "2px solid var(--color-ink)",
      cursor: "pointer",
    },
    compact: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "6px 14px",
      borderRadius: 9999,
      background: "transparent",
      color: "var(--color-ink)",
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      fontSize: "0.75rem",
      border: "1.5px solid #ddd",
      cursor: "pointer",
    },
  };

  return (
    <>
      <button
        type="button"
        className={className}
        style={styles[variant]}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <EmailReportModal
        open={open}
        onClose={() => setOpen(false)}
        sourcePage={sourcePage}
      />
    </>
  );
}
