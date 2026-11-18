"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight, BadgeCheck, CheckCircle2, Globe, HandCoins, Lightbulb,
  Phone, PhoneCall, QrCode, Radar, RefreshCw, ShieldCheck, ShoppingBag,
  SunMoon, Timer, Truck, Zap,
} from "lucide-react";
import UsageLocationShowcase from "./UsageLocationShowcase";
import "./demo-landing.css";

export default function DemoLandingStory() {
  const [bulbImgError, setBulbImgError] = useState(false);
  return (
    <div className="pir-demo-story">
        {/* FIRST SECTION: ONESELF BD BRAND COLOR HERO */}
        <section
          className="relative overflow-hidden text-white border-b border-[#0BA9D6]/30"
          style={{
            background:
              'linear-gradient(135deg, #031B2E 0%, #053B66 45%, #0369A1 78%, #0BA9D6 100%)',
          }}
        >
          <div className="relative z-10 max-w-[1140px] mx-auto px-3 sm:px-6 pt-8 pb-14 sm:pt-12 sm:pb-20 lg:pt-14 lg:pb-[5.5rem] text-center flex flex-col items-center">
            {/* Top Centered Official Logo */}
            <div className="mb-6 sm:mb-8 bg-white px-5 py-2.5 sm:px-6 sm:py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-white/80">
              <Image
                src="/images/landing-page/pir-sensor-bulb/demo/oneself-logo.png"
                width={1200}
                height={493}
                unoptimized
                alt="OneSelf BD"
                referrerPolicy="no-referrer"
                className="h-9 sm:h-12 w-auto object-contain"
              />
            </div>

            {/* HEADLINE CONTAINER WITH SUBTLE BACKGROUND SCENE:
                Top Holder + Glowing PIR Bulb + Soft Spreading Light Beam + Person Below
                Tuned so the lighting is subtle and the headline text is 100% crisp and legible */}
            <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-sky-400/20 shadow-[0_20px_50px_rgba(2,19,32,0.6)] px-3 sm:px-10 pt-24 pb-28 sm:pt-28 sm:pb-32">
              {/* Background Scene Scoped Strictly to This Headline Area */}
              <div
                className="pointer-events-none select-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, #02101B 0%, #031B2E 50%, #021322 100%)',
                }}
              >
                {/* Very Subtle Volumetric Light Cone Glow */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'conic-gradient(from 138deg at 50% 48px, transparent 0deg, rgba(251, 191, 36, 0.02) 8deg, rgba(254, 240, 138, 0.11) 42deg, rgba(251, 191, 36, 0.02) 76deg, transparent 84deg)',
                  }}
                />

                {/* SVG Illustration: Ceiling Socket Holder at Top, Soft Spreading Light Cone, Person at Bottom */}
                <svg
                  viewBox="0 0 900 520"
                  preserveAspectRatio="xMidYMid slice"
                  className="w-full h-full"
                >
                  <defs>
                    <linearGradient id="headlineBeamOuter" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.26" />
                      <stop offset="28%" stopColor="#FDE047" stopOpacity="0.09" />
                      <stop offset="65%" stopColor="#38BDF8" stopOpacity="0.05" />
                      <stop offset="100%" stopColor="#0BA9D6" stopOpacity="0.02" />
                    </linearGradient>

                    <linearGradient id="headlineBeamCore" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                      <stop offset="30%" stopColor="#FEF08A" stopOpacity="0.08" />
                      <stop offset="85%" stopColor="#F59E0B" stopOpacity="0.03" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                    </linearGradient>

                    <radialGradient id="headlineFloorPool" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FDE047" stopOpacity="0.24" />
                      <stop offset="55%" stopColor="#0BA9D6" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#02111D" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id="headlineBulbGlobe" cx="50%" cy="45%" r="55%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="65%" stopColor="#FEF08A" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </radialGradient>

                    <linearGradient id="headlineHolderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#64748B" />
                      <stop offset="50%" stopColor="#F8FAFC" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>

                    <linearGradient id="headlinePersonLit" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.7" />
                      <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#06283D" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Soft Spreading Light Cone from Bulb Downward */}
                  <polygon points="450,58 40,520 860,520" fill="url(#headlineBeamOuter)" />
                  <polygon points="450,58 190,520 710,520" fill="url(#headlineBeamCore)" />

                  {/* Faint Light Rays */}
                  <g stroke="#FEF08A" strokeWidth="1" opacity="0.09">
                    <line x1="450" y1="62" x2="140" y2="520" />
                    <line x1="450" y1="62" x2="290" y2="520" />
                    <line x1="450" y1="62" x2="450" y2="520" />
                    <line x1="450" y1="62" x2="610" y2="520" />
                    <line x1="450" y1="62" x2="760" y2="520" />
                  </g>

                  {/* Subtle PIR Infrared Sensor Waves */}
                  <path
                    d="M 355 120 Q 450 175 545 120"
                    fill="none"
                    stroke="#FDE047"
                    strokeWidth="1.2"
                    strokeDasharray="5 5"
                    opacity="0.22"
                  />
                  <path
                    d="M 280 190 Q 450 275 620 190"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="1"
                    strokeDasharray="7 7"
                    opacity="0.14"
                  />

                  {/* TOP: Ceiling Holder + Glowing PIR Motion Sensor Bulb */}
                  <g transform="translate(450, 0)">
                    {/* Ceiling Mount */}
                    <path
                      d="M -44 0 L 44 0 L 34 10 L -34 10 Z"
                      fill="#334155"
                      stroke="#64748B"
                      strokeWidth="1"
                    />
                    <rect x="-5" y="10" width="10" height="8" fill="#1E293B" />

                    {/* Socket Holder (হোল্ডার) */}
                    <rect
                      x="-20"
                      y="18"
                      width="40"
                      height="20"
                      rx="3"
                      fill="url(#headlineHolderGrad)"
                      stroke="#475569"
                      strokeWidth="1.2"
                    />
                    <line x1="-18" y1="25" x2="18" y2="25" stroke="#64748B" strokeWidth="1.2" />
                    <line x1="-18" y1="31" x2="18" y2="31" stroke="#64748B" strokeWidth="1.2" />

                    {/* Bulb Body Collar */}
                    <path
                      d="M -17 38 L 17 38 L 27 56 L -27 56 Z"
                      fill="#F8FAFC"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />

                    {/* Soft Bulb Glow Aura */}
                    <circle cx="0" cy="68" r="38" fill="#FEF08A" opacity="0.22" />
                    <circle cx="0" cy="68" r="22" fill="#FFFFFF" opacity="0.35" />

                    {/* Glowing Diffuser Globe */}
                    <path
                      d="M -27 56 C -30 78, -16 90, 0 90 C 16 90, 30 78, 27 56 Z"
                      fill="url(#headlineBulbGlobe)"
                      stroke="#FEF08A"
                      strokeWidth="1.2"
                      opacity="0.9"
                    />

                    {/* PIR Sensor Fresnel Tip */}
                    <path
                      d="M -12 88 C -12 99, 12 99, 12 88 Z"
                      fill="#FFFFFF"
                      stroke="#FDE047"
                      strokeWidth="1.2"
                    />
                  </g>

                  {/* BOTTOM: Illuminated Floor Pool & Person Standing in the Spreading Light */}
                  <g transform="translate(450, 445)">
                    <ellipse cx="0" cy="52" rx="240" ry="30" fill="url(#headlineFloorPool)" />
                    <ellipse cx="0" cy="52" rx="100" ry="14" fill="#FEF08A" opacity="0.18" />

                    {/* Sensor Target Ring on Floor */}
                    <ellipse
                      cx="0"
                      cy="52"
                      rx="70"
                      ry="12"
                      fill="none"
                      stroke="#FDE047"
                      strokeWidth="1.2"
                      strokeDasharray="5 4"
                      opacity="0.4"
                    />

                    {/* Person Silhouette Lit from Above */}
                    <g transform="translate(0, -38)" opacity="0.85">
                      <circle cx="0" cy="32" r="38" fill="#FEF08A" opacity="0.1" />
                      {/* Head */}
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="url(#headlinePersonLit)"
                        stroke="#FEF08A"
                        strokeWidth="1.4"
                      />
                      {/* Torso */}
                      <path
                        d="M -14 17 C -14 13, 14 13, 14 17 L 17 52 L -17 52 Z"
                        fill="url(#headlinePersonLit)"
                        stroke="#FEF08A"
                        strokeWidth="1.2"
                      />
                      {/* Arms */}
                      <path
                        d="M -14 18 L -25 42 L -19 45 L -11 26"
                        fill="url(#headlinePersonLit)"
                        stroke="#FEF08A"
                        strokeWidth="1"
                      />
                      <path
                        d="M 14 18 L 24 40 L 18 43 L 11 26"
                        fill="url(#headlinePersonLit)"
                        stroke="#FEF08A"
                        strokeWidth="1"
                      />
                      {/* Legs */}
                      <path
                        d="M -11 50 L -17 90 L -8 90 L -2 52"
                        fill="#07334E"
                        stroke="#38BDF8"
                        strokeWidth="1"
                      />
                      <path
                        d="M 11 50 L 18 90 L 9 90 L 2 52"
                        fill="#07334E"
                        stroke="#38BDF8"
                        strokeWidth="1"
                      />
                    </g>
                  </g>
                </svg>

                {/* Central Contrast Scrim Directly Behind the Text Zone so Letters Pop Sharply */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 75% 42% at 50% 48%, rgba(2, 16, 27, 0.72) 0%, rgba(2, 16, 27, 0.35) 65%, transparent 100%)',
                  }}
                />
              </div>

              {/* Headline Text Directly Over the Subtle Light Beam — High Contrast & Sharp */}
              <div className="relative z-10">
                <h1 className="font-display font-extrabold tracking-normal leading-[1.32] sm:leading-[1.28] text-[2.2rem] min-[390px]:text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                  <span className="block text-white">
                    মানুষ আসলেই{' '}
                    <span className="relative inline-block text-amber-300">
                      জ্বলে উঠবে লাইট,
                      <svg
                        viewBox="0 0 240 12"
                        className="w-full h-2 sm:h-3 mt-0.5 text-amber-400"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M3 9 C 75 2, 165 2, 237 9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </span>
                  <span className="block mt-2.5 sm:mt-3.5 text-white">
                    চলে গেলেই অটোমেটিক বন্ধ!
                  </span>
                </h1>
              </div>
            </div>

            {/* Decorative Brand Hairline Divider with Glowing Sensor Icon */}
            <div className="flex items-center justify-center gap-4 my-6 sm:my-7 w-full max-w-sm px-4">
              <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-sky-200/70 to-amber-300" />
              <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_32px_rgba(251,191,36,0.95)] ring-4 ring-amber-400/30">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-sky-200/70 to-amber-300" />
            </div>

            {/* Styled Subtitle Card Below Headline */}
            <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:px-8 sm:py-6 rounded-2xl bg-[#021320]/45 backdrop-blur-[2px] border border-white/20 shadow-inner">
              <p className="text-[1.08rem] sm:text-xl lg:text-[1.35rem] text-sky-50 leading-[1.7] font-normal">
                রাতে সিঁড়িঘর, বারান্দা, বাথরুম কিংবা গ্যারাজের সুইচ অন-অফ করার ঝামেলা চিরতরে ভুলে যান।{' '}
                <strong className="text-amber-300 font-bold underline decoration-amber-400/50 underline-offset-4">
                  OneSelf BD
                </strong>
                -এর স্মার্ট পিআইআর (PIR) মোশন সেন্সর লাইট মানুষের উপস্থিতি শনাক্ত করে স্বয়ংক্রিয়ভাবে জ্বলে ওঠে এবং বিদ্যুৎ বিল কমায়{' '}
                <span className="text-amber-300 font-bold">৮৫% পর্যন্ত।</span>
              </p>
            </div>

            {/* 4 Square 3D Option Cards with Icons (Single Row on Mobile & Desktop) */}
            <div className="mt-8 w-full max-w-3xl mx-auto grid grid-cols-4 gap-1.5 min-[400px]:gap-2 sm:gap-4">
              {[
                {
                  icon: Radar,
                  title: '১৫ ফিটের ভেতর মানুষ আসলেই লাইট জ্বলবে',
                  accent: 'text-amber-300',
                },
                {
                  icon: SunMoon,
                  title: 'দিনের বেলা লাইট অটো বন্ধ থাকবে',
                  accent: 'text-sky-300',
                },
                {
                  icon: Timer,
                  title: 'মানুষ চলে গেলে ৩০ সেকেন্ড পর অটো বন্ধ',
                  accent: 'text-amber-300',
                },
                {
                  icon: Lightbulb,
                  title: 'যেকোনো হোল্ডারেই ব্যবহার করা যাবে',
                  accent: 'text-sky-300',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="group relative h-full aspect-[4/4.6] sm:aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#0C507A]/95 via-[#073654]/95 to-[#031E30] border border-sky-300/25 border-t-sky-200/45 border-b-[3px] sm:border-b-[5px] border-b-[#02111C] shadow-[0_10px_18px_-6px_rgba(2,15,26,0.85),inset_0_1px_1px_rgba(255,255,255,0.28)] sm:shadow-[0_14px_26px_-8px_rgba(2,15,26,0.85),inset_0_1px_1px_rgba(255,255,255,0.28)] p-1.5 min-[400px]:p-2 sm:p-4 flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 hover:border-sky-200/50 hover:shadow-[0_18px_30px_-8px_rgba(11,169,214,0.35),inset_0_1px_1px_rgba(255,255,255,0.38)]"
                  >
                    <div className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                    <div className="relative mb-1.5 sm:mb-3 w-7 h-7 min-[400px]:w-8 min-[400px]:h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-b from-[#0BA9D6]/30 to-[#03263D] border border-sky-300/35 border-b-[2px] sm:border-b-[3px] border-b-[#02121E] shadow-[0_4px_10px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      <Icon className={`w-3.5 h-3.5 min-[400px]:w-4 min-[400px]:h-4 sm:w-6 sm:h-6 ${item.accent}`} strokeWidth={2.1} />
                    </div>
                    <span className="relative text-[9.5px] min-[390px]:text-[10.5px] sm:text-sm font-semibold text-white leading-[1.25] sm:leading-snug drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] break-words">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 2: USAGE LOCATIONS SHOWCASE */}
        <section
          id="usage-locations"
          className="py-12 lg:py-16 text-white border-b border-[#0BA9D6]/30"
          style={{
            background:
              'linear-gradient(180deg, #031B2E 0%, #053B66 55%, #06283D 100%)',
          }}
        >
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
            {/* Section 2 Headline: Where Can This Light Be Used? */}
            <div className="text-center max-w-2xl mx-auto mb-7 sm:mb-9">
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white leading-snug text-balance">
                এই স্মার্ট সেন্সর লাইট{' '}
                <span className="text-amber-300">কোথায় কোথায়</span> ব্যবহার করতে পারবেন?
              </h2>
            </div>

            {/* Interactive Photo Carousel (First Slide: House Main Gate with Person Entering & Light Turning On) */}
            <UsageLocationShowcase />

            {/* Direct Order CTA Button Below Showcase */}
            <div className="mt-8 sm:mt-10 flex justify-center">
              <a
                href="#order-checkout"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-9 sm:py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base sm:text-lg border-b-[4px] border-b-amber-600 shadow-[0_12px_28px_rgba(251,191,36,0.32)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>এখনি অর্ডার করুন</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 3: SENSOR BULB BENEFITS SHOWCASE */}
        <section
          id="benefits"
          className="py-14 lg:py-20 text-white border-b border-[#0BA9D6]/30"
          style={{
            background:
              'linear-gradient(135deg, #042238 0%, #053559 55%, #035A8C 100%)',
          }}
        >
          <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Studio PIR Sensor Bulb Photo */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[360px] sm:max-w-[400px] aspect-square rounded-3xl overflow-hidden border border-sky-300/30 bg-[#053052] shadow-[0_24px_56px_rgba(2,15,26,0.65)]">
                  {bulbImgError ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-b from-[#06385C] to-[#031B2E]">
                      <div className="w-16 h-16 rounded-2xl bg-[#0BA9D6]/20 border border-sky-300/30 flex items-center justify-center text-amber-300">
                        <Lightbulb className="w-8 h-8" />
                      </div>
                      <span className="text-base font-semibold text-white">
                        OneSelf 15W Smart PIR Sensor Bulb
                      </span>
                    </div>
                  ) : (
                    <Image
                      src="/images/landing-page/pir-sensor-bulb/demo/pir_sensor_bulb_studio_1794880305495.jpg"
                      width={1024}
                      height={1024}
                      unoptimized
                      alt="OneSelf 15W Smart PIR Motion Sensor LED Bulb"
                      referrerPolicy="no-referrer"
                      onError={() => setBulbImgError(true)}
                      className="w-full h-full object-cover object-center select-none"
                    />
                  )}
                </div>
              </div>

              {/* Right Column: Headline, Dotted Divider & 6 Benefits List */}
              <div className="lg:col-span-7 space-y-5">
                <div className="space-y-3.5">
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-[2.25rem] text-[#38BDF8] leading-snug text-balance">
                    সেন্সর বাল্ব ব্যবহারের সুবিধা সমূহ
                  </h2>
                  <div className="border-b-2 border-dotted border-sky-200/75 w-full max-w-lg" />
                </div>

                <ul className="space-y-4 pt-1">
                  {[
                    'বিদ্যুৎ সাশ্রয়ী ও দীর্ঘস্থায়ী।',
                    'সাধারণ বাল্বের মতো যেকোনো হোল্ডারে ব্যবহার করতে পারবেন।',
                    'সুইচ অন-অফ করার কোনো ঝামেলা নেই।',
                    'আলো থাকলে বাল্ব জ্বলবে না।',
                    'অন্ধকারে বাল্বের ১৫ ফিটের মধ্যে মানুষ আসলে বাল্ব জ্বলে উঠবে। মানুষ চলে যাওয়ার ৩০ সেকেন্ড পরে বাল্ব অফ হয়ে যাবে।',
                    'আপনার ঘর ও আপনাকে করবে স্মার্ট।',
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-5 h-5 sm:w-6 sm:h-6 text-[#38BDF8] shrink-0 mt-0.5"
                        strokeWidth={2.2}
                      />
                      <span className="text-[15px] sm:text-lg font-medium text-white leading-relaxed">
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 flex justify-center lg:justify-start">
                  <a
                    href="#order-checkout"
                    className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 sm:px-9 sm:py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-base sm:text-lg border-b-[4px] border-b-amber-600 shadow-[0_12px_28px_rgba(251,191,36,0.32)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>এখনি অর্ডার করুন</span>
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: DIRECT PHONE CONTACT (BELOW SECTION 3, ABOVE WHY US) */}
        <section id="contact" className="py-8 sm:py-10 bg-white border-b border-slate-200/80">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 text-center flex flex-col items-center gap-4 sm:gap-5">
            <h2 className="font-display font-extrabold text-[17px] min-[390px]:text-[19px] sm:text-2xl md:text-3xl text-[#06283D] leading-tight whitespace-nowrap">
              যেকোনো তথ্যের জন্য{' '}
              <span className="text-[#0369A1]">যোগাযোগ করুন</span>
            </h2>

            <a
              href="tel:01967214215"
              className="group inline-flex items-center justify-center gap-3 px-6 py-3 sm:px-8 sm:py-3.5 rounded-2xl text-white border border-[#0BA9D6]/40 border-b-[4px] border-b-[#02111C] shadow-[0_12px_26px_rgba(3,105,161,0.25)] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[#0369A1]"
              style={{
                background:
                  'linear-gradient(135deg, #06283D 0%, #0369A1 65%, #0BA9D6 100%)',
              }}
            >
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_4px_12px_rgba(251,191,36,0.45)] shrink-0 transition-transform duration-150 group-hover:scale-105">
                <Phone className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={2.3} />
              </span>
              <span className="font-mono tabular-nums font-bold text-lg sm:text-2xl tracking-wide text-white whitespace-nowrap">
                01967-214215
              </span>
            </a>
          </div>
        </section>

        {/* SECTION 5: WHY BUY FROM US */}
        <section
          id="why-us"
          className="py-14 lg:py-20 text-white border-b border-[#0BA9D6]/30"
          style={{
            background:
              'linear-gradient(180deg, #031B2E 0%, #053B66 55%, #06283D 100%)',
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            {/* Top Header Bar with Centered Brand-Colored Title Block */}
            <div className="bg-[#021423]/90 rounded-xl border border-sky-300/30 shadow-[0_12px_28px_rgba(2,15,26,0.55)] flex justify-center overflow-hidden mb-6 sm:mb-8">
              <div
                className="w-full sm:w-auto px-6 sm:px-14 py-3.5 sm:py-4 text-center"
                style={{
                  background:
                    'linear-gradient(135deg, #0369A1 0%, #0BA9D6 55%, #0369A1 100%)',
                }}
              >
                <h2 className="font-display font-bold text-xl sm:text-3xl text-white tracking-normal drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]">
                  আমাদের কাছ থেকে কেন কিনবেন?
                </h2>
              </div>
            </div>

            {/* Single Unified 4-Row Table: Icon First, Then Text */}
            <div className="bg-[#042338]/95 rounded-2xl border border-[#0BA9D6]/40 shadow-[0_18px_42px_rgba(2,15,26,0.65)] overflow-hidden">
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-sky-800/65">
                  {[
                    {
                      icon: BadgeCheck,
                      text: 'অরিজিনাল প্রোডাক্ট পাবেন।',
                      accent: 'text-amber-300',
                    },
                    {
                      icon: Truck,
                      text: 'সমগ্র বাংলাদেশে হোম ডেলিভারির সু-ব্যবস্থা।',
                      accent: 'text-[#38BDF8]',
                    },
                    {
                      icon: HandCoins,
                      text: 'আপনি প্রোডাক্ট হাতে পেয়ে, দেখে টাকা পরিশোধ করবেন।',
                      accent: 'text-amber-300',
                    },
                    {
                      icon: PhoneCall,
                      text: '২৪ ঘণ্টা কাস্টমার সাপোর্ট।',
                      accent: 'text-[#38BDF8]',
                    },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <tr
                        key={idx}
                        className="transition-colors hover:bg-[#073352]/75"
                      >
                        <td className="w-16 sm:w-20 py-4 pl-4 pr-2 sm:py-5 sm:pl-7 sm:pr-3 align-middle">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-[#0BA9D6]/30 to-[#03263D] border border-sky-300/35 border-b-[3px] border-b-[#02121E] shadow-[0_6px_14px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.28)] flex items-center justify-center">
                            <Icon
                              className={`w-6 h-6 ${item.accent}`}
                              strokeWidth={2}
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4 pl-2 sm:py-5 sm:pr-7 sm:pl-3 align-middle">
                          <span className="text-[15px] sm:text-lg font-semibold text-white leading-snug block">
                            {item.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION 6: 1-YEAR GUARANTEE STICKER & WARRANTY CLAIM TABLE */}
        <section
          id="warranty"
          className="relative overflow-hidden py-14 lg:py-20 text-white border-b border-[#0BA9D6]/30"
          style={{
            background:
              'linear-gradient(135deg, #042238 0%, #053559 55%, #0369A1 100%)',
          }}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              background:
                'radial-gradient(ellipse 65% 45% at 50% 0%, rgba(11, 169, 214, 0.28) 0%, transparent 75%)',
            }}
          />

          <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
            {/* Large 3D Official Guarantee Sticker */}
            <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
              <div className="relative inline-block -rotate-1 hover:rotate-0 transition-transform duration-200">
                {/* Outer Golden Glow */}
                <div className="absolute -inset-2 rounded-3xl bg-amber-400/25 blur-xl pointer-events-none" />

                {/* Main Sticker Body */}
                <div
                  className="relative rounded-2xl p-1.5 sm:p-2 shadow-[0_18px_40px_rgba(2,15,26,0.65),0_4px_0_#B45309] border-2 border-amber-200"
                  style={{
                    background:
                      'linear-gradient(135deg, #FDE68A 0%, #FBBF24 45%, #F59E0B 100%)',
                  }}
                >
                  {/* Glossy Top Sheen */}
                  <div className="pointer-events-none absolute inset-x-3 top-1 h-4 rounded-full bg-white/35 blur-[1px]" />

                  {/* Inner Dashed Stamp Border */}
                  <div className="relative rounded-xl border-2 border-dashed border-slate-950/35 px-5 py-4 sm:px-8 sm:py-5 flex items-center gap-3.5 sm:gap-5 bg-gradient-to-b from-amber-300/40 to-amber-500/20">
                    {/* Circular Seal Emblem */}
                    <div className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full bg-[#031B2E] border-[3px] border-amber-200 shadow-[0_6px_14px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center shrink-0">
                      <ShieldCheck
                        className="w-6 h-6 sm:w-8 sm:h-8 text-amber-300"
                        strokeWidth={2.2}
                      />
                      <span className="text-[9px] sm:text-[10px] font-extrabold text-white tracking-wider leading-none mt-0.5">
                        ১০০%
                      </span>
                    </div>

                    {/* Large Sticker Headline */}
                    <div className="text-left">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#031B2E] text-amber-300 text-[10px] sm:text-xs font-bold tracking-wider mb-1">
                        WARRANTY SEAL · ONESELF BD
                      </span>
                      <p className="font-display font-black text-xl min-[390px]:text-2xl sm:text-3xl text-slate-950 leading-tight drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                        ১ বছরের অফিসিয়াল গ্যারান্টি
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Single Unified Warranty Box: 1 Header Bar + 1 Interior Box Below */}
            <div className="bg-[#042338]/95 rounded-2xl border border-[#0BA9D6]/45 shadow-[0_20px_46px_rgba(2,15,26,0.65)] overflow-hidden">
              {/* Single Unified Headline Bar (Marked Area) */}
              <div
                className="py-4 px-4 sm:px-6 text-center border-b border-sky-400/30"
                style={{
                  background:
                    'linear-gradient(135deg, #0369A1 0%, #0BA9D6 55%, #0369A1 100%)',
                }}
              >
                <h3 className="font-display font-bold text-lg sm:text-2xl text-white tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
                  লাইট নষ্ট হয়ে গেলে পরিবর্তন করার পদ্ধতি
                </h3>
              </div>

              {/* Single Unified Interior Box Below */}
              <div className="p-5 sm:p-8 divide-y divide-sky-800/55">
                {/* Step 1 */}
                <div className="pb-5 sm:pb-6 flex items-start gap-3.5 sm:gap-5">
                  <div className="w-11 h-11 sm:w-[3.25rem] sm:h-[3.25rem] rounded-xl bg-gradient-to-b from-[#0BA9D6]/35 to-[#03263D] border border-sky-300/35 border-b-[3px] border-b-[#02121E] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] shrink-0 mt-0.5">
                    <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#021423] text-[#38BDF8] border border-sky-400/30">
                        ধাপ ০১
                      </span>
                      <h4 className="font-display font-bold text-base sm:text-lg text-amber-300">
                        লাইটের কোড নম্বর নিন
                      </h4>
                    </div>
                    <p className="text-[14px] sm:text-[15.5px] text-sky-50 leading-relaxed">
                      আমাদের প্রতিটি লাইটের গায়ে একটি কোড নম্বর দেওয়া আছে। লাইট নষ্ট হলে সেই কোড নম্বরটি সংরক্ষণ করুন।
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="py-5 sm:py-6 flex items-start gap-3.5 sm:gap-5">
                  <div className="w-11 h-11 sm:w-[3.25rem] sm:h-[3.25rem] rounded-xl bg-gradient-to-b from-[#0BA9D6]/35 to-[#03263D] border border-sky-300/35 border-b-[3px] border-b-[#02121E] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] shrink-0 mt-0.5">
                    <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-[#38BDF8]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#021423] text-[#38BDF8] border border-sky-400/30">
                        ধাপ ০২
                      </span>
                      <h4 className="font-display font-bold text-base sm:text-lg text-[#38BDF8]">
                        ওয়েবসাইটে ওয়ারেন্টি ক্লেইম করুন
                      </h4>
                    </div>
                    <p className="text-[14px] sm:text-[15.5px] text-sky-50 leading-relaxed">
                      সেই কোড নম্বর দিয়ে আমাদের ওয়েবসাইট{' '}
                      <span className="font-mono font-semibold text-amber-300">
                        oneselfbd.com
                      </span>{' '}
                      -এ গিয়ে <strong className="text-white font-semibold">‘ওয়ারেন্টি ক্লেইম’</strong> অপশনে গিয়ে ওয়ারেন্টি ক্লেইম করুন।
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="pt-5 sm:pt-6 flex items-start gap-3.5 sm:gap-5">
                  <div className="w-11 h-11 sm:w-[3.25rem] sm:h-[3.25rem] rounded-xl bg-gradient-to-b from-[#0BA9D6]/35 to-[#03263D] border border-sky-300/35 border-b-[3px] border-b-[#02121E] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] shrink-0 mt-0.5">
                    <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#021423] text-[#38BDF8] border border-sky-400/30">
                        ধাপ ০৩
                      </span>
                      <h4 className="font-display font-bold text-base sm:text-lg text-amber-300">
                        নতুন লাইট পাঠিয়ে পরিবর্তন
                      </h4>
                    </div>
                    <p className="text-[14px] sm:text-[15.5px] text-sky-50 leading-relaxed">
                      আমাদের এখান থেকে একটি <strong className="text-amber-300 font-semibold">নতুন লাইট</strong> পাঠিয়ে দেওয়া হবে, এবং নষ্ট লাইটটি <strong className="text-white font-semibold">একই ডেলিভারি ম্যানের</strong> কাছে দিয়ে দেবেন।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

    </div>
  );
}
