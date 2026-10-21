"use client";

import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import Search from "./Search";

const MobileSearch = () => {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="md:hidden">
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-lg text-card-foreground hover:bg-muted"
        aria-label={open ? "সার্চ বন্ধ করুন" : "সার্চ খুলুন"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (
          <X className="size-4" aria-hidden="true" />
        ) : (
          <SearchIcon className="size-4" aria-hidden="true" />
        )}
      </Button>
      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full border-b border-border bg-card px-3 py-2 shadow-lg sm:px-6"
        >
          <Search autoFocus onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
};

export default MobileSearch;
