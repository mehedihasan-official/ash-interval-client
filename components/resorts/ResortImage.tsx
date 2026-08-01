"use client";

// Renders a resort's photo with a graceful fallback. The imported resort
// dataset (1,700+ records) stores photos as up to four separate fields
// (img, img2, img3, img4) rather than a single `images` array, and any
// given resort may have some, all, or none of them populated — so this
// tries each candidate URL in order and only falls back to a local
// placeholder once every candidate has failed (or none were provided).
import placeholder from "@/app/asset/images/home-slider-4.jpg";
import Image from "next/image";
import { useState } from "react";

interface ResortImageProps {
  // Accepts either a single URL (existing usage) or a list of candidate
  // URLs to try in order (e.g. [resort.img, resort.img2, resort.img3]).
  src?: string | null | Array<string | null | undefined>;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

// Narrows a src prop (single value or array) down to the list of
// non-empty, real candidate URLs, in order.
const getCandidates = (src: ResortImageProps["src"]): string[] => {
  const list = Array.isArray(src) ? src : [src];
  return list.filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0,
  );
};

const ResortImage = ({
  src,
  alt,
  fill = true,
  sizes = "100vw",
  priority = false,
  className = "object-cover",
}: ResortImageProps) => {
  const candidates = getCandidates(src);

  const sourceKey = candidates.join("|");
  const [failedSource, setFailedSource] = useState<{
    key: string;
    index: number;
  } | null>(null);
  const candidateIndex =
    failedSource?.key === sourceKey ? failedSource.index : 0;

  const imageSource =
    candidateIndex < candidates.length
      ? candidates[candidateIndex]
      : placeholder;

  const handleError = () => {
    // Only advance if we're still within the real candidates — once
    // we've fallen through to the placeholder there's nothing left to
    // try, so don't loop.
    if (candidateIndex < candidates.length) {
      setFailedSource({ key: sourceKey, index: candidateIndex + 1 });
    }
  };

  return (
    <Image
      // key forces Next's <Image> to remount when we switch candidates —
      // without this it can keep showing the previously-successful (or
      // previously-failed) image instead of actually retrying the new src.
      key={`${sourceKey}:${candidateIndex}`}
      src={imageSource}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      unoptimized
      className={className}
      onError={handleError}
    />
  );
};

export default ResortImage;
