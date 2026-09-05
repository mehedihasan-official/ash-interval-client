"use client";

// Admin: add a flight. Its own page, separate from Add Airport — a
// flight references two airports that already exist, so the two are
// different jobs done at different times.
import FlightForm from "@/components/admin/FlightForm";
import { createFlight, type CreateFlightInput } from "@/lib/api/admin";
import Link from "next/link";
import Swal from "sweetalert2";

const AdminAddFlightPage = () => {
  const handleSubmit = async (data: CreateFlightInput) => {
    const created = await createFlight(data);
    await Swal.fire({
      title: "Flight added!",
      // Echo back the numbers the backend worked out, since the admin may
      // have left duration, arrival and price blank on purpose.
      html: `<b>${created.airline} ${created.flightNumber}</b><br/>${created.origin} &rarr; ${created.destination} &middot; ${created.departureTime} &ndash; ${created.arrivalTime} (${created.duration})<br/>Retail $${created.retailPrice} &middot; member $${created.pricing.discountedPrice}`,
      icon: "success",
      confirmButtonColor: "#0077be",
    });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Add New Flight</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        The flight joins the search results as soon as it&apos;s saved. Both
        airports have to exist first &mdash;{" "}
        <Link
          href="/dashboard/admin/airports/new"
          className="text-[#0077be] dark:text-[#7fb8e6] font-medium underline"
        >
          add an airport
        </Link>{" "}
        if the one you need isn&apos;t in the dropdown.
      </p>

      <FlightForm submitLabel="Save Flight" onSubmit={handleSubmit} />
    </div>
  );
};

export default AdminAddFlightPage;
