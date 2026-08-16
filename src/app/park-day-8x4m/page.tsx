import type { Metadata } from "next";
import TripApp from "@/disney/components/TripApp";

export const metadata: Metadata = {
  title: "Park Day Optimizer",
  description: "A private two-day Disneyland Resort companion.",
  robots: { index: false, follow: false, nocache: true },
  manifest: "/park-day-8x4m/manifest.webmanifest",
  icons: { icon: "/favicon.ico", apple: "/favicon.ico" },
};

export default function ParkDayPage() {
  return <TripApp />;
}
