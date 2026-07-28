"use client";

// Create Profile page: registers a new user via email/password (with a
// membership number and phone captured for their record) or via Google.
import { type FormEvent } from "react";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/providers/AuthProvider";

const CreateProfilePage = () => {
  const { createProfile, googleLogin } = useAuth();

  // Handle the registration form submit — collects all fields, then
  // calls Firebase (via AuthProvider) to actually create the account.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const membership = (form.elements.namedItem("membership") as HTMLInputElement).value.trim();
    const areaCode = (form.elements.namedItem("areaCode") as HTMLInputElement).value.trim();
    const phoneNumber = (form.elements.namedItem("phoneNumber") as HTMLInputElement).value.trim();
    const userID = (form.elements.namedItem("userID") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value.trim();

    const phone = `${areaCode}-${phoneNumber}`;

    try {
      const response = await createProfile({ membership, phone, userID, email, password });
      if (response.success) {
        Swal.fire({
          icon: "success",
          title: "Profile created successfully",
          showConfirmButton: false,
          timer: 1500,
        });
        form.reset();
      } else {
        throw new Error(response.message ?? "Something went wrong");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong!";
      Swal.fire({ icon: "error", title: "Profile creation failed", text: message });
    }
  };

  // Handle "Sign up with Google" — same flow as regular Google login.
  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      Swal.fire({
        icon: "success",
        title: "Google login successful",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again";
      Swal.fire({ icon: "error", title: "Google login failed", text: message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-100">
        <h1 className="text-3xl font-bold text-center text-[#0077BE] mb-4">
          Create A Profile
        </h1>
        <p className="text-center text-gray-600 mb-8">
          To create your Web profile and password, please enter your membership
          number and the telephone number that matches your membership record.
        </p>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-left text-gray-700 font-semibold mb-2">
              Member Number
            </label>
            <input
              type="text"
              placeholder="Enter your membership number"
              className="w-full input input-bordered focus:ring-2 focus:ring-blue-500"
              name="membership"
              required
            />
          </div>

          <div>
            <label className="block text-left text-gray-700 font-semibold mb-2">
              Telephone
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <input
                  type="text"
                  placeholder="Area"
                  className="input input-bordered w-full focus:ring-2 focus:ring-blue-500"
                  name="areaCode"
                  required
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="input input-bordered w-full focus:ring-2 focus:ring-blue-500"
                  name="phoneNumber"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-left text-gray-700 font-semibold mb-2">
              Set UserID
            </label>
            <input
              type="text"
              placeholder="Choose a username"
              className="w-full input input-bordered focus:ring-2 focus:ring-blue-500"
              name="userID"
              required
            />
          </div>

          <div>
            <label className="block text-left text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full input input-bordered focus:ring-2 focus:ring-blue-500"
              name="email"
              required
            />
          </div>

          <div>
            <label className="block text-left text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Create a strong password"
              className="w-full input input-bordered focus:ring-2 focus:ring-blue-500"
              name="password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#0077BE] text-white py-3 rounded-lg font-bold hover:bg-[#005a9e] transition-all shadow-md"
          >
            Submit
          </button>
        </form>

        <div className="flex items-center gap-4 my-8">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-4 text-gray-700 border-2 border-gray-200 w-full py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all mb-8"
        >
          <FaGoogle className="text-red-500" /> Sign up with Google
        </button>

        <div className="text-center">
          <p className="text-gray-600 mb-1">Already have a Profile?</p>
          <Link href="/login" className="text-[#0077BE] font-bold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreateProfilePage;
