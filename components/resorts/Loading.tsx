// Simple centered spinner shown while the shared resort dataset is
// loading. Kept as a plain component (no "use client") since it has no
// state or interactivity of its own.
const Loading = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div
      className="h-12 w-12 rounded-full border-4 border-gray-200 dark:border-white/10 border-t-[#0077be] dark:border-t-[#3ba0ea] animate-spin"
      role="status"
      aria-label="Loading"
    />
  </div>
);

export default Loading;
