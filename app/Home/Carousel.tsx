"use client";

import homeSlider1 from "@/app/asset/images/home-slider-1.jpg";
import homeSlider2 from "@/app/asset/images/home-slider-2.jpg";
import homeSlider3 from "@/app/asset/images/home-slider-3.jpg";
import homeSlider4 from "@/app/asset/images/home-slider-4.jpg";
import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
  {
    image: homeSlider1,
    heading: "Welcome to Interval",
    text: "Explore resorts, plan getaways, and manage your bookings all in one place.",
  },
  {
    image: homeSlider2,
    heading: "Your Next Getaway Awaits",
    text: "Browse our resort directory and find the perfect destination.",
  },
  {
    image: homeSlider3,
    heading: "Exchange & Explore",
    text: "Flexible booking options built around how you like to travel.",
  },
  {
    image: homeSlider4,
    heading: "Designed for Easy Planning",
    text: "Stay informed, book with confidence, and enjoy a smoother member experience.",
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

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${active * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className="w-full shrink-0 h-[280px] sm:h-[360px] lg:h-[430px] relative"
          >
            <Image
              src={slide.image}
              alt={slide.heading}
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20" />
            <div className="absolute inset-0 flex items-center">
              <div className="mx-auto w-full max-w-245 px-6 sm:px-8 lg:px-12">
                <div className="max-w-[520px]">
                  <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3 sm:mb-4">
                    {slide.heading}
                  </h2>
                  <p className="text-white text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-snug">
                    {slide.text}
                  </p>
                  <button className="bg-white/20 hover:bg-white/30 border border-white text-white font-semibold py-2.5 px-6 sm:px-8 rounded-md transition">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          setActive((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
        }
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition text-2xl sm:text-3xl font-light z-20"
        aria-label="Previous slide"
      >
        &#10094;
      </button>
      <button
        onClick={() => setActive((prev) => (prev + 1) % slides.length)}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition text-2xl sm:text-3xl font-light z-20"
        aria-label="Next slide"
      >
        &#10095;
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2.5 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2.5 w-2.5 rounded-full border-2 border-white transition-all ${
              active === i ? "bg-white" : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
