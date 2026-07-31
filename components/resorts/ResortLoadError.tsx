// Shared "something went wrong while loading resorts" state, with a
// retry button. Used across the country list, region list, and resort
// grid pages so a failed fetch always looks and behaves the same way.
interface ResortLoadErrorProps {
  message: string;
  onRetry: () => void;
}

const ResortLoadError = ({ message, onRetry }: ResortLoadErrorProps) => (
  <div className="text-center py-16 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
    <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
      Couldn&apos;t load resorts
    </p>
    <p className="text-red-500 dark:text-red-400/80 text-sm mb-4">
      {message}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-semibold px-5 py-2 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
    >
      Try Again
    </button>
  </div>
);

export default ResortLoadError;
