"use client";

import ContainerMax from "@/components/shared/containerMax/ContainerMax";
import { Button } from "@/components/ui/button";
import { SITE } from "@/const/site.const";
import { TSingleProduct } from "@/types/products/singleProduct";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Globe,
  HandCoins,
  Lightbulb,
  Phone,
  PhoneCall,
  QrCode,
  Radar,
  RefreshCw,
  ShieldCheck,
  SunMoon,
  Timer,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const imageRoot = "/images/landing-page/pir-sensor-bulb";
const locations = [
  {
    title: "বাড়ির মেইন গেট ও প্রবেশপথ",
    description:
      "বাড়ির মেইন গেটের ভেতর দিয়ে প্রবেশ করলেই সেন্সর লাইট জ্বলে ওঠে।",
    image: `${imageRoot}/main-gate.webp`,
  },
  {
    title: "সিঁড়িঘর ও ফ্ল্যাটের করিডোর",
    description: "রাতের বেলা সিঁড়িতে চলাচলের সময় প্রয়োজনমতো আলো পান।",
    image: `${imageRoot}/staircase.webp`,
  },
  {
    title: "বারান্দা ও ব্যালকনি",
    description: "সন্ধ্যায় বারান্দায় বের হলে আলো জ্বলে ওঠে।",
    image: `${imageRoot}/balcony.webp`,
  },
  {
    title: "গ্যারাজ ও পার্কিং এরিয়া",
    description: "গ্যারাজে প্রবেশ করলেই স্বয়ংক্রিয় আলোর সুবিধা।",
    image: `${imageRoot}/garage.webp`,
  },
  {
    title: "আপনার সুবিধামতো যেকোনো জায়গায় ব্যবহার করতে পারবেন",
    description: "বাথরুম · ছাদের দরজা · স্টোর রুম · দোকান ও অফিস",
    image: `${imageRoot}/anywhere.webp`,
  },
];

const benefits = [
  "বিদ্যুৎ সাশ্রয়ী ও দীর্ঘস্থায়ী।",
  "সাধারণ বাল্বের মতো যেকোনো উপযুক্ত হোল্ডারে ব্যবহার করতে পারবেন।",
  "সুইচ অন-অফ করার ঝামেলা কমে যায়।",
  "দিনের আলোতে বাল্ব অটো বন্ধ থাকে।",
  "অন্ধকারে সেন্সরের আওতায় মানুষ এলে বাল্ব জ্বলে ওঠে; চলে গেলে নিজে থেকে বন্ধ হয়।",
  "সিঁড়ি, গেট, বারান্দা, গ্যারাজ ও ঘরের প্রয়োজনীয় জায়গায় ব্যবহার করা যায়।",
];

function warrantyDuration(product: TSingleProduct | undefined) {
  if (!product?.warranty || !product.warrantyInfo?.duration?.quantity)
    return null;
  const { quantity, unit } = product.warrantyInfo.duration;
  const number = Number(quantity);
  const count = Number.isFinite(number)
    ? number.toLocaleString("bn-BD")
    : quantity;
  const unitLabel = unit.toLowerCase().startsWith("year")
    ? "বছর"
    : unit.toLowerCase().startsWith("month")
      ? "মাস"
      : unit.toLowerCase().startsWith("day")
        ? "দিন"
        : unit;
  return `${count} ${unitLabel}`;
}

export default function SensorBulbStorySections({
  primary,
  onOrderClick,
}: {
  primary?: TSingleProduct;
  onOrderClick: () => void;
}) {
  const [locationIndex, setLocationIndex] = useState(0);
  const duration = warrantyDuration(primary);
  const showPrevious = () =>
    setLocationIndex(
      (index) => (index - 1 + locations.length) % locations.length
    );
  const showNext = () =>
    setLocationIndex((index) => (index + 1) % locations.length);

  return (
    <>
      <section className="border-y border-sky-400/20 bg-gradient-to-b from-[#031b2e] via-[#053b66] to-[#06283d] py-10 sm:py-14">
        <ContainerMax>
          <div className="mx-auto mb-7 max-w-2xl text-center">
            <p className="text-sm font-bold text-sky-300">কীভাবে কাজ করে</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              আপনি এলে আলো, চলে গেলে অটো বন্ধ
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Radar, text: "চলাচল শনাক্ত করে আলো জ্বালায়" },
              { icon: SunMoon, text: "দিনের আলোতে অটো অফ থাকে" },
              { icon: Timer, text: "নড়াচড়া না থাকলে নিজে বন্ধ হয়" },
              { icon: Lightbulb, text: "সাধারণ হোল্ডারে লাগানো যায়" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="rounded-2xl border border-sky-300/25 bg-gradient-to-b from-[#0c507a] to-[#031e30] p-4 text-center shadow-lg sm:p-5"
              >
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-sky-400/15 text-amber-300">
                  <Icon className="size-6" aria-hidden />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-white">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </ContainerMax>
      </section>

      <section className="bg-gradient-to-b from-[#031b2e] via-[#053b66] to-[#06283d] py-12 sm:py-16">
        <ContainerMax>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-bold text-sky-300">ব্যবহারের জায়গা</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              এই স্মার্ট সেন্সর লাইট কোথায় ব্যবহার করতে পারবেন?
            </h2>
            <p className="mt-3 text-sm leading-6 text-sky-100/80">
              বাড়ির দৈনন্দিন চলাচলের জায়গা থেকে অফিস পর্যন্ত ব্যবহার করুন।
            </p>
          </div>
          <div
            className="mx-auto max-w-4xl"
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="সেন্সর লাইট ব্যবহারের জায়গা"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                if (event.key === "ArrowLeft") showPrevious();
                else showNext();
              }
            }}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-sky-300/40 bg-[#021322] shadow-2xl sm:aspect-video">
              {locations.map((item, index) => (
                <div
                  key={item.image}
                  aria-hidden={index !== locationIndex}
                  className={`absolute inset-0 transition-opacity duration-500 ease-in-out motion-reduce:transition-none ${index === locationIndex ? "z-10 opacity-100" : "z-0 opacity-0"}`}
                >
                  <Image
                    src={item.image}
                    alt={index === locationIndex ? item.title : ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 896px"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#02101b]/95 via-[#02101b]/60 to-transparent px-14 pb-5 pt-20 text-center text-white sm:px-20">
                    <h3 className="text-lg font-bold sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/90 sm:text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="আগের ব্যবহারের জায়গা"
                onClick={showPrevious}
                className="absolute left-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-sky-300/40 bg-[#021322]/85 text-white hover:bg-[#0ba9d6]"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="পরের ব্যবহারের জায়গা"
                onClick={showNext}
                className="absolute right-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-sky-300/40 bg-[#021322]/85 text-white hover:bg-[#0ba9d6]"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
            <p className="sr-only" aria-live="polite">
              {`${locationIndex + 1} / ${locations.length}: ${locations[locationIndex].title}`}
            </p>
            <div
              className="mt-4 flex flex-wrap items-center justify-center gap-2"
              aria-label="ব্যবহারের জায়গা নির্বাচন করুন"
            >
              {locations.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  aria-label={item.title}
                  aria-current={index === locationIndex ? "true" : undefined}
                  onClick={() => setLocationIndex(index)}
                  className={`size-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${index === locationIndex ? "bg-amber-300" : "bg-sky-200/40 hover:bg-sky-200"}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button
              type="button"
              size="lg"
              onClick={onOrderClick}
              className="min-h-12 rounded-xl bg-amber-400 px-8 font-bold text-slate-950 hover:bg-amber-300"
            >
              পণ্য বেছে অর্ডার করুন
            </Button>
          </div>
        </ContainerMax>
      </section>

      <section className="border-y border-sky-400/20 bg-gradient-to-br from-[#042238] via-[#053559] to-[#035a8c] py-12 sm:py-16">
        <ContainerMax className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-sky-300/30 bg-[#053052] shadow-2xl">
            <Image
              src={`${imageRoot}/product.webp`}
              alt="Smart PIR Motion Sensor LED Bulb"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 448px"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-300">পণ্যের সুবিধা</p>
            <h2 className="mt-2 text-2xl font-bold text-sky-300 sm:text-3xl">
              সেন্সর বাল্ব ব্যবহারের সুবিধাসমূহ
            </h2>
            <div className="mt-4 border-b-2 border-dotted border-sky-200/70" />
            <ul className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-sm leading-7 text-foreground sm:text-base"
                >
                  <CheckCircle2
                    className="mt-1 size-5 shrink-0 text-sky-300"
                    aria-hidden
                  />
                  {benefit}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              size="lg"
              onClick={onOrderClick}
              className="mt-8 min-h-12 rounded-xl bg-amber-400 px-8 font-bold text-slate-950 hover:bg-amber-300"
            >
              এখনই অর্ডার করুন
            </Button>
          </div>
        </ContainerMax>
      </section>

      <section className="border-t border-sky-300/20 bg-[#031b2e] py-10 sm:py-14">
        <ContainerMax>
          <div className="mx-auto mb-7 max-w-2xl text-center">
            <p className="text-sm font-bold text-amber-300">পণ্যের বিবরণ</p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              ১৫W PIR সেন্সর বাল্বের তথ্য
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "আলো", text: "১৫ ওয়াটের উজ্জ্বল সাদা LED আলো" },
              { title: "সেন্সর", text: "প্রায় ৫–৬ মিটার, ১২০° ডিটেকশন রেঞ্জ" },
              {
                title: "অটো নিয়ন্ত্রণ",
                text: "ডে-নাইট সেন্সর; চলাচল থামলে প্রায় ৩০ সেকেন্ড পর বন্ধ",
              },
              { title: "সকেট", text: "B22 (পিন) এবং E27 (প্যাঁচ) ভ্যারিয়েন্ট" },
            ].map((spec) => (
              <div
                key={spec.title}
                className="rounded-2xl border border-sky-300/25 bg-[#042338] p-5 shadow-lg"
              >
                <p className="text-sm font-bold text-amber-300">{spec.title}</p>
                <p className="mt-2 text-sm leading-6 text-sky-50">
                  {spec.text}
                </p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-sky-100/70">
            নির্দিষ্ট ভ্যারিয়েন্ট ও কম্বো প্যাকের তথ্য পণ্য নির্বাচন অংশে দেখুন।
          </p>
        </ContainerMax>
      </section>

      <section className="bg-white py-10 text-slate-900">
        <ContainerMax className="text-center">
          <Phone className="mx-auto size-7 text-primary" aria-hidden />
          <h2 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
            যেকোনো তথ্যের জন্য যোগাযোগ করুন
          </h2>
          <a
            href={`tel:${SITE.phone}`}
            className="mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-lg font-bold text-primary-foreground hover:bg-primary/90"
          >
            {SITE.phoneDisplay}
          </a>
        </ContainerMax>
      </section>

      <section className="border-y border-sky-400/20 bg-gradient-to-b from-[#031b2e] via-[#053b66] to-[#06283d] py-12 sm:py-16">
        <ContainerMax>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-bold text-amber-300">
              Oneself থেকে কেন কিনবেন
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              আমাদের কাছ থেকে কেন কিনবেন?
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {[
              {
                icon: BadgeCheck,
                title: "অরিজিনাল প্রোডাক্ট",
                text: "প্রোডাক্টের তথ্য, ভ্যারিয়েন্ট এবং মূল্য দেখে আপনার জন্য সঠিকটি বেছে নিন।",
              },
              {
                icon: Truck,
                title: "সারাদেশে ডেলিভারি",
                text: "সমগ্র বাংলাদেশে হোম ডেলিভারির ব্যবস্থা রয়েছে। প্রযোজ্য চার্জ ফর্মে দেখুন।",
              },
              {
                icon: HandCoins,
                title: "পণ্য হাতে পেয়ে পরিশোধ",
                text: "ক্যাশ অন ডেলিভারি পদ্ধতি থাকলে পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।",
              },
              {
                icon: PhoneCall,
                title: "কাস্টমার সাপোর্ট",
                text: "২৪ ঘণ্টা কাস্টমার সাপোর্ট। কোনো প্রশ্ন বা অর্ডারে সহায়তা লাগলে আমাদের নম্বরে যোগাযোগ করুন।",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-sky-300/25 bg-[#042338] p-5 shadow-lg"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-400/15 text-amber-300">
                  <Icon className="size-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-sky-100/80">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ContainerMax>
      </section>

      <section className="bg-gradient-to-br from-[#042238] via-[#053559] to-[#0369a1] py-12 sm:py-16">
        <ContainerMax>
          {duration && (
            <div className="mx-auto mb-8 w-fit -rotate-1 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 p-2 shadow-2xl">
              <div className="flex items-center gap-4 rounded-xl border-2 border-dashed border-slate-950/40 px-5 py-4 text-slate-950">
                <ShieldCheck className="size-10 shrink-0" aria-hidden />
                <div>
                  <p className="text-xs font-bold uppercase">
                    OneSelf BD Warranty
                  </p>
                  <p className="text-xl font-black sm:text-2xl">
                    {duration} অফিসিয়াল ওয়ারেন্টি
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-sky-300/30 bg-[#042338] shadow-2xl">
            <div className="bg-gradient-to-r from-[#0369a1] via-[#0ba9d6] to-[#0369a1] px-6 py-4 text-center">
              <p className="text-lg font-bold text-white sm:text-xl">
                লাইট নষ্ট হয়ে গেলে পরিবর্তন করার পদ্ধতি
              </p>
            </div>
            <div className="p-6 sm:p-9">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-400/15 text-amber-300">
                  <FileCheck2 className="size-7" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-bold text-sky-300">
                    ওয়ারেন্টি ও সেবা
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                    {duration
                      ? `${duration} ওয়ারেন্টি`
                      : "ওয়ারেন্টি ক্লেইম করার সহজ উপায়"}
                  </h2>
                  {primary && (
                    <p className="mt-2 text-sm text-sky-100/75">
                      {primary.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: QrCode,
                    title: "লাইটের কোড নম্বর নিন",
                    text: "লাইটে দেওয়া কোড নম্বর এবং অর্ডারের তথ্য সংরক্ষণ করুন।",
                  },
                  {
                    icon: Globe,
                    title: "ওয়েবসাইটে ক্লেইম করুন",
                    text: "কোড নম্বর দিয়ে oneselfbd.com-এর ওয়ারেন্টি ক্লেইম ফর্মে তথ্য জমা দিন।",
                  },
                  {
                    icon: RefreshCw,
                    title: "পরিবর্তনের সহায়তা পান",
                    text: "ক্লেইম যাচাই হলে সাপোর্ট টিম নতুন লাইট পাঠানো ও পুরোনোটি ফেরতের নিয়ম জানাবে।",
                  },
                ].map(({ icon: Icon, title, text }, index) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-sky-300/20 bg-[#031b2e] p-5"
                  >
                    <div className="flex items-center gap-3 text-amber-300">
                      <Icon className="size-5" aria-hidden />
                      <span className="text-xs font-bold">
                        ধাপ {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-3 font-bold text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sky-100/75">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="min-h-11 rounded-xl bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"
                >
                  <Link href="/warranty/claim-your-warranty">
                    ওয়ারেন্টি ক্লেইম করুন
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={onOrderClick}
                  className="min-h-11 rounded-xl border-sky-300/50 font-bold text-white hover:bg-sky-400/10"
                >
                  পণ্য নির্বাচন করুন
                </Button>
              </div>
            </div>
          </div>
        </ContainerMax>
      </section>
    </>
  );
}
