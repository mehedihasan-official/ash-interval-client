"use client";

// Points -> Cash conversion. A member sees their current points balance
// and cash wallet balance, enters how many points to convert (or taps a
// quick amount), previews what they'll receive at a flat $0.05 per point
// with no commission, then confirms. On success the wallet balances on
// screen update from the backend's response (never computed locally), so
// the numbers shown always match what's actually stored server-side.
import Loading from "@/components/resorts/Loading";
import {
  convertPointsToCash,
  fetchWallet,
  POINTS_TO_USD_RATE,
  type WalletSummary,
} from "@/lib/api/wallet";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaBolt,
  FaCheckCircle,
  FaCoins,
  FaExchangeAlt,
  FaPercentage,
  FaShieldAlt,
  FaWallet,
} from "react-icons/fa";
import Swal from "sweetalert2";

const formatUsd = (value: number) =>
  value.toLocaleString("en-US", { style: "currency", currency: "USD" });

const formatPoints = (value: number) => value.toLocaleString("en-US");

// Points -> dollars, rounded to the cent (avoids 0.15000000000000002 noise).
const pointsToUsd = (points: number) =>
  Math.round(points * POINTS_TO_USD_RATE * 100) / 100;

const QUICK_PERCENTAGES = [25, 50, 75, 100] as const;

const RATE_EXAMPLES = [1_000, 10_000, 50_000, 100_000] as const;

const HOW_IT_WORKS = [
  {
    title: "Enter your points",
    body: "Choose how many points you'd like to convert, up to your full balance.",
  },
  {
    title: "Review the payout",
    body: "See exactly what you'll receive before you confirm. The rate is flat.",
  },
  {
    title: "Cash lands in your wallet",
    body: "Your points are deducted and the cash is credited to your wallet right away.",
  },
] as const;

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
  const cashBalance = wallet?.cashBalance ?? 0;

  // No commission: the member receives the full value of the points.
  const payout = pointsToUsd(pointsToConvert);
  const isValidAmount = pointsToConvert > 0 && pointsToConvert <= availablePoints;

  const balanceAfter = useMemo(
    () => ({
      points: Math.max(0, availablePoints - pointsToConvert),
      cash: cashBalance + payout,
    }),
    [availablePoints, cashBalance, pointsToConvert, payout],
  );

  const handleInputChange = (value: string) => {
    // Digits only, so pasted "10,000" or stray characters can't break the amount.
    setPointsInput(value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
  };

  const handleQuickSelect = (percentage: number) => {
    setPointsInput(String(Math.floor((availablePoints * percentage) / 100)));
  };

  const handleConvert = async () => {
    if (!user?.email || !isValidAmount) return;

    const confirmed = await Swal.fire({
      title: "Confirm conversion",
      html: `Convert <strong>${formatPoints(pointsToConvert)} points</strong> into <strong>${formatUsd(
        payout,
      )}</strong> cash?<br/><span style="font-size:0.85em;color:#6b7280">${formatUsd(
        POINTS_TO_USD_RATE,
      )} per point &middot; no commission or fees.</span>`,
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
        title: "Conversion complete",
        html: `${formatPoints(result.pointsConverted)} points converted. <strong>${formatUsd(
          result.netAmount,
        )}</strong> has been added to your cash wallet.`,
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
      <div className="max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18294B] dark:text-white">
            Convert Points to Cash
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-2xl">
            Turn your points into cash for your wallet at a flat rate of{" "}
            {formatUsd(POINTS_TO_USD_RATE)} per point.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0077be]/10 dark:bg-white/10 text-[#0077be] dark:text-[#7fb8e6] text-xs font-semibold px-3 py-1.5">
              <FaCoins className="w-3 h-3" /> 1 point = {formatUsd(POINTS_TO_USD_RATE)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs font-semibold px-3 py-1.5">
              <FaPercentage className="w-3 h-3" /> No commission
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5">
              <FaBolt className="w-3 h-3" /> Credited to your wallet instantly
            </span>
          </div>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="md:col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#18294B] via-[#1a3a6b] to-[#0077be] dark:from-[#101b30] dark:via-[#14284a] dark:to-[#0b4f7c] p-6 sm:p-7 text-white shadow-lg">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-2 bottom-[-4.5rem] h-40 w-40 rounded-full bg-white/5"
                />
                <div className="relative">
                  <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                    <FaCoins /> Available Points
                  </div>
                  <p className="text-4xl sm:text-5xl font-bold mt-3 tracking-tight">
                    {formatPoints(availablePoints)}
                  </p>
                  <p className="text-sm text-white/70 mt-2">
                    Worth{" "}
                    <span className="font-semibold text-white">
                      {formatUsd(pointsToUsd(availablePoints))}
                    </span>{" "}
                    in cash
                  </p>
                </div>
              </div>

              <div className="md:col-span-2 rounded-2xl bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 p-6 sm:p-7 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    <FaWallet className="text-[#0077be] dark:text-[#7fb8e6]" /> Cash Wallet
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold mt-3 text-gray-800 dark:text-white tracking-tight">
                    {formatUsd(cashBalance)}
                  </p>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                  Cash from your conversions is added here.
                </p>
              </div>
            </div>

            {/* Converter + summary */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              <div className="lg:col-span-3 bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
                <h2 className="font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                  <FaExchangeAlt className="text-[#0077be] dark:text-[#7fb8e6]" /> Convert Points
                </h2>

                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="points-input"
                    className="text-sm font-medium text-gray-600 dark:text-gray-300"
                  >
                    Points to convert
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(100)}
                    disabled={availablePoints <= 0}
                    className="text-xs font-semibold text-[#0077be] dark:text-[#7fb8e6] hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    Use max
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="points-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={pointsInput ? formatPoints(Number(pointsInput)) : ""}
                    onChange={(event) => handleInputChange(event.target.value)}
                    placeholder="0"
                    aria-invalid={pointsToConvert > availablePoints}
                    className={`w-full rounded-xl border bg-white dark:bg-[#0f172a] text-gray-800 dark:text-white pl-4 pr-14 py-4 text-2xl font-bold focus:outline-none focus:ring-2 ${
                      pointsToConvert > availablePoints
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-gray-300 dark:border-white/10 focus:ring-[#0077be]/30"
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400 dark:text-gray-500">
                    pts
                  </span>
                </div>

                {pointsToConvert > availablePoints ? (
                  <p className="text-red-500 text-xs mt-2">
                    You only have {formatPoints(availablePoints)} points available.
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {pointsToConvert > 0
                      ? `${formatPoints(pointsToConvert)} points = ${formatUsd(payout)}`
                      : `You have ${formatPoints(availablePoints)} points available.`}
                  </p>
                )}

                <div className="grid grid-cols-4 gap-2 mt-4">
                  {QUICK_PERCENTAGES.map((percentage) => (
                    <button
                      key={percentage}
                      type="button"
                      onClick={() => handleQuickSelect(percentage)}
                      disabled={availablePoints <= 0}
                      className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 text-sm font-semibold py-2 hover:border-[#0077be] hover:text-[#0077be] dark:hover:text-[#7fb8e6] disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      {percentage === 100 ? "Max" : `${percentage}%`}
                    </button>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    Conversion rate
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {RATE_EXAMPLES.map((points) => (
                      <div
                        key={points}
                        className="rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 px-3 py-2.5 text-center"
                      >
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          {formatPoints(points)} pts
                        </p>
                        <p className="text-sm font-bold text-gray-800 dark:text-white mt-0.5">
                          {formatUsd(pointsToUsd(points))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-2 bg-white dark:bg-[#16223d] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
                <h2 className="font-bold text-gray-800 dark:text-white mb-5">Conversion Summary</h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Points converting</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatPoints(pointsToConvert)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Rate</span>
                    <span className="font-medium text-gray-800 dark:text-white">
                      {formatUsd(POINTS_TO_USD_RATE)} / point
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Commission</span>
                    <span className="font-medium text-green-600 dark:text-green-400">None</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 flex items-end justify-between">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    You receive
                  </span>
                  <span className="text-3xl font-bold text-[#0077be] dark:text-[#7fb8e6]">
                    {formatUsd(payout)}
                  </span>
                </div>

                {pointsToConvert > 0 && isValidAmount && (
                  <div className="mt-4 rounded-lg bg-gray-50 dark:bg-white/5 p-3 text-xs space-y-1.5">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Points after</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-200">
                        {formatPoints(availablePoints)} <FaArrowRight className="w-2.5 h-2.5" />{" "}
                        {formatPoints(balanceAfter.points)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Wallet after</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-200">
                        {formatUsd(cashBalance)} <FaArrowRight className="w-2.5 h-2.5" />{" "}
                        {formatUsd(balanceAfter.cash)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    disabled={!isValidAmount || isSubmitting}
                    onClick={handleConvert}
                    className="w-full bg-[#0077be] hover:bg-[#005a8e] disabled:bg-gray-300 dark:disabled:bg-white/10 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold px-5 py-3 rounded-xl transition"
                  >
                    {isSubmitting ? "Converting..." : "Convert to Cash"}
                  </button>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                  <FaShieldAlt className="w-3 h-3" /> Conversions can&apos;t be reversed once confirmed.
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {HOW_IT_WORKS.map((step, index) => (
                <div
                  key={step.title}
                  className="flex gap-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#16223d] p-5 shadow-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0077be]/10 dark:bg-white/10 text-sm font-bold text-[#0077be] dark:text-[#7fb8e6]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-1.5">
                      {step.title}
                      {index === 2 && <FaCheckCircle className="text-green-500 w-3 h-3" />}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PointsConversionPage;
