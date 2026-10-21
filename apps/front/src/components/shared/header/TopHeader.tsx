import { Phone, Truck } from "lucide-react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";

const TopHeader = () => (
  <div className="bg-[#092143] text-white">
    <div className="mx-auto flex min-h-7 md:min-h-9 max-w-7xl items-center justify-center gap-6 px-3 py-1 text-[11px] leading-5 md:px-4 md:py-2 md:text-xs sm:px-6 lg:justify-between lg:px-8">
      <p className="flex items-center gap-2 text-center">
        <Truck
          className="size-3.5 md:size-4 shrink-0 text-cyan-300"
          aria-hidden="true"
        />
        ইনশাআল্লাহ ৩ দিনের মধ্যে সারা দেশে দ্রুত ডেলিভারি
      </p>
      <div className="hidden items-center gap-5 lg:flex">
        <a
          href="tel:+8801744675030"
          className="flex items-center gap-1.5 hover:underline underline-offset-4"
        >
          <Phone className="size-3.5" aria-hidden="true" /> +8801744675030
        </a>
        <a
          href="https://wa.me/8801772065894"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:underline underline-offset-4"
        >
          <FaWhatsapp className="size-4" aria-hidden="true" /> WhatsApp
        </a>
        <Link
          href="/track-your-order"
          className="border-l border-white/25 pl-5 hover:underline underline-offset-4"
        >
          অর্ডার ট্র্যাক করুন
        </Link>
      </div>
    </div>
  </div>
);

export default TopHeader;
