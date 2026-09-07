"use client";

// "My History" — the member's booking history across all four products,
// laid out the way Interval's own history screen lays it out: a tab per
// product, then a five-column table of Exchange Type / Relinquishment /
// Confirmation / Status / Actions.
//
// The table scrolls horizontally rather than collapsing into cards on
// small screens. That is a deliberate match to the reference screens
// (this is a phone-first app and that is how the real site behaves on a
// phone), so the header row and the body stay in one grid and the
// columns keep their alignment while you swipe across.
import {
  HISTORY_TABS,
  carBookingToRow,
  cruiseBookingToRow,
  flightBookingToRow,
  hasHistoryContent,
  resortBookingToRow,
  type HistoryRow,
  type HistoryTabKey,
} from "@/lib/bookingHistory";
import { getSampleRows } from "@/lib/bookingHistorySamples";
import { fetchBookingsByEmail } from "@/lib/api/bookings";
import { fetchCarBookingsByEmail } from "@/lib/api/cars";
import { fetchCruiseBookingsByEmail } from "@/lib/api/cruises";
import { fetchFlightBookingsByEmail } from "@/lib/api/flights";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RowsByTab = Record<HistoryTabKey, HistoryRow[]>;

const EMPTY_ROWS: RowsByTab = {
  resorts: [],
  flights: [],
  cars: [],
  cruises: [],
};

// Newest first, matching every other list of bookings in the app. Rows
// whose date didn't parse sort last rather than jumping to the top.
const byNewest = (a: HistoryRow, b: HistoryRow) => {
  const left = Date.parse(a.transactionDate);
  const right = Date.parse(b.transactionDate);
  if (Number.isNaN(left) && Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
};

interface BookingHistoryProps {
  email: string | null | undefined;
  /** Caps rows per tab on the dashboard; the full page passes nothing. */
  limit?: number;
  /** The full page renders its own page heading instead. */
  showHeading?: boolean;
  /** Shown under the heading when the list is capped. */
  viewAllHref?: string;
}

const BookingHistory = ({
  email,
  limit,
  showHeading = true,
  viewAllHref,
}: BookingHistoryProps) => {
  const [activeTab, setActiveTab] = useState<HistoryTabKey>("resorts");
  const [rows, setRows] = useState<RowsByTab>(EMPTY_ROWS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Signed out, or auth hasn't resolved an email yet — nothing to
      // fetch, and nothing to keep a skeleton up for.
      if (!email) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setErrorMessage(null);
      // allSettled, not all: a member with resort bookings should still
      // see them if the cruise endpoint happens to be down.
      const [resorts, flights, cars, cruises] = await Promise.allSettled([
        fetchBookingsByEmail(email),
        fetchFlightBookingsByEmail(email),
        fetchCarBookingsByEmail(email),
        fetchCruiseBookingsByEmail(email),
      ]);
      if (cancelled) return;

      setRows({
        resorts:
          resorts.status === "fulfilled"
            ? resorts.value.map(resortBookingToRow).filter(hasHistoryContent)
            : [],
        flights:
          flights.status === "fulfilled"
            ? flights.value.map(flightBookingToRow).filter(hasHistoryContent)
            : [],
        cars:
          cars.status === "fulfilled"
            ? cars.value.map(carBookingToRow).filter(hasHistoryContent)
            : [],
        cruises:
          cruises.status === "fulfilled"
            ? cruises.value.map(cruiseBookingToRow).filter(hasHistoryContent)
            : [],
      });

      if (
        [resorts, flights, cars, cruises].every(
          (result) => result.status === "rejected",
        )
      ) {
        setErrorMessage("Could not load your history right now.");
      }
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [email]);

  const realRows = rows[activeTab];
  const isSample = !isLoading && realRows.length === 0;
  const visibleRows = useMemo(() => {
    const source = isSample
      ? getSampleRows(activeTab)
      : [...realRows].sort(byNewest);
    return limit ? source.slice(0, limit) : source;
  }, [activeTab, realRows, isSample, limit]);

  return (
    <section>
      {showHeading && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#0077be] rounded-full" />
            My History
          </h2>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline font-medium"
            >
              View all &rarr;
            </Link>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
        {/* Tabs. Scroll horizontally on a phone rather than wrapping, so
            the row keeps its height and the active tab stays findable. */}
        <div className="flex overflow-x-auto gap-1 p-2 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
          {HISTORY_TABS.map((tab) => {
            const active = tab.key === activeTab;
            const count = rows[tab.key].length;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={active ? "true" : undefined}
                className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${
                  active
                    ? "bg-[#18294B] dark:bg-[#0077be] text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs font-bold ${
                      active ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {errorMessage ? (
          <p className="p-6 text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        ) : isLoading ? (
          <div className="p-4 space-y-3 animate-pulse">
            {[0, 1, 2].map((key) => (
              <div
                key={key}
                className="h-24 bg-gray-100 dark:bg-white/5 rounded-lg"
              />
            ))}
          </div>
        ) : (
          <>  

            <div className="overflow-x-auto">
              {/* One grid for the header and every row, so the columns
                  line up while the whole thing scrolls sideways. */}
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[1.1fr_1fr_1.4fr_0.7fr_0.9fr] gap-4 px-4 py-3 bg-gray-100 dark:bg-white/5 text-sm font-bold text-gray-700 dark:text-gray-200">
                  <div>Exchange Type</div>
                  <div>Relinquishment</div>
                  <div>Confirmation</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                {visibleRows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.1fr_1fr_1.4fr_0.7fr_0.9fr] gap-4 px-4 py-5 border-t border-gray-200 dark:border-white/10 text-sm"
                  >
                    <div>
                      <p className="text-gray-800 dark:text-gray-100">
                        {row.typeLabel} #:{" "}
                        <span className="text-[#1a6fa8] dark:text-[#7fb8e6] font-medium break-all">
                          {row.reference}
                        </span>
                      </p>
                      <p className="text-gray-800 dark:text-gray-100">
                        {row.typeLabel}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Transaction Date:
                      </p>
                      <p className="text-gray-800 dark:text-gray-100">
                        {row.transactionDate || "—"}
                      </p>
                      {row.actionHref && (
                        <>
                          <div className="border-t border-gray-200 dark:border-white/10 my-3 w-4/5" />
                          <Link
                            href={row.actionHref}
                            className="text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline font-medium"
                          >
                            View History
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="text-gray-600 dark:text-gray-300">
                      {row.relinquishment ? (
                        <HistoryPartyCell party={row.relinquishment} />
                      ) : null}
                    </div>

                    <div>
                      <HistoryPartyCell party={row.confirmation} />
                    </div>

                    <div className="font-bold text-gray-800 dark:text-gray-100">
                      {row.status}
                    </div>

                    <div>
                      {row.actionLabel ? (
                        row.actionHref ? (
                          <Link
                            href={row.actionHref}
                            className="text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline font-medium"
                          >
                            {row.actionLabel}
                          </Link>
                        ) : (
                          <span className="text-[#1a6fa8] dark:text-[#7fb8e6] font-medium">
                            {row.actionLabel}
                          </span>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="px-4 py-2.5 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-white/10 sm:hidden">
              Swipe the table sideways to see status and actions.
            </p>
          </>
        )}
      </div>
    </section>
  );
};

// The resort/flight/car/cruise block that appears under Relinquishment
// and Confirmation: name, code, a few detail lines, then the dates.
const HistoryPartyCell = ({
  party,
}: {
  party: NonNullable<HistoryRow["relinquishment"]>;
}) => (
  <>
    <p className="font-semibold text-gray-800 dark:text-gray-100 leading-snug">
      {party.name}
    </p>
    {party.code && (
      <p className="text-gray-800 dark:text-gray-100">{party.code}</p>
    )}
    {party.details.length > 0 && (
      <div className="mt-2 space-y-0.5">
        {party.details.map((detail) => (
          <p key={detail} className="text-gray-500 dark:text-gray-400">
            {detail}
          </p>
        ))}
      </div>
    )}
    {(party.startDate || party.endDate) && (
      <div className="mt-2">
        {party.startDate && (
          <p className="text-gray-800 dark:text-gray-100">{party.startDate}</p>
        )}
        {party.endDate && (
          <p className="text-gray-800 dark:text-gray-100">{party.endDate}</p>
        )}
      </div>
    )}
  </>
);

export default BookingHistory;
