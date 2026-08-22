"use client";

// Admin: edit an existing cruise. Loads the current record via the
// public getCruiseById endpoint (server returns everything the form
// needs), then PATCHes the changed fields through the admin endpoint.
import Loading from "@/components/resorts/Loading";
import CruiseForm from "@/components/admin/CruiseForm";
import { updateCruise, type CreateCruiseInput } from "@/lib/api/admin";
import { getCruiseById } from "@/lib/api/cruises";
import type { Cruise } from "@/lib/types/cruise";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import Swal from "sweetalert2";

interface EditCruisePageProps {
  params: Promise<{ id: string }>;
}

const cruiseToInput = (cruise: Cruise): CreateCruiseInput => ({
  cruiseId: cruise.cruiseId,
  name: cruise.name,
  cruiseLine: cruise.cruiseLine,
  cruiseLineLogo: cruise.cruiseLineLogo ?? "",
  route: cruise.route,
  departurePort: cruise.departurePort,
  duration: cruise.duration,
  category: cruise.category,
  image: cruise.image ?? "",
  rating: cruise.rating,
  reviews: cruise.reviews,
  itinerary: cruise.itinerary ?? [],
  shipFeatures: cruise.shipFeatures ?? [],
  cabinTypes: cruise.cabinTypes,
  departureDates: cruise.departureDates ?? [],
  includes: cruise.includes ?? [],
});

const AdminEditCruisePage = ({ params }: EditCruisePageProps) => {
  const router = useRouter();
  const { id } = use(params);

  const [initial, setInitial] = useState<CreateCruiseInput | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const cruise = await getCruiseById(id, {
          cabinType: "inside",
          adults: 2,
          children: 0,
          infants: 0,
        });
        if (cancelled) return;
        if (!cruise) {
          setErrorMessage("Cruise not found.");
        } else {
          setInitial(cruiseToInput(cruise));
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Could not load this cruise.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (data: CreateCruiseInput) => {
    await updateCruise(id, data);
    await Swal.fire({
      title: "Cruise updated",
      text: `${data.name} has been saved.`,
      icon: "success",
      confirmButtonColor: "#0077be",
    });
    router.push("/dashboard/admin/cruises");
  };

  if (isLoading) return <Loading />;

  if (errorMessage) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/dashboard/admin/cruises"
          className="inline-flex items-center gap-1 text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-4"
        >
          <FaChevronLeft className="w-3 h-3" /> Back to Cruises
        </Link>
        <div className="text-center py-16 border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 rounded-lg">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-1">
            Couldn&apos;t load cruise
          </p>
          <p className="text-red-500 dark:text-red-400/80 text-sm">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  if (!initial) return null;

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/admin/cruises"
        className="inline-flex items-center gap-1 text-sm text-[#1a6fa8] dark:text-[#7fb8e6] hover:underline mb-4"
      >
        <FaChevronLeft className="w-3 h-3" /> Back to Cruises
      </Link>
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Edit Cruise</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Changes apply to the cruise catalog immediately once saved.
      </p>

      <CruiseForm
        initial={initial}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
        lockCruiseId
      />
    </div>
  );
};

export default AdminEditCruisePage;
