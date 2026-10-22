import config from "@/config/config";

export type TTags =
  | "products"
  | `product-${string}`
  | `relatedProducts-${string}`
  | `collectionProducts-${string}`
  | "bestSellingProducts"
  | "featuredProducts"
  | "priceRange"
  | "categories"
  | "brands"
  | "collections"
  | "paymentMethod"
  | "shippingCharge"
  | "sliderBanner"
  | `homepageSections`
  | `homepageSections-${string}`
  | "homepageIndividualSection"
  | "blogPosts"
  | `blogPost-${string}`
  | "qna"
  | `qna-${string}`
  | "blogQaCategories"
  | "blogQaTags";

async function requestRevalidation(body: { all: true } | { tags: string[] }) {
  const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET;
  if (!secret) {
    throw new Error(
      "Set NEXT_PUBLIC_REVALIDATE_SECRET in the dashboard build environment."
    );
  }
  const response = await fetch(
    new URL("/api/revalidate", config.client_base_url).toString(),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    }
  );
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.revalidated !== true) {
    throw new Error(
      result?.message ||
        `Storefront cache revalidation failed (${response.status}).`
    );
  }
}

export const revalidateTag = async (tag: TTags | TTags[]) => {
  const tags = (Array.isArray(tag) ? tag : [tag]).map((t) =>
    decodeURIComponent(t)
  );
  // A product change also affects other products' related lists and home sections.
  if (
    tags.some((t) =>
      /^(products$|product-|relatedProducts-|collectionProducts-|featuredProducts$|bestSellingProducts$)/.test(
        t
      )
    )
  ) {
    tags.push(
      "products",
      "featuredProducts",
      "bestSellingProducts",
      "homepageIndividualSection",
      "priceRange"
    );
  }
  return requestRevalidation({ tags: Array.from(new Set(tags)) });
};

export const revalidateStorefront = async () =>
  requestRevalidation({ all: true });
