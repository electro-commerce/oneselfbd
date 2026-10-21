import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Menu } from "lucide-react";
import logo from "../../../../public/logo/logo.png";
import CartLinksAndAccount from "./components/CartLinksAndAccount";
import MobileMenuFetcher from "./components/MobileMenuFetcher";
import Search from "./components/Search";
import MobileSearch from "./components/MobileSearch";

const MainHeader = () => (
  <header className="sticky top-0 z-50 border-b border-border bg-card text-card-foreground shadow-sm md:static md:shadow-none">
    <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 px-3 py-1.5 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-8 md:py-2 lg:px-8">
      <div className="md:hidden">
        <Suspense
          fallback={
            <Button
              variant="outline"
              size="icon"
              aria-label="মেনু লোড হচ্ছে"
              disabled
              className="size-9 rounded-lg p-0"
            >
              <Menu className="size-4" />
            </Button>
          }
        >
          <MobileMenuFetcher />
        </Suspense>
      </div>
      <Link
        href="/"
        aria-label="Oneself হোম"
        className="flex shrink-0 items-center justify-self-center md:justify-self-start rounded-lg bg-white px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Image
          src={logo}
          alt="Oneself"
          width={120}
          height={49}
          className="h-auto w-[80px] md:w-[120px]"
          sizes="(min-width: 768px) 120px, 80px"
          priority
        />
      </Link>
      <div className="hidden min-w-0 md:block md:col-span-1 md:col-start-2 md:row-start-1 md:mx-auto md:w-full md:max-w-xl">
        <Search />
      </div>
      <div className="col-start-3 row-start-1 flex items-center gap-0.5 md:gap-1 justify-self-end">
        <MobileSearch />
        <CartLinksAndAccount />
      </div>
    </div>
  </header>
);

export default MainHeader;
