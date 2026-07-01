"use client";

import { useEffect } from "react";
import { logPageVisit } from "@/lib/audit";

export default function PageVisitTracker() {
  useEffect(() => {
    logPageVisit();
  }, []);
  return null;
}
