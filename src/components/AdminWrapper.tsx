"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const RankUpload = dynamic(() => import("./RankUpload"), { ssr: false });

function AdminInner() {
  const params = useSearchParams();
  if (!params.get("admin")) return null;
  return <RankUpload />;
}

export default function AdminWrapper() {
  return (
    <Suspense fallback={null}>
      <AdminInner />
    </Suspense>
  );
}
