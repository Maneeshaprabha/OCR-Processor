"use client";

import dynamic from "next/dynamic";

const Results = dynamic(() => import("@/app/Results/results_page"), {
  ssr: false,
});

export default function ResultsPage() {
  return (
    <div>
      <Results />
    </div>
  );
}
