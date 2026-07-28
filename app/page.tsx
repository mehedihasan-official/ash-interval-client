"use client";

// Homepage: shows the carousel + info content for logged-out visitors.
// Logged-in users are redirected to the resort directory (their main hub).
import { useAuth } from "@/lib/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Carousel from "./Home/Carousel";
import Content from "./Home/Content";
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/resort-directory");
    }
  }, [user, loading, router]);

  // While logged in (about to redirect), render nothing to avoid a flash
  // of the logged-out homepage content.
  if (user) return null;

  return (
    <div>
      <Carousel />
      <Content />
    </div>
  );
}
