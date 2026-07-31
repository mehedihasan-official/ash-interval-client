// Resort directory route. Kept as a thin Server Component wrapper so the
// page can be statically shelled — the actual search UI lives in
// ResortDirectoryContent, which uses useSearchParams and therefore must
// be wrapped in <Suspense> (required by Next.js for client components
// that read the URL query string).
import { Suspense } from "react";
import type { Metadata } from "next";
import ResortDirectoryContent from "./ResortDirectoryContent";


export const metadata: Metadata = {
  title: "Resort Directory | Interval",
  description: "Search and browse our full collection of resorts.",
};

const ResortDirectoryFallback = () => (
  <div className="min-h-[70vh] px-4 sm:px-6 py-10 bg-white dark:bg-[#0f172a]">
    <div className="max-w-5xl mx-auto">
      <div className="h-9 w-64 bg-gray-100 dark:bg-white/5 rounded animate-pulse mb-2" />
      <div className="h-5 w-80 bg-gray-100 dark:bg-white/5 rounded animate-pulse mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const ResortDirectoryPage = () => {
  return (
    <Suspense fallback={<ResortDirectoryFallback />}>
      <ResortDirectoryContent />
    </Suspense>
  );
};

export default ResortDirectoryPage;
