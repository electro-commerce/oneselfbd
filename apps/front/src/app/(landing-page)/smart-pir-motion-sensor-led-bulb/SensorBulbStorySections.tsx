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
  HelpCircle,
  Clock3,
  FileCheck2,
  Lightbulb,
  MapPin,
  Phone,
  Radar,
  ShieldCheck,
  SunMoon,
  Timer,
  Truck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const imageRoot = "/images/landing-page/pir-sensor-bulb";
const locations = [
  {
    title: "বাড়ির মেইন গেট ও প্রবেশপথ",
    description: "রাতে প্রবেশের সময় সুইচ খুঁজতে হয় না।",
    image: `${imageRoot}/main-gate.webp`,
  },
  {
    title: "সিঁড়িঘর ও করিডোর",
    description: "চলাচলের সময় দরকারি আলো পাওয়া সহজ হয়।",
    image: `${imageRoot}/staircase.webp`,
  },
  {
    title: "বারান্দা ও ব্যালকনি",
    description: "সন্ধ্যা ও রাতের চলাচলে বাড়তি সুবিধা।",
    image: `${imageRoot}/balcony.webp`,
  },
  {
    title: "গ্যারাজ ও পার্কিং এরিয়া",
    description: "যাতায়াতের জায়গায় স্বয়ংক্রিয় আলোর সুবিধা।",
    image: `${imageRoot}/garage.webp`,
  },
  {
    title: "আপনার প্রয়োজনমতো আরও জায়গায়",
    description: "বাথরুম, স্টোর রুম, ছাদের দরজা, অফিস বা দোকান।",
    image: `${imageRoot}/anywhere.webp`,
  },
];

const benefits = [
  "মানুষের নড়াচড়া শনাক্ত করলে আলো জ্বলে ওঠে।",
  "নির্দিষ্ট সময় নড়াচড়া না থাকলে নিজে থেকেই বন্ধ হয়।",
  "দিনের আলোতে অটো অফ থাকার সুবিধা রয়েছে।",
  "বিদ্যুৎ সাশ্রয়ী LED প্রযুক্তি ব্যবহার করা হয়েছে।",
  "সাধারণ বাল্বের মতো হোল্ডারে লাগানো যায়; অতিরিক্ত ওয়্যারিং প্রয়োজন নেই।",
  "রাতে শিশু ও বয়স্কদের চলাচলের জায়গায় ব্যবহার করা যায়।",
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
  const location = locations[locationIndex];
  const duration = warrantyDuration(primary);
  const showPrevious = () =>
    setLocationIndex(
      (index) => (index - 1 + locations.length) % locations.length
    );
  const showNext = () =>
    setLocationIndex((index) => (index + 1) % locations.length);

  return (
    <>
      <section className="border-y border-border bg-background py-10 sm:py-14">
        <ContainerMax>
          <div className="mx-auto mb-7 max-w-2xl text-center">
            <p className="text-sm font-bold text-primary">কীভাবে কাজ করে</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
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
                className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm sm:p-5"
              >
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </ContainerMax>
      </section>

      <section className="bg-primary/5 py-12 sm:py-16">
        <ContainerMax>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-bold text-primary">ব্যবহারের জায়গা</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              এই স্মার্ট সেন্সর লাইট কোথায় ব্যবহার করতে পারবেন?
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              বাড়ির দৈনন্দিন চলাচলের জায়গা থেকে অফিস পর্যন্ত ব্যবহার করুন।
            </p>
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-muted shadow-lg sm:aspect-video">
              <Image
                key={location.image}
                src={location.image}
                alt={location.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 896px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-14 pb-5 pt-16 text-center text-white sm:px-20">
                <h3 className="text-lg font-bold sm:text-2xl">
                  {location.title}
                </h3>
                <p className="mt-1 text-xs text-white/90 sm:text-sm">
                  {location.description}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="আগের ব্যবহারের জায়গা"
                onClick={showPrevious}
                className="absolute left-3 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/90"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label="পরের ব্যবহারের জায়গা"
                onClick={showNext}
                className="absolute right-3 top-1/2 size-11 -translate-y-1/2 rounded-full bg-background/90"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
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
                  className={`size-3 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${index === locationIndex ? "bg-primary" : "bg-primary/30 hover:bg-primary/60"}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-8 text-center">
            <Button
              type="button"
              size="lg"
              onClick={onOrderClick}
              className="min-h-12 rounded-xl px-8 font-bold"
            >
              পণ্য বেছে অর্ডার করুন
            </Button>
          </div>
        </ContainerMax>
      </section>

      <section className="py-12 sm:py-16">
        <ContainerMax className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-border bg-muted shadow-lg">
            <Image
              src={`${imageRoot}/product.webp`}
              alt="Smart PIR Motion Sensor LED Bulb"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 448px"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">পণ্যের সুবিধা</p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              সেন্সর বাল্ব ব্যবহারের সুবিধাসমূহ
            </h2>
            <ul className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 text-sm leading-7 text-foreground sm:text-base"
                >
                  <CheckCircle2
                    className="mt-1 size-5 shrink-0 text-primary"
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
              className="mt-8 min-h-12 rounded-xl px-8 font-bold"
            >
              এখনই অর্ডার করুন
            </Button>
          </div>
        </ContainerMax>
      </section>

      <section className="bg-primary/5 py-10">
        <ContainerMax className="text-center">
          <Phone className="mx-auto size-7 text-primary" aria-hidden />
          <h2 className="mt-3 text-xl font-bold text-foreground sm:text-2xl">
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

      <section className="py-12 sm:py-16">
        <ContainerMax>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <p className="text-sm font-bold text-primary">
              Oneself থেকে কেন কিনবেন
            </p>
            <h2 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              নির্ভরযোগ্য কেনাকাটার সুবিধা
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {[
              {
                icon: BadgeCheck,
                title: "পণ্যের তথ্য দেখেই নির্বাচন",
                text: "ওয়াট, ভ্যারিয়েন্ট ও মূল্য দেখে পছন্দের পণ্য বেছে নিন।",
              },
              {
                icon: Truck,
                title: "সারাদেশে ডেলিভারি",
                text: "আপনার এলাকায় প্রযোজ্য ডেলিভারি চার্জ অর্ডার ফর্মে দেখুন।",
              },
              {
                icon: ShieldCheck,
                title: "ক্যাশ অন ডেলিভারি",
                text: "ক্যাশ অন ডেলিভারি পেমেন্ট পদ্ধতি থাকলে পণ্য হাতে পেয়ে মূল্য দিন।",
              },
              {
                icon: HelpCircle,
                title: "অর্ডারে সহায়তা",
                text: "কোনো প্রশ্ন থাকলে আমাদের নম্বরে সরাসরি যোগাযোগ করুন।",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-6" aria-hidden />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ContainerMax>
      </section>

      <section className="bg-primary/5 py-12 sm:py-16">
        <ContainerMax>
          <div className="mx-auto max-w-4xl rounded-3xl border border-primary/20 bg-background p-6 shadow-sm sm:p-9">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileCheck2 className="size-7" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">
                  ওয়ারেন্টি ও সেবা
                </p>
                <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
                  {duration
                    ? `${duration} ওয়ারেন্টি`
                    : "ওয়ারেন্টি ক্লেইম করার সহজ উপায়"}
                </h2>
                {primary && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {primary.title}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: MapPin,
                  title: "পণ্যের তথ্য রাখুন",
                  text: "অর্ডার নম্বর ও পণ্যের সাথে পাওয়া তথ্য সংরক্ষণ করুন।",
                },
                {
                  icon: Zap,
                  title: "ওয়েবসাইটে ক্লেইম করুন",
                  text: "ওয়ারেন্টি ক্লেইম ফর্মে প্রয়োজনীয় তথ্য জমা দিন।",
                },
                {
                  icon: Clock3,
                  title: "পরবর্তী সহায়তা পান",
                  text: "আপনার ক্লেইম যাচাই করে সাপোর্ট টিম পরবর্তী পদক্ষেপ জানাবে।",
                },
              ].map(({ icon: Icon, title, text }, index) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-muted/40 p-5"
                >
                  <div className="flex items-center gap-3 text-primary">
                    <Icon className="size-5" aria-hidden />
                    <span className="text-xs font-bold">
                      ধাপ {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-3 font-bold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {text}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="min-h-11 rounded-xl font-bold"
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
                className="min-h-11 rounded-xl font-bold"
              >
                পণ্য নির্বাচন করুন
              </Button>
            </div>
          </div>
        </ContainerMax>
      </section>
    </>
  );
}
