import type { Metadata } from "next";
import { draftAnalysis } from "@/data/draft-analysis";
import DraftGate from "@/components/draft/DraftGate";
import DraftDashboard from "@/components/draft/DraftDashboard";

// Secret page: keep it out of search indexes. It's also unlinked from the site nav
// and lives at an obscure slug. (Direct child of app/ => root layout only, no navbar.)
export const metadata: Metadata = {
  title: "Draft War Room",
  robots: { index: false, follow: false },
};

export default function DraftWarRoomPage() {
  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <DraftGate>
        <DraftDashboard data={draftAnalysis} />
      </DraftGate>
    </main>
  );
}
