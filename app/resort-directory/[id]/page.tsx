"use client";

// Single resort detail route. Resort data is loaded in the browser from the
// existing REST API; this client does not need a Next.js server or database.
import { getResortById } from "@/lib/api/resorts";
import type { Resort } from "@/lib/types/resort";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import ResortDetailContent from "./ResortDetailContent";

interface ResortDetailPageProps {
  params: Promise<{ id: string }>;
}

const ResortDetailPage = ({ params }: ResortDetailPageProps) => {
  const { id } = use(params);
  const [resort, setResort] = useState<Resort | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const loadResort = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setNotFound(false);

      try {
        const result = await getResortById(id);
        if (isCancelled) return;
        if (!result) {
          setNotFound(true);
          setResort(null);
        } else {
          setResort(result);
        }
      } catch (error) {
        if (isCancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load this resort. Please try again.",
        );
        setResort(null);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadResort();
    return () => {
      isCancelled = true;
    };
  }, [id, retryCount]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-5 w-48 bg-gray-100 dark:bg-white/5 rounded mb-6" />
          <div className="h-64 sm:h-80 md:h-[420px] w-full bg-gray-100 dark:bg-white/5 rounded-lg mb-8" />
          <div className="h-10 w-2/3 bg-gray-100 dark:bg-white/5 rounded mb-4" />
          <div className="h-5 w-1/3 bg-gray-100 dark:bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-white dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            Resort Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We couldn&apos;t find a resort matching that link.
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

  if (errorMessage) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-white dark:bg-[#0f172a]">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
            Couldn&apos;t load this resort
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {errorMessage}
          </p>
          <button
            onClick={() => setRetryCount((count) => count + 1)}
            className="bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return resort ? <ResortDetailContent resort={resort} /> : null;
};

export default ResortDetailPage;
