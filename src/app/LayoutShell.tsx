"use client";

import Navbar from "@/components/layout/Navbar";
import SideStrip from "@/components/layout/SideStrip";
import MobileFAB from "@/components/layout/MobileFAB";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <SideStrip />
      <MobileFAB />
      <main className="pt-14">{children}</main>
    </>
  );
}
