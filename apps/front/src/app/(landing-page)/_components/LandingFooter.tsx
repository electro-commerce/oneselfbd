import ContainerMax from "@/components/shared/containerMax/ContainerMax";
import { SITE } from "@/const/site.const";
import Link from "next/link";

type LandingFooterProps = {
  className?: string;
};

export default function LandingFooter({ className = "" }: LandingFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-slate-800 bg-[#021322] py-6 text-center text-slate-400 sm:py-8 ${className}`}
    >
      <ContainerMax>
        <div className="flex flex-col items-center justify-center gap-1.5 text-xs sm:text-sm">
          <p className="font-semibold text-slate-200">
            <Link
              href="/"
              className="transition-colors hover:text-[#0BA9D6]"
              title={SITE.nameEn}
            >
              {SITE.nameEn}
            </Link>{" "}
            <span className="text-slate-400">({SITE.nameBn})</span>
          </p>
          <p className="text-slate-400">
            &copy; {currentYear} {SITE.nameEn}। সর্বস্বত্ব সংরক্ষিত।
          </p>
        </div>
      </ContainerMax>
    </footer>
  );
}
