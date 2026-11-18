"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';






type UsageSlide = {
  id: string;
  title: string;
  image: string;
  alt: string;
  isGraphicSlide?: boolean;
};

const USAGE_SLIDES: UsageSlide[] = [
  {
    id: 'main-gate',
    title: 'বাড়ির মেইন গেট ও প্রবেশপথ',
    image: "/images/landing-page/pir-sensor-bulb/demo/usage_main_gate_night_1794877377849.jpg",
    alt: 'বাড়ির মেইন গেটের ভেতর দিয়ে একজন মানুষ প্রবেশ করছে এবং উপরের অটোমেটিক সেন্সর লাইট জ্বলে উঠেছে',
  },
  {
    id: 'staircase',
    title: 'সিঁড়িঘর ও ফ্ল্যাটের করিডোর',
    image: "/images/landing-page/pir-sensor-bulb/demo/usage_staircase_night_1794877378411.jpg",
    alt: 'রাতের বেলা সিঁড়িঘর দিয়ে মানুষ ওঠার সময় সিলিংয়ের মোশন সেন্সর লাইট অটোমেটিক জ্বলে উঠেছে',
  },
  {
    id: 'balcony',
    title: 'বারান্দা ও ব্যালকনি',
    image: "/images/landing-page/pir-sensor-bulb/demo/usage_balcony_evening_1794877378297.jpg",
    alt: 'সন্ধ্যায় বারান্দায় বের হওয়ার সাথে সাথে ছাদের অটোমেটিক সেন্সর লাইট জ্বলে উঠেছে',
  },
  {
    id: 'garage',
    title: 'গ্যারাজ ও পার্কিং এরিয়া',
    image: "/images/landing-page/pir-sensor-bulb/demo/usage_garage_night_1794877379053.jpg",
    alt: 'রাতে বাড়ির গ্যারাজে প্রবেশ করার সাথে সাথেই উপরের মোশন সেন্সর লাইট জ্বলে উঠেছে',
  },
  {
    id: 'anywhere',
    title: 'এছাড়াও আপনার সুবিধামতো যেকোনো জায়গায় ব্যবহার করতে পারবেন',
    image: "/images/landing-page/pir-sensor-bulb/demo/usage_anywhere_backdrop_1794877999859.jpg",
    alt: 'এছাড়াও আপনার সুবিধামতো যেকোনো জায়গায় ব্যবহার করতে পারবেন — বাথরুম, ছাদ, স্টোর রুম, অফিস ও দোকান',
    isGraphicSlide: true,
  },
];

const UsageLocationShowcase: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const totalSlides = USAGE_SLIDES.length;
  const currentSlide = USAGE_SLIDES[activeIndex];

  const goToPrev = () => {
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    }
  };

  return (
    <div
      className="max-w-4xl mx-auto"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-roledescription="carousel"
      aria-label="এই স্মার্ট সেন্সর লাইট ব্যবহারের স্থানসমূহ"
    >
      {/* Clean Photo Showcase Card with Left/Right Click Buttons */}
      <div className="relative rounded-2xl overflow-hidden border border-[#0BA9D6]/40 bg-[#021322] shadow-[0_22px_52px_rgba(2,15,26,0.7)]">
        <div className="relative aspect-[4/3] sm:aspect-[16/9] w-full bg-[#021322] overflow-hidden">
          {brokenImages[currentSlide.id] ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-b from-[#06283D] to-[#021322]">
              <div className="w-12 h-12 rounded-xl bg-[#0BA9D6]/20 border border-sky-300/30 flex items-center justify-center text-amber-300">
                <Lightbulb className="w-6 h-6" />
              </div>
              <p className="text-base font-semibold text-white">{currentSlide.title}</p>
            </div>
          ) : (
            <Image
              key={currentSlide.id}
              width={1376}
              height={768}
              unoptimized
              src={currentSlide.image}
              alt={currentSlide.alt}
              referrerPolicy="no-referrer"
              onError={() =>
                setBrokenImages((prev) => ({ ...prev, [currentSlide.id]: true }))
              }
              className="w-full h-full object-cover object-center transition-opacity duration-200 select-none"
            />
          )}

          {currentSlide.isGraphicSlide ? (
            <>
              {/* Rich Atmospheric Contrast Overlay for Slide 5 Graphic Poster */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 85% 80% at 50% 50%, rgba(2, 16, 27, 0.72) 0%, rgba(3, 27, 46, 0.84) 70%, rgba(2, 16, 27, 0.92) 100%)',
                }}
              />

              {/* Centered Poster Graphic Content (Safe Horizontal Padding Clear of Arrows) */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-14 sm:px-24 py-6">
                <div className="mb-3 sm:mb-4 w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-b from-[#0BA9D6]/35 to-[#03263D] border border-sky-300/40 border-b-[3px] border-b-[#02121E] shadow-[0_0_32px_rgba(251,191,36,0.35)] flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 sm:w-7 sm:h-7 text-amber-300" strokeWidth={2.1} />
                </div>

                <h3 className="font-display font-extrabold text-xl min-[400px]:text-2xl sm:text-3xl lg:text-[2.25rem] text-white leading-[1.35] max-w-2xl text-balance drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                  এছাড়াও আপনার সুবিধামতো{' '}
                  <span className="text-amber-300">যেকোনো জায়গায়</span>{' '}
                  ব্যবহার করতে পারবেন
                </h3>

                <div className="mt-3 sm:mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-sm text-sky-100/90 font-medium">
                  <span>বাথরুম</span>
                  <span aria-hidden="true">·</span>
                  <span>ছাদের দরজা</span>
                  <span aria-hidden="true">·</span>
                  <span>স্টোর রুম</span>
                  <span aria-hidden="true">·</span>
                  <span>দোকান ও অফিস</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Bottom Measured Contrast Scrim for Clean Title Only */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-32 bg-gradient-to-t from-[#02101B]/95 via-[#02101B]/50 to-transparent" />

              {/* Clean Centered Title at Bottom */}
              <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3.5 sm:px-7 sm:pb-5 text-center">
                <h3 className="text-lg sm:text-2xl font-bold text-white leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {currentSlide.title}
                </h3>
              </div>
            </>
          )}

          {/* Left Click Button (Previous Photo) */}
          <button
            type="button"
            onClick={goToPrev}
            aria-label="আগের ছবিতে যান"
            className="absolute left-2.5 sm:left-4 top-[45%] -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#021322]/85 hover:bg-[#0BA9D6] text-white border border-sky-300/45 shadow-[0_8px_22px_rgba(0,0,0,0.65)] backdrop-blur-sm flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Right Click Button (Next Photo) */}
          <button
            type="button"
            onClick={goToNext}
            aria-label="পরের ছবিতে যান"
            className="absolute right-2.5 sm:right-4 top-[45%] -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#021322]/85 hover:bg-[#0BA9D6] text-white border border-sky-300/45 shadow-[0_8px_22px_rgba(0,0,0,0.65)] backdrop-blur-sm flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsageLocationShowcase;
