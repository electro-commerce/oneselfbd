"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type TProps = {
  name: string;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
};

const ActiveLink = ({
  name,
  href,
  icon,
  badge,
  className,
  activeClassName,
  onClick,
}: TProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const acClass = isActive
    ? activeClassName ||
      "bg-slate-900 text-white font-normal shadow-sm dark:bg-slate-200 dark:text-slate-950"
    : "text-slate-800 hover:bg-slate-200/60 hover:text-slate-950 font-normal dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white";

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
    >
      <span
        className={cn(
          "group relative flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-3 py-2 transition-colors duration-200 ease-out",
          acClass,
          className
        )}
      >
        {icon && (
          <span
            className={cn(
              "shrink-0 transition-colors duration-200",
              isActive
                ? "text-white dark:text-slate-950"
                : "text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-100"
            )}
          >
            {icon}
          </span>
        )}
        {name ? <span className="flex-1 truncate text-[14px] leading-5">{name}</span> : null}
        {badge}
      </span>
    </Link>
  );
};

export default ActiveLink;
