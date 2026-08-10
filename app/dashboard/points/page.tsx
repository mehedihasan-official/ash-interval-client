"use client";

// Points -> Cash conversion. A member sees their current points balance
// and cash wallet balance, enters how many points to convert, previews the
// 30% commission breakdown, then confirms. On success the wallet balances
// on screen update from the backend's response (never computed locally),
// so the numbers shown always match what's actually stored server-side.
import Loading from "@/components/resorts/Loading";
import {
  convertPointsToCash,
  fetchWallet,
  POINTS_CONVERSION_COMMISSION_RATE,
  POINTS_TO_USD_RATE,
  type WalletSummary,
} from "@/lib/api/wallet";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaCoins, FaExchangeAlt, FaWallet } from "react-icons/fa";
import Swal from "sweetalert2";

const formatUsd = (value: number) =>
  value.toLocaleString(undefined, { style: "currency", currency: "USD" });

const PointsConversionPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pointsInput, setPointsInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Bumped by the "Try Again" button to re-run the load effect below
  // without calling setState synchronously from an event handler's effect.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.email) return;
    let isCancelled = false;

    const loadWallet = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const summary = await fetchWallet(user.email as string);
        if (isCancelled) return;
        setWallet(summary);
      } catch (error) {
        if (isCancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load your wallet right now.",
        );
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadWallet();
    return () => {
      isCancelled = true;
    };
  }, [user?.email, reloadToken]);

  const pointsToConvert = Math.floor(Number(pointsInput) || 0);
  const availablePoints = wallet?.points ?? 0;

  const preview = useMemo(() => {
    const grossAmount = pointsToConvert * POINTS_TO_USD_RATE;
    const commissionAmount = grossAmount * POINTS_CONVERSION_COMMISSION_RATE;
    const netAmount = grossAmount - commissionAmount;
    return { grossAmount, commissionAmount, netAmount };
  }, [pointsToConvert]);

  const isValidAmount = pointsToConvert > 0 && pointsToConvert <= availablePoints;

  const handleConvert = async () => {
    if (!user?.email || !isValidAmount) return;

    const confirmed = await Swal.fire({
      title: "Confirm conversion",
      html: `Convert <strong>${pointsToConvert.toLocaleString()} points</strong> into <strong>${formatUsd(
        preview.netAmount,
      )}</strong> cash?<br/><span style="font-size:0.85em;color:#6b7280">A 30% commission (${formatUsd(
        preview.commissionAmount,
      )}) applies.</span>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Convert Now",
      confirmButtonColor: "#0077be",
      cancelButtonText: "Cancel",
    });
    if (!confirmed.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const result = await convertPointsToCash(user.email, pointsToConvert);
      setWallet({ points: result.points, cashBalance: result.cashBalance });
      setPointsInput("");
      await Swal.fire({
        title: "Converted!",
        html: `${result.pointsConverted.toLocaleString()} points converted. <strong>${formatUsd(
          result.netAmount,
        )}</strong> added to your cash wallet.`,
        icon: "success",
        confirmButtonColor: "#0077be",
      });
    } catch (error) {
      await Swal.fire({
        title: "Conversion failed",
        text: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#0077be",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return <Loading />;
  }

  return (
    <div className="min-h-[70vh] bg-gray-50 dark:bg-[#0f172a] px-4 sm:px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0077be] mb-1">Convert Points to Cash</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Exchange your Interval points for cash in your wallet. A 30% commission fee applies to
          every conversion.
        </p>

        {isLoading ? (
          <Loading />
        ) : loadError ? (
          <div className="text-center py-12 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
            <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
              Couldn&apos;t load your wallet
            </p>
            <p className="text-red-500 dark:text-red-400/80 text-sm mb-4">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadToken((token) => token + 1)}
              className="bg-[#0077be] dark:bg-[#3ba0ea] text-white dark:text-[#0f172a] font-semibold px-5 py-2 rounded hover:bg-[#005a8e] dark:hover:bg-[#62b4f0] transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            {/* Balances */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#18294B] dark:bg-[#101b30] rounded-2xl p-6 text-white shadow-sm">
                <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                  <FaCoins /> Points Balance
                </div>
                <p className="text-3xl font-bold mt-2">{availablePoints.toLocaleString()}</p>
              </div>
              <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                  <FaWallet className="text-[#0077be] dark:text-[#7fb8e6]" /> Cash Wallet
                </div>
                <p className="text-3xl font-bold mt-2 text-gray-800 dark:text-white">
                  {formatUsd(wallet?.cashBalance ?? 0)}
                </p>
              </div>
            </div>

            {/* Conversion form */}
            <div className="bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FaExchangeAlt className="text-[#0077be] dark:text-[#7fb8e6]" /> Convert Points
              </h2>

              <label
                htmlFor="points-input"
                className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5"
              >
                Points to convert
              </label>
              <input
                id="points-input"
                type="number"
                min={1}
                max={availablePoints}
                step={1}
                value={pointsInput}
                onChange={(event) => setPointsInput(event.target.value)}
                placeholder={`Up to ${availablePoints.toLocaleString()}`}
                className="w-full rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077be]/30"
              />
              {pointsToConvert > availablePoints && (
                <p className="text-red-500 text-xs mt-1.5">
                  You only have {availablePoints.toLocaleString()} points available.
                </p>
              )}

              {pointsToConvert > 0 && (
                <div className="mt-5 rounded-lg bg-blue-50 dark:bg-white/5 p-4 text-sm space-y-1.5">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Points value</span>
                    <span className="font-medium">{formatUsd(preview.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Commission fee (30%)</span>
                    <span className="font-medium text-red-500">
                      -{formatUsd(preview.commissionAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-800 dark:text-white font-bold pt-1.5 border-t border-gray-200 dark:border-white/10">
                    <span>You receive</span>
                    <span>{formatUsd(preview.netAmount)}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!isValidAmount || isSubmitting}
                onClick={handleConvert}
                className="w-full mt-5 bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-300 dark:disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-lg transition"
              >
                {isSubmitting ? "Converting..." : "Convert to Cash"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PointsConversionPage;
