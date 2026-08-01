"use client";

// Step 4 (final) of the booking funnel: confirms the booking succeeded.
// Wrapped in Suspense because it reads the bookingId back out of the URL
// via useSearchParams, which Next.js requires a Suspense boundary for.
import { Suspense } from "react";
import ConfirmationContent from "./ConfirmationContent";

const ConfirmationPage = () => {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a]" />}>
      <ConfirmationContent />
    </Suspense>
  );
};

export default ConfirmationPage;
