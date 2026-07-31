"use client"; // Error boundaries must be Client Components

// Catches errors thrown while loading a single resort (e.g. the backend
// being unreachable) and offers a retry, instead of showing a blank page.
import { useEffect } from "react";

interface ResortDetailErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

const ResortDetailError = ({ error, unstable_retry }: ResortDetailErrorProps) => {
  useEffect(() => {
    console.error("Resort detail page error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-white dark:bg-[#0f172a]">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
          Couldn&apos;t load this resort
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {error.message || "Something went wrong while loading this resort's details."}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="inline-block bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-bold px-6 py-2.5 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default ResortDetailError;
