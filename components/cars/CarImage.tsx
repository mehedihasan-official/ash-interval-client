"use client";

// Car thumbnail with a two-stage fallback:
//   1. Try the server-provided image (imagin.studio brand-specific render).
//   2. On error, swap to a category-appropriate stock photo so a member
//      never sees a broken image icon.
//   3. If even that fails, render an inline car-icon placeholder.
//
// Keeping the fallback logic in one component means every place that
// shows a car photo (results grid, detail page, confirmation) behaves
// the same without each caller reimplementing onError handling.
import { useState } from "react";
import { FaCar } from "react-icons/fa";

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  economy:
    "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop",
  compact:
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop",
  midsize:
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop",
  fullsize:
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop",
  suv: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop",
  "compact-suv":
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop",
  luxury:
    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop",
  electric:
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop",
  minivan:
    "https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=800&auto=format&fit=crop",
  convertible:
    "https://images.unsplash.com/photo-1547038577-da80abbc4f19?w=800&auto=format&fit=crop",
  pickup:
    "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop",
};

interface CarImageProps {
  src?: string;
  category?: string;
  alt: string;
  className?: string;
}

const CarImage = ({ src, category, alt, className }: CarImageProps) => {
  // Which URL is currently being attempted: 0 = server src, 1 = fallback,
  // 2 = give up and show the icon placeholder.
  const [stage, setStage] = useState<0 | 1 | 2>(src ? 0 : 1);

  const fallback = category ? CATEGORY_FALLBACK_IMAGES[category] : undefined;
  const activeSrc = stage === 0 ? src : stage === 1 ? fallback : undefined;

  if (!activeSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-white/5 ${className ?? ""}`}
      >
        <FaCar className="w-10 h-10 text-gray-300" aria-label={alt} />
      </div>
    );
  }

  return (
    // Plain <img> (not next/image) because imagin.studio doesn't play
    // well with the Next image loader's remote patterns and we want
    // the onError swap to run synchronously.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={activeSrc}
      alt={alt}
      onError={() => setStage((current) => (current < 2 ? ((current + 1) as 0 | 1 | 2) : current))}
      className={className}
    />
  );
};

export default CarImage;
