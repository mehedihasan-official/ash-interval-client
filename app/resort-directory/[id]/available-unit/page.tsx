"use client";

// Step 1 of the booking funnel: shows the unit types available for the
// dates/guests just searched, with points or cash pricing depending on
// which vacation type the visitor chose on the resort page. Picking a
// unit saves a booking draft (see lib/bookingDraft.ts) and moves on to
// checkout.
import { getResortById } from "@/lib/api/resorts";
import type { Resort } from "@/lib/types/resort";
import Link from "next/link";
import { use, useEffect, useState, Suspense } from "react";
import AvailableUnitContent from "./AvailableUnitContent";

interface AvailableUnitPageProps {
  params: Promise<{ id: string }>;
}

const AvailableUnitPage = ({ params }: AvailableUnitPageProps) => {
  const { id } = use(params);
  const [resort, setResort] = useState<Resort | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadResort = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await getResortById(id);
        if (isCancelled) return;
        setResort(result);
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load this resort. Please try again.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadResort();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-gray-50 dark:bg-[#0f172a]">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-24 w-full bg-gray-100 dark:bg-white/5 rounded-2xl mb-8" />
          <div className="h-32 w-full bg-gray-100 dark:bg-white/5 rounded-2xl mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-64 bg-gray-100 dark:bg-white/5 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !resort) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-gray-50 dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            {errorMessage ? "Couldn't load this resort" : "Resort Not Found"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {errorMessage ??
              "We couldn't find a resort matching that link. Please start your search again."}
          </p>
          <Link
            href="/resort-directory"
            className="inline-block bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
          >
            Browse Resort Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      <AvailableUnitContent resort={resort} />
    </Suspense>
  );
};

export default AvailableUnitPage;
