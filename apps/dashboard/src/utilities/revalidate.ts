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

async function requestRevalidation(
  body: { all: true } | { tags: string[] },
  token?: string | null
) {
  const response = await fetch("/api/revalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-request": "1",
      ...(process.env.NEXT_PUBLIC_REVALIDATE_SECRET
        ? { "x-revalidate-secret": process.env.NEXT_PUBLIC_REVALIDATE_SECRET }
        : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || "Storefront cache revalidation failed.");
  }
}

export const revalidateTag = async (tag: TTags | TTags[]) =>
  requestRevalidation({
    tags: (Array.isArray(tag) ? tag : [tag]).map((t) => decodeURIComponent(t)),
  });

export const revalidateStorefront = async (token?: string | null) =>
  requestRevalidation({ all: true }, token);
