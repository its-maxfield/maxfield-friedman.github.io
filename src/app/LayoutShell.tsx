"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import SideStrip from "@/components/layout/SideStrip";
import MobileFAB from "@/components/layout/MobileFAB";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEventPage = pathname === "/event";

  return (
    <>
      <Navbar />
      {!isEventPage && <SideStrip />}
      {!isEventPage && <MobileFAB />}
      <main className="pt-14">{children}</main>
    </>
  );
}
