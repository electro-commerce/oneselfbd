import config from "@/config/config";
import { ROLES } from "@/const/role";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Custom header prevents cross-origin form submissions using shared cookies.
  if (req.headers.get("x-revalidate-request") !== "1") {
    return NextResponse.json({ message: "Invalid request." }, { status: 403 });
  }
  const authorization =
    req.headers.get("authorization") ||
    `Bearer ${req.cookies.get("_app.ec.at")?.value || ""}`;
  if (authorization === "Bearer ") {
    return NextResponse.json(
      { message: "Please sign in again." },
      { status: 401 }
    );
  }
  try {
    const apiUrl =
      process.env.API_INTERNAL_URL ||
      `${config.api_base_url.replace(/\/$/, "").replace(/\/server-api\/v1$/, "")}/server-api/v1`;
    // Validate the token against the API; never trust a decoded JWT or UI guards.
    const profileResponse = await fetch(`${apiUrl}/users/profile`, {
      headers: { authorization },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!profileResponse.ok) {
      return NextResponse.json(
        { message: "Please sign in again." },
        { status: 401 }
      );
    }
    const profile = (await profileResponse.json()).data;
    if (
      ![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF].includes(profile?.role)
    ) {
      return NextResponse.json(
        { message: "Dashboard access required." },
        { status: 403 }
      );
    }
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
      return NextResponse.json(
        { message: "Cache revalidation is not configured." },
        { status: 503 }
      );
    }
    const body = await req.json();
    const response = await fetch(
      `${process.env.STOREFRONT_INTERNAL_URL || config.client_base_url}/api/revalidate`,
      {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ all: body.all, tags: body.tags }),
      }
    );
    if (!response.ok) {
      return NextResponse.json(
        { message: "Storefront cache revalidation failed." },
        { status: 502 }
      );
    }
    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json(
      { message: "Unable to revalidate storefront cache. Try again." },
      { status: 502 }
    );
  }
}
