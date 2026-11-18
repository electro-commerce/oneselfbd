import { SITE } from "@/const/site.const";
import { TPaymentMethod } from "@/types/paymentMethod";
import { TSingleProduct } from "@/types/products/singleProduct";
import TShippingCharges from "@/types/shippingCharge";
import serverSideFetcher from "@/utilities/serverSideFetcher";
import { Metadata } from "next";
import SensorBulbLandingClient from "./SensorBulbLandingClient";

const pageTitle = "Smart PIR Motion Sensor LED Bulb";
const pagePath = "/smart-pir-motion-sensor-led-bulb";

export const dynamic = "force-dynamic";

function configuredProductIds(): string[] {
  const raw = process.env.LANDING_SMART_PIR_MOTION_SENSOR_LED_BULB_PRODUCT_IDS;
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(
        parsed
          .filter((id): id is string => typeof id === "string" && !!id.trim())
          .map((id) => id.trim())
      )
    );
  } catch {
    return [];
  }
}

async function loadProducts() {
  const ids = configuredProductIds();
  const results = await Promise.all(
    ids.map(async (id) => {
      const response = await serverSideFetcher<TSingleProduct>({
        url: `/products/${encodeURIComponent(id)}`,
        tags: [`product-${id}`],
      });
      return response.success && response.data?._id ? response.data : null;
    })
  );
  return results.filter((product): product is TSingleProduct => !!product);
}

export async function generateMetadata(): Promise<Metadata> {
  const [primary] = await loadProducts();
  const title = `${pageTitle} | ${SITE.nameEn}`;
  const description =
    "স্মার্ট পিআইআর মোশন সেন্সর এলইডি বাল্ব ও প্রয়োজনীয় পণ্য বেছে নিন। সরাসরি অর্ডার করুন।";
  const image = `${SITE.baseUrl}/images/landing-page/pir-sensor-bulb/product.webp`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE.baseUrl}${pagePath}` },
    openGraph: {
      title,
      description,
      url: `${SITE.baseUrl}${pagePath}`,
      images: [{ url: image, alt: primary?.title || pageTitle }],
    },
  };
}

export default async function SensorBulbPage() {
  const [products, shippingResponse, paymentResponse] = await Promise.all([
    loadProducts(),
    serverSideFetcher<TShippingCharges[]>({
      url: "/shipping-charges?isActive=true",
      tags: ["shippingCharge"],
    }),
    serverSideFetcher<(TPaymentMethod & { isActive?: boolean })[]>({
      url: "/payment-method",
      tags: ["paymentMethod"],
    }),
  ]);

  return (
    <SensorBulbLandingClient
      products={products}
      shippingCharges={
        Array.isArray(shippingResponse.data) ? shippingResponse.data : []
      }
      paymentMethods={
        Array.isArray(paymentResponse.data)
          ? paymentResponse.data.filter((method) => method.isActive !== false)
          : []
      }
    />
  );
}
