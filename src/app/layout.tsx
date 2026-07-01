import type { Metadata } from "next";
import "./globals.css";
import { StudentProvider } from "@/context/StudentContext";
import PageVisitTracker from "@/components/PageVisitTracker";

export const metadata: Metadata = {
  title: "TNEA 2026 · Tamil Nadu Engineering College Prediction",
  description:
    "Enter your cutoff score and quota to instantly see which Tamil Nadu engineering colleges you qualify for — TNEA 2026 edition, powered by NGCult CollegeMap.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&family=Roboto+Condensed:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full antialiased">
        <StudentProvider>
          <PageVisitTracker />
          {children}
        </StudentProvider>
      </body>
    </html>
  );
}
