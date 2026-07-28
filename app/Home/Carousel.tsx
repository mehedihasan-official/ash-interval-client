"use client";

// Homepage hero carousel.
// Mobile and desktop are intentionally two different layouts (not just
// resized versions of each other), matching the separate mobile/desktop
// reference designs:
//   - Mobile: compact slider, caption baked into the bottom-left of the
//     image, small round dot indicators, no side arrows or CTA button.
//   - Desktop: tall two-tone hero (dark caption panel + photo), large
//     heading/subcopy, a "Learn More" button, side arrows, and dot
//     indicators — modeled on the full intervalworld.com desktop hero.
import homeSlider1 from "@/app/asset/images/home-slider-1.jpg";
import homeSlider2 from "@/app/asset/images/home-slider-2.jpg";
import homeSlider3 from "@/app/asset/images/home-slider-3.jpg";
import homeSlider4 from "@/app/asset/images/home-slider-4.jpg";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    image: homeSlider1,
    heading: "Total price. Total transparency.",
    text: "Vacation planning is easier than ever with up-front pricing.",
    mobileCaption: "Hotel deals. Cruise discounts. Car savings. More.",
  },
  {
    image: homeSlider2,
    heading: "Your Next Getaway Awaits",
    text: "Browse our resort directory and find the perfect destination.",
    mobileCaption: "Browse resorts and find your next stay.",
  },
  {
    image: homeSlider3,
    heading: "Exchange & Explore",
    text: "Flexible booking options built around how you like to travel.",
    mobileCaption: "Flexible exchanges built around how you travel.",
  },
  {
    image: homeSlider4,
    heading: "Designed for Easy Planning",
    text: "Stay informed, book with confidence, and enjoy a smoother member experience.",
    mobileCaption: "Plan with confidence, every step of the way.",
  },
];

const Carousel = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goPrev = () =>
    setActive((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const goNext = () => setActive((prev) => (prev + 1) % slides.length);

  return (
    <>
      {/* ---------- Mobile carousel ---------- */}
      <div className="md:hidden relative w-full overflow-hidden bg-[#18294B]">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="w-full shrink-0 h-[190px] relative">
              <Image
                src={slide.image}
                alt={slide.heading}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-0 right-0 px-4">
                <p className="text-white text-base font-bold leading-snug drop-shadow-md">
                  {slide.mobileCaption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Prev/next tap zones (subtle, no visible arrows on mobile) */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 h-full w-1/6 z-20"
          aria-label="Previous slide"
        />
        <button
          onClick={goNext}
          className="absolute right-0 top-0 h-full w-1/6 z-20"
          aria-label="Next slide"
        />

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 w-2 rounded-full border border-white transition-all ${
                active === i ? "bg-white" : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ---------- Desktop carousel ---------- */}
      <div className="hidden md:block relative w-full overflow-hidden bg-[#18294B]">
        <div className="max-w-[980px] mx-auto">
          <div className="relative h-[420px]">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {slides.map((slide, i) => (
                <div key={i} className="w-full shrink-0 h-full relative flex">
                  {/* Dark caption panel */}
                  <div className="w-[42%] h-full bg-[#18294B] flex items-center px-8 lg:px-10 shrink-0">
                    <div>
                      <h2 className="text-white text-3xl lg:text-4xl font-bold leading-tight mb-4">
                        {slide.heading}
                      </h2>
                      <p className="text-white/90 text-base leading-snug mb-6">
                        {slide.text}
                      </p>
                      <button className="bg-[#0077be] hover:bg-[#005a8e] text-white font-semibold py-2.5 px-7 rounded transition">
                        Learn More
                      </button>
                    </div>
                  </div>
                  {/* Photo panel */}
                  <div className="relative grow h-full">
                    <Image
                      src={slide.image}
                      alt={slide.heading}
                      fill
                      priority={i === 0}
                      sizes="60vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition text-3xl font-light z-20"
              aria-label="Previous slide"
            >
              &#10094;
            </button>
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition text-3xl font-light z-20"
              aria-label="Next slide"
            >
              &#10095;
            </button>
          </div>
        </div>

        <div className="w-full bg-white py-3 flex justify-center gap-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 w-2.5 rounded-full border-2 transition-all ${
                active === i
                  ? "bg-[#18294B] border-[#18294B]"
                  : "bg-transparent border-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Carousel;
