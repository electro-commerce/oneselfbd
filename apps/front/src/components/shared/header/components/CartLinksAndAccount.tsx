"use client";

import Link from "next/link";
import CartSidebar from "@/components/cart/CartSidebar";
import { Button } from "@/components/ui/button";
import useCart from "@/hooks/useCart";
import { useGetUserDataQuery } from "@/redux/features/user/userApi";
import { useAppSelector } from "@/redux/hooks";
import { ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

const CartLinksAndAccount = () => {
  const { totalCartItem } = useCart();
  const token = useAppSelector((state) => state.auth.token);
  const { data: user } = useGetUserDataQuery(undefined, { skip: !token });
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <div className="flex items-center gap-1.5 md:gap-2 lg:gap-4">
      <Button
        asChild
        variant="ghost"
        className="hidden h-9 md:h-11 gap-2 rounded-lg md:rounded-xl px-2 md:px-3 text-card-foreground hover:bg-muted sm:flex"
      >
        <Link href="/my-account" aria-label="আমার অ্যাকাউন্ট">
          {isMounted && user?.data?._id ? (
            <span className="flex size-6 items-center justify-center rounded-full bg-accent text-sm font-semibold uppercase text-accent-foreground">
              {user.data.fullName?.charAt(0) || "U"}
            </span>
          ) : (
            <UserRound className="size-4 md:size-5" aria-hidden="true" />
          )}
          <span className="hidden text-sm lg:inline">অ্যাকাউন্ট</span>
        </Link>
      </Button>
      <CartSidebar>
        <Button
          variant="ghost"
          className="relative h-9 min-w-9 md:h-11 md:min-w-11 gap-2 rounded-lg md:rounded-xl border border-border bg-muted/60 px-2 md:px-3 text-card-foreground hover:bg-accent"
          aria-label={`শপিং ব্যাগ, ${isMounted ? (totalCartItem ?? 0) : 0}টি পণ্য`}
        >
          <ShoppingBag className="size-4 md:size-5" aria-hidden="true" />
          <span className="hidden text-sm lg:inline">ব্যাগ</span>
          <span
            className="absolute -right-1 -top-1 md:-right-1.5 md:-top-1.5 flex min-w-4 h-4 md:min-w-5 md:h-5 items-center justify-center rounded-full bg-[#092143] px-0.5 md:px-1 text-[9px] md:text-[10px] font-semibold text-white ring-2 ring-card"
            aria-hidden="true"
          >
            {isMounted ? (totalCartItem ?? 0) : 0}
          </span>
        </Button>
      </CartSidebar>
    </div>
  );
};

export default CartLinksAndAccount;
