// Next.js has no client-side router state like React Router's
// `navigate(path, { state })`, so the in-progress booking (which resort,
// which unit, which dates, billing info collected so far) is carried
// between the available-unit -> checkout -> payment -> confirmation pages
// via sessionStorage instead. It's scoped to the tab and clears itself once
// the booking is confirmed, which is exactly the lifetime this data needs.
import type { BookingDraft } from "@/lib/types/booking";

const STORAGE_KEY = "interval-booking-draft";

export const saveBookingDraft = (draft: BookingDraft) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
};

export const loadBookingDraft = (): BookingDraft | null => {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
};

export const clearBookingDraft = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(STORAGE_KEY);
};
