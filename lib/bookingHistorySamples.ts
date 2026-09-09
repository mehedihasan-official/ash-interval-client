// Placeholder rows shown when a member has no history of a given kind
// yet, so the table demonstrates its own shape instead of rendering four
// empty tabs. The table labels them as samples — they are never passed
// off as the member's own bookings.
//
// The Resorts rows are transcribed from Interval's live history screen,
// which is the reference this table was built against. The other three
// use real inventory from this project's own seed data (the CLT-MYR and
// ATL-HHH flights, Enterprise's economy class, Harmony of the Seas) so
// the sample never advertises something the site can't actually book.
//
// Dates are pre-formatted strings rather than ISO values on purpose:
// these are fixed illustrations, not events, so they shouldn't drift
// relative to today or re-localize per viewer.
import type { HistoryRow, HistoryTabKey } from "@/lib/bookingHistory";

const SAMPLE_ROWS: Record<HistoryTabKey, HistoryRow[]> = {
  resorts: [
    {
      id: "sample-resort-1",
      reference: "030157529",
      typeLabel: "Exchange",
      transactionDate: "Mon, October 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "Westin Princeville Ocean Resort",
        code: "WPV",
        details: ["Unit: HSTDO (Studio)", "Week: 32"],
        startDate: "Sun, August 09, 2026",
        endDate: "Sun, August 16, 2026",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
    {
      id: "sample-resort-2",
      reference: "030203198",
      typeLabel: "Exchange",
      transactionDate: "Thu, November 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "Marriott's Cypress Harbour",
        code: "MCP",
        details: ["Unit: TIME (2 Bedrooms)", "Week: 23"],
        startDate: "Fri, June 05, 2026",
        endDate: "Fri, June 12, 2026",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
    {
      id: "sample-resort-3",
      reference: "030203208",
      typeLabel: "Exchange",
      transactionDate: "Thu, November 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "Marriott's Cypress Harbour",
        code: "MCP",
        details: ["Unit: TIME (2 Bedrooms)", "Week: 23"],
        startDate: "Fri, June 05, 2026",
        endDate: "Fri, June 12, 2026",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
    {
  id: "disneys-animal-kingdom-villas-jambo-house-2",
  reference: "XXXXXXXXX", // Interval exchange reference — not provided yet
  typeLabel: "Exchange",
  transactionDate: "TBD", // date the exchange was booked — different from the stay dates below, not provided yet
  relinquishment: null,
  confirmation: {
    name: "Disney's Animal Kingdom Villas at Jambo House",
    code: "DAK",
    details: ["Unit: 2 Bedrooms", "Week: TBD"], // exact week number not provided
    startDate: "Fri, October 24, 2025",
    endDate: "Fri, October 31, 2025",
  },
  status: "Confirmed",
  actionLabel: null,
  actionHref: null,
},
  ],




  flights: [
    {
      id: "sample-flight-1",
      reference: "PC-2026-K4M2QX",
      typeLabel: "Round Trip",
      transactionDate: "Thu, November 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "American Airlines AA 5312",
        code: "CLT → MYR",
        details: ["Cabin: Economy", "1h 10m · Nonstop", "2 travelers"],
        startDate: "Sat, June 06, 2026",
        endDate: "Sat, June 13, 2026",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
    {
      id: "sample-flight-2",
      reference: "PC-2026-B8T5LP",
      typeLabel: "Flight",
      transactionDate: "Mon, October 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "Delta Air Lines DL 4801",
        code: "ATL → HHH",
        details: ["Cabin: Economy", "1h 23m · Nonstop", "2 travelers"],
        startDate: "Fri, August 07, 2026",
        endDate: "",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
  ],
  cars: [
    {
      id: "sample-car-1",
      reference: "PC-2026-R7N3WD",
      typeLabel: "Car Rental",
      transactionDate: "Thu, November 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "Kia Rio or similar Economy",
        code: "Enterprise",
        details: [
          "Pick-up: Myrtle Beach International Airport",
          "Drop-off: Myrtle Beach International Airport",
          "7 days · Automatic",
        ],
        startDate: "Sat, June 06, 2026",
        endDate: "Sat, June 13, 2026",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
  ],
  cruises: [
    {
      id: "sample-cruise-1",
      reference: "PC-2026-S2V9HQ",
      typeLabel: "Cruise",
      transactionDate: "Mon, October 20, 2025",
      relinquishment: null,
      confirmation: {
        name: "Harmony of the Seas",
        code: "Royal Caribbean",
        details: [
          "Fort Lauderdale → Nassau → St. Maarten → St. Thomas",
          "Cabin: Balcony",
          "7 nights · 2 guests",
        ],
        startDate: "Sun, August 09, 2026",
        endDate: "Sun, August 16, 2026",
      },
      status: "Confirmed",
      actionLabel: null,
      actionHref: null,
    },
  ],
};

export const getSampleRows = (tab: HistoryTabKey): HistoryRow[] =>
  SAMPLE_ROWS[tab];
