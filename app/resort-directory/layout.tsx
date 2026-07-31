"use client";

// Scopes ResortDataProvider to the Resort Directory section only, so the
// full resort dataset (1,700+ resorts) is fetched once when a visitor
// enters this section and shared by every page under it (country list,
// region list, resort cards, single resort) — instead of being fetched
// on every page in the app, or being re-fetched at each step of the
// browsing flow.
import { ResortDataProvider } from "@/lib/providers/ResortDataProvider";
import type { ReactNode } from "react";

export default function ResortDirectoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ResortDataProvider>{children}</ResortDataProvider>;
}
