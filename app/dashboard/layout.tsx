"use client";

// Scopes ResortDataProvider to the whole /dashboard section (Gateways,
// Exchange, and any other child page under it) so the resort dataset is
// fetched once and shared, the same pattern used for /resort-directory.
import { ResortDataProvider } from "@/lib/providers/ResortDataProvider";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ResortDataProvider>{children}</ResortDataProvider>;
}
