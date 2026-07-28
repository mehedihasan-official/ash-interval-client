"use client";

// Login page: lets an existing user sign in with email/password or Google.
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "@/lib/providers/AuthProvider";

const LoginPage = () => {
  const { login, googleLogin } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Handle the email/password login form submit.
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(loginId, password);
      Swal.fire({
        icon: "success",
        title: "Login successful",
        showConfirmButton: false,
        timer: 1500,
      });
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again";
      Swal.fire({ icon: "error", title: "Login failed", text: message });
    }
  };

  // Handle the "Sign in with Google" button.
  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      Swal.fire({
        icon: "success",
        title: "Google login successful",
        showConfirmButton: false,
        timer: 1500,
      });
      router.push("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again";
      Swal.fire({ icon: "error", title: "Google login failed", text: message });
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h1 className="text-center text-3xl font-bold text-[#0077BE] mb-8">Login</h1>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label htmlFor="loginId" className="block text-left text-gray-700 font-semibold mb-2">
              Login ID
            </label>
            <input
              type="text"
              id="loginId"
              className="input input-bordered w-full focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your login ID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="password" className="block text-left text-gray-700 font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="input input-bordered w-full focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-8 text-right">
            <a href="#" className="text-sm text-[#0077BE] font-medium hover:underline">
              LOGIN HELP &gt;
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0077BE] text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-all shadow-md mb-6"
          >
            Login
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-grow h-px bg-gray-200"></div>
          <span className="text-gray-400 text-sm font-medium">OR</span>
          <div className="flex-grow h-px bg-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-4 text-gray-700 border-2 border-gray-200 w-full py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all mb-8"
        >
          <FaGoogle className="text-red-500" /> Sign in with Google
        </button>

        <div className="text-center">
          <p className="text-gray-600 mb-1">Don&apos;t have a profile?</p>
          <Link href="/create-profile" className="text-[#0077BE] font-bold hover:underline">
            Create a profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
