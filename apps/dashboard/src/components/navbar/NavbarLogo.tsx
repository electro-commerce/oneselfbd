"use client";
import { useSidebar } from "@/providers/SidebarProvider";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/logo.png";

export default function NavbarLogo() {
  const { isCollapsed } = useSidebar();

  return (
    <Link
      href="/dashboard"
      className={isCollapsed ? "block md:hidden" : "block"}
    >
      <div className="px-3 py-1.5 flex items-center hover:opacity-95 transition-opacity">
        <Image
          className="h-7 w-auto object-contain"
          src={logo}
          alt="Oneself Logo"
          priority={true}
          width={130}
          height={32}
        />
      </div>
    </Link>
  );
}
