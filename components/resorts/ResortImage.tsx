"use client";

// Renders a resort's photo with a graceful fallback. The imported resort
// dataset (1,700+ records) doesn't guarantee every resort has an `images`
// array, and even when it does the URL may be broken or unreachable — so
// this always falls back to a local placeholder rather than showing a
// broken-image icon.
import Image from "next/image";
import { useState } from "react";
import placeholder from "@/app/asset/images/home-slider-4.jpg";

interface ResortImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

const ResortImage = ({
  src,
  alt,
  fill = true,
  sizes = "100vw",
  priority = false,
  className = "object-cover",
}: ResortImageProps) => {
  // Track load failures so we can swap to the placeholder instead of
  // leaving a broken image in place.
  const [failed, setFailed] = useState(false);

  const imageSource = !src || failed ? placeholder : src;

  return (
    <Image
      src={imageSource}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

export default ResortImage;
