"use client";

// Admin: add an airport. Its own page, separate from Add Flight, because
// airports are reference data — added once, then reused by every flight
// that touches them.
import AirportForm from "@/components/admin/AirportForm";
import { createAirport, type CreateAirportInput } from "@/lib/api/admin";
import Link from "next/link";
import Swal from "sweetalert2";

const AdminAddAirportPage = () => {
  const handleSubmit = async (data: CreateAirportInput) => {
    const created = await createAirport(data);
    await Swal.fire({
      title: "Airport added!",
      text: `${created.code} — ${created.name} is now searchable on the flight search.`,
      icon: "success",
      confirmButtonColor: "#0077be",
    });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Add New Airport</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        The airport appears in the flight search autocomplete as soon as
        it&apos;s saved. Add it here first, then{" "}
        <Link
          href="/dashboard/admin/flights/new"
          className="text-[#0077be] dark:text-[#7fb8e6] font-medium underline"
        >
          add flights
        </Link>{" "}
        that fly to or from it.
      </p>

      <AirportForm submitLabel="Save Airport" onSubmit={handleSubmit} />
    </div>
  );
};

export default AdminAddAirportPage;
