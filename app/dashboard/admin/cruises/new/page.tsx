"use client";

// Admin: create a new cruise. Wraps the shared CruiseForm and pipes its
// submit through the admin cruise API (x-user-email is attached
// automatically by lib/api/admin.ts).
import CruiseForm, { EMPTY_CRUISE } from "@/components/admin/CruiseForm";
import { createCruise, type CreateCruiseInput } from "@/lib/api/admin";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const AdminAddCruisePage = () => {
  const router = useRouter();

  const handleSubmit = async (data: CreateCruiseInput) => {
    await createCruise(data);
    await Swal.fire({
      title: "Cruise added!",
      text: `${data.name} is now in the catalog.`,
      icon: "success",
      confirmButtonColor: "#0077be",
    });
    router.push("/dashboard/admin/cruises");
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-[#0077be] mb-1">Add New Cruise</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        This cruise will appear on the All Cruises page and in the Cruises
        search flow as soon as it&apos;s saved.
      </p>

      <CruiseForm
        initial={EMPTY_CRUISE}
        submitLabel="Save Cruise"
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AdminAddCruisePage;
