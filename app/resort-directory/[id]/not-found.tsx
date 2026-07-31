// Rendered automatically when the resort page calls notFound() — i.e. the
// requested resort id doesn't exist in the database.
import Link from "next/link";

const ResortNotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-white dark:bg-[#0f172a]">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-[#18294B] dark:text-white mb-3">
          Resort Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We couldn&apos;t find a resort matching that link. It may have been
          removed, or the link may be incorrect.
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
};

export default ResortNotFound;
