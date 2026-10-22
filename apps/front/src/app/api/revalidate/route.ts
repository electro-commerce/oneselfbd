import config from "@/config/config";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export const GET = (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);

    const key = searchParams.get("key");
    const secret = searchParams.get("secret");

    if (!secret) {
      return NextResponse.json(
        { status: "ERROR", message: "Revalidate secret is required." },
        { status: 401 }
      );
    }

    if (!config.revalidate_secret || secret !== config.revalidate_secret) {
      return NextResponse.json(
        { status: "ERROR", message: "Revalidate secret doesn't match." },
        { status: 401 }
      );
    }

    if (!key) {
      return NextResponse.json(
        { status: "ERROR", message: "Revalidate key is required." },
        { status: 400 }
      );
    }

    const tags = key.split(",");

    tags.forEach((tag) => {
      revalidateTag(decodeURIComponent(tag.trim()));
    });

    return NextResponse.json(
      { status: "OK", revalidated: tags },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "ERROR", message: "Internal server error." },
      { status: 500 }
    );
  }
};

// Full invalidation is only available through a server-to-server POST.
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    if (body.all === true) {
      revalidatePath("/", "layout");
    } else if (
      Array.isArray(body.tags) &&
      body.tags.length > 0 &&
      body.tags.length <= 100 &&
      body.tags.every(
        (tag: unknown) =>
          typeof tag === "string" && tag.length > 0 && tag.length <= 256
      )
    ) {
      body.tags.forEach((tag: string) => revalidateTag(tag));
    } else {
      return NextResponse.json(
        { message: "Provide all: true or valid tags." },
        { status: 400 }
      );
    }
    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json(
      { message: "Cache revalidation failed." },
      { status: 500 }
    );
  }
}
