"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAppSelector } from "@/redux/hooks";
import { ROLES } from "@/const/role";
import { revalidateStorefront } from "@/utilities/revalidate";

export default function RevalidateStorefrontButton() {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAppSelector((state) => state.auth);
  const role = profile?.role || user?.role;
  if (!role || role === ROLES.CUSTOMER) return null;

  const handleClick = async () => {
    setPending(true);
    try {
      await revalidateStorefront();
      toast({
        title: "Storefront cache revalidated",
        description: "Pages will load fresh data on their next visit.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Revalidation failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      onClick={handleClick}
      aria-label={pending ? "Revalidating storefront" : "Revalidate storefront"}
    >
      <RefreshCw
        aria-hidden="true"
        className={`h-4 w-4 sm:mr-2 ${pending ? "motion-safe:animate-spin" : ""}`}
      />
      <span className="hidden sm:inline">
        {pending ? "Revalidating…" : "Revalidate storefront"}
      </span>
    </Button>
  );
}
