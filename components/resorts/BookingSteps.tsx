// Progress indicator shown across the checkout -> payment -> confirmation
// pages, so a member always knows where they are in the booking flow.
import { FaCheck } from "react-icons/fa";

const STEPS = ["Select Unit", "Checkout", "Payment", "Confirmation"];

interface BookingStepsProps {
  // Index (0-based) of the current step in STEPS.
  currentStep: number;
}

const BookingSteps = ({ currentStep }: BookingStepsProps) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex flex-col items-center ${
                isCurrent
                  ? "text-[#18294B] dark:text-[#7fb8e6]"
                  : "text-gray-400 dark:text-gray-600"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  isCurrent
                    ? "bg-[#18294B] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] border-[#18294B] dark:border-[#3ba0ea]"
                    : isComplete
                      ? "bg-gray-300 dark:bg-white/20 text-white border-gray-300 dark:border-white/20"
                      : "border-gray-300 dark:border-white/20"
                }`}
              >
                {isComplete ? <FaCheck className="w-3.5 h-3.5" /> : index + 1}
              </div>
              <p className="text-xs mt-1 hidden sm:block">{step}</p>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-2 ${
                  isComplete ? "bg-gray-300 dark:bg-white/20" : "bg-gray-200 dark:bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BookingSteps;
