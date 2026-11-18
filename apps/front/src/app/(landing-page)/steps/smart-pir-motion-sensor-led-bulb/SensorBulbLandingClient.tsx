"use client";

import PaymentMethods from "@/app/(public)/checkout/components/PaymentMethods";
import SelectShippingArea from "@/app/(public)/checkout/components/SelectShippingArea";
import ShippingAddress from "@/app/(public)/checkout/components/ShippingAddress";
import VariationSelector from "@/app/(public)/product/[slug]/components/VariationSelector";
import OrderLimit from "@/components/orderLimit/OrderLimit";
import ContainerMax from "@/components/shared/containerMax/ContainerMax";
import { Button } from "@/components/ui/button";
import { SITE } from "@/const/site.const";
import { PRODUCT_TYPE, STOCK_STATUS } from "@/const/product.const";
import { isValidBdPhone } from "@/const/validation.const";
import useCheckoutLogic from "@/hooks/useCheckoutLogic";
import useSalesOrderSubmit from "@/hooks/useSalesOrderSubmit";
import { useAppSelector } from "@/redux/hooks";
import {
  getDefaultVariation,
  getTrackingItemId,
  getVariantLabel,
  isVariationInStock,
} from "@/lib/ec/variation";
import { getImageSrc } from "@/lib/utils";
import eventHandler from "@/tracking/eventHandler";
import { TShippingInfo } from "@/types/order/shippingInfo";
import { TPaymentMethod } from "@/types/paymentMethod";
import { TSingleProduct, TVariations } from "@/types/products/singleProduct";
import TShippingCharges from "@/types/shippingCharge";
import {
  BadgeCheck,
  Lightbulb,
  Minus,
  Plus,
  Radar,
  ShieldCheck,
  SunMoon,
  Timer,
  Truck,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import SensorBulbStorySections from "./SensorBulbStorySections";

type Props = {
  products: TSingleProduct[];
  shippingCharges: TShippingCharges[];
  paymentMethods: TPaymentMethod[];
};

type Selection = { quantity: number; variationId?: string };
type CheckoutData = {
  shipping: TShippingInfo;
  paymentMethod: string;
  paymentDetails?: Record<string, string | number>;
};
type SelectedLine = {
  product: TSingleProduct;
  variation: TVariations | null;
  quantity: number;
  regularPrice: number;
  salePrice: number;
  inStock: boolean;
};

const taka = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;
const bulbFallback = "/images/landing-page/pir-sensor-bulb/product.webp";

function plainDescription(description?: string) {
  return description
    ?.replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveProductPhotoSrc(src: string | undefined, fallback: string) {
  const resolved = getImageSrc(src);
  return resolved.includes("localhost:5000") ? fallback : resolved;
}

function ProductPhoto({
  src,
  alt,
  fallback,
  sizes,
  className,
}: {
  src?: string;
  alt: string;
  fallback: string;
  sizes: string;
  className: string;
}) {
  const [imageSrc, setImageSrc] = useState(() =>
    resolveProductPhotoSrc(src, fallback)
  );

  useEffect(
    () => setImageSrc(resolveProductPhotoSrc(src, fallback)),
    [src, fallback]
  );

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
      onError={() =>
        setImageSrc((current) =>
          current === fallback ? "/placeholder.webp" : fallback
        )
      }
    />
  );
}

function productVariations(product: TSingleProduct) {
  return product.type === PRODUCT_TYPE.VARIABLE ? product.variations || [] : [];
}

function selectedVariation(product: TSingleProduct, selection: Selection) {
  const variations = productVariations(product);
  return (
    variations.find((variation) => variation._id === selection.variationId) ||
    getDefaultVariation(variations)
  );
}

function inventoryAvailable(inventory?: TSingleProduct["inventory"]) {
  return (
    inventory?.stockStatus !== STOCK_STATUS.OUT_OF_STOCK &&
    (!inventory?.manageStock || inventory.stockAvailable > 0)
  );
}

function lineFor(product: TSingleProduct, selection: Selection): SelectedLine {
  const variation = selectedVariation(product, selection);
  const regularPrice =
    variation?.price?.regularPrice || product.price?.regularPrice || 0;
  const salePrice =
    variation?.price?.salePrice ||
    variation?.price?.regularPrice ||
    product.price?.salePrice ||
    regularPrice;
  const inStock =
    product.type === PRODUCT_TYPE.VARIABLE
      ? !!variation &&
        isVariationInStock(variation) &&
        inventoryAvailable(variation.inventory)
      : inventoryAvailable(product.inventory);

  return {
    product,
    variation,
    quantity: selection.quantity,
    regularPrice,
    salePrice,
    inStock,
  };
}

function OrderForm({
  lines,
  shippingCharges,
  paymentMethods,
  onRemoveProduct,
}: {
  lines: SelectedLine[];
  shippingCharges: TShippingCharges[];
  paymentMethods: TPaymentMethod[];
  // eslint-disable-next-line no-unused-vars
  onRemoveProduct: (productId: string) => void;
}) {
  const methods = useForm<CheckoutData>({ mode: "onSubmit" });
  const subtotal = lines.reduce(
    (total, line) => total + line.salePrice * line.quantity,
    0
  );
  const savings = lines.reduce(
    (total, line) =>
      total + Math.max(0, line.regularPrice - line.salePrice) * line.quantity,
    0
  );
  const { calculatedTotal } = useCheckoutLogic({ totalCost: subtotal });
  const orderedProducts = useMemo(
    () =>
      lines.map((line) => ({
        product: line.product._id,
        variation: line.variation?._id,
        quantity: line.quantity,
      })),
    [lines]
  );
  const trackingProducts = useMemo(
    () =>
      lines.map((line) => ({
        productId: line.product._id,
        name: line.product.title,
        brand: line.product.brand?.name,
        category: line.product.category?.[0]?.name,
        variant: getVariantLabel(line.variation),
        unitPrice: line.salePrice,
      })),
    [lines]
  );
  const first = lines[0];
  const {
    handlePlaceOrder,
    isLoading,
    isSuccess,
    errorMessages,
    limitModalStatus,
    setLimitModalStatus,
  } = useSalesOrderSubmit({
    paymentMethods,
    totalCost: subtotal,
    orderedProducts,
    trackingProducts,
    lpNo: "LP-SMART-PIR-BULB-01",
    productName: first?.product.title || "Smart PIR Motion Sensor LED Bulb",
    unitPrice: first?.salePrice,
  });

  const shipping = useWatch({ control: methods.control, name: "shipping" });
  const selectedShipping = useAppSelector((state) => state.shippingClass);
  const checkoutTracked = useRef(false);
  const checkoutTrackingPromise = useRef<Promise<void> | null>(null);
  const shippingTrackedFor = useRef<string | null>(null);
  const shippingTrackingPromise = useRef<Promise<void> | null>(null);
  const trackCheckout = useCallback(
    (customer: TShippingInfo) => {
      if (
        checkoutTracked.current ||
        !customer?.fullName?.trim() ||
        !isValidBdPhone(customer.phoneNumber) ||
        lines.length === 0
      )
        return;

      checkoutTracked.current = true;
      checkoutTrackingPromise.current = eventHandler({
        event_name: "initiate_checkout",
        fullName: customer.fullName,
        ph: customer.phoneNumber,
        em: customer.email || undefined,
        content_type: "product",
        content_ids: lines.map((line) =>
          getTrackingItemId(line.product._id, line.variation?._id)
        ),
        contents: lines.map((line) => ({
          id: getTrackingItemId(line.product._id, line.variation?._id),
          name: line.product.title,
          brand: line.product.brand?.name,
          category: line.product.category?.[0]?.name,
          variant: getVariantLabel(line.variation),
          quantity: line.quantity,
          item_price: line.salePrice,
        })),
        value: subtotal,
      });
    },
    [lines, subtotal]
  );
  useEffect(() => {
    if (shipping) trackCheckout(shipping);
  }, [shipping, trackCheckout]);

  const trackShipping = useCallback(
    (customer: TShippingInfo) => {
      const shippingSelectionKey = JSON.stringify({
        shippingId: selectedShipping._id,
        shippingAmount: selectedShipping.amount,
        items: lines.map((line) => ({
          id: getTrackingItemId(line.product._id, line.variation?._id),
          quantity: line.quantity,
        })),
      });
      if (
        !customer?.fullAddress?.trim() ||
        !customer?.fullName?.trim() ||
        !isValidBdPhone(customer.phoneNumber) ||
        !selectedShipping._id ||
        shippingTrackedFor.current === shippingSelectionKey ||
        lines.length === 0
      )
        return;

      trackCheckout(customer);
      shippingTrackedFor.current = shippingSelectionKey;
      const shippingTier = shippingCharges.find(
        (charge) => charge._id === selectedShipping._id
      )?.name;
      shippingTrackingPromise.current = (async () => {
        await checkoutTrackingPromise.current?.catch(() => undefined);
        await eventHandler({
          event_name: "add_shipping_info",
          fullName: customer.fullName,
          ph: customer.phoneNumber,
          em: customer.email || undefined,
          upazila_id: customer.upazila,
          content_type: "product",
          contents: lines.map((line) => ({
            id: getTrackingItemId(line.product._id, line.variation?._id),
            name: line.product.title,
            brand: line.product.brand?.name,
            category: line.product.category?.[0]?.name,
            variant: getVariantLabel(line.variation),
            quantity: line.quantity,
            item_price: line.salePrice,
          })),
          value: subtotal,
          shipping: selectedShipping.amount,
          shipping_tier: shippingTier,
        });
      })();
    },
    [lines, selectedShipping, shippingCharges, subtotal, trackCheckout]
  );
  useEffect(() => {
    if (shipping) trackShipping(shipping);
  }, [shipping, trackShipping]);

  const canOrder =
    lines.length > 0 &&
    lines.every((line) => line.inStock && line.salePrice > 0) &&
    shippingCharges.length > 0 &&
    paymentMethods.length > 0;

  return (
    <>
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(async (data) => {
            if (!canOrder) return;
            trackCheckout(data.shipping);
            trackShipping(data.shipping);
            await checkoutTrackingPromise.current?.catch(() => undefined);
            await shippingTrackingPromise.current?.catch(() => undefined);
            return handlePlaceOrder(data);
          })}
          className="grid gap-6 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <ShippingAddress disablePhoneAutoFill />
            <PaymentMethods
              paymentMethods={paymentMethods}
              idPrefix="pir-landing-payment"
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
              <h3 className="text-xl font-bold text-foreground">
                আপনার অর্ডার
              </h3>
              <div className="mt-5 divide-y divide-border">
                {lines.length ? (
                  lines.map((line) => (
                    <div
                      key={line.product._id}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {line.product.title} × {line.quantity}
                        </p>
                        {line.variation && (
                          <p className="mt-1 text-muted-foreground">
                            {getVariantLabel(line.variation)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-bold text-foreground">
                          {taka(line.salePrice * line.quantity)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-10 text-muted-foreground hover:text-destructive"
                          aria-label={`${line.product.title} অর্ডার থেকে সরান`}
                          onClick={() => onRemoveProduct(line.product._id)}
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-5 text-sm text-muted-foreground">
                    অর্ডার করতে একটি পণ্য বেছে নিন।
                  </p>
                )}
              </div>
              <SelectShippingArea shippingCharges={shippingCharges} />
              <div className="flex justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                <span>পণ্যের মূল্য</span>
                <span>{taka(subtotal)}</span>
              </div>
              {savings > 0 && (
                <div className="mt-2 flex justify-between text-sm font-semibold text-emerald-700">
                  <span>ডিসকাউন্ট সাশ্রয়</span>
                  <span>{taka(savings)}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between text-lg font-bold text-foreground">
                <span>সর্বমোট</span>
                <span className="text-primary">{taka(calculatedTotal)}</span>
              </div>
            </div>
            {!canOrder && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {lines.length === 0
                  ? "অর্ডার করতে অন্তত একটি পণ্য বেছে নিন।"
                  : lines.some((line) => !line.inStock)
                    ? "নির্বাচিত একটি পণ্য স্টকে নেই।"
                    : lines.some((line) => line.salePrice <= 0)
                      ? "নির্বাচিত পণ্যের মূল্য পাওয়া যায়নি।"
                      : "অর্ডার সেবা সাময়িকভাবে পাওয়া যাচ্ছে না।"}
              </p>
            )}
            {errorMessages.map((message, index) => (
              <p
                role="alert"
                key={`${message}-${index}`}
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {message}
              </p>
            ))}
            {Object.keys(methods.formState.errors).length > 0 && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করুন।
              </p>
            )}
            <Button
              type="submit"
              size="lg"
              className="min-h-12 w-full rounded-xl text-base font-bold"
              disabled={!canOrder || isLoading || isSuccess}
            >
              {isLoading
                ? "অর্ডার প্রসেস হচ্ছে..."
                : `অর্ডার কনফার্ম করুন — ${taka(calculatedTotal)}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।
            </p>
          </div>
        </form>
      </FormProvider>
      <OrderLimit
        limitModalStatus={limitModalStatus}
        setLimitModalStatus={setLimitModalStatus}
      />
    </>
  );
}

export default function SensorBulbLandingClient({
  products,
  shippingCharges,
  paymentMethods,
}: Props) {
  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    Object.fromEntries(
      products.map((product, index) => [
        product._id,
        {
          quantity: index === 0 ? 1 : 0,
          variationId: getDefaultVariation(productVariations(product))?._id,
        },
      ])
    )
  );
  const orderRef = useRef<HTMLElement>(null);
  const primary = products[0];

  const lines = products
    .map((product) =>
      lineFor(product, selections[product._id] || { quantity: 0 })
    )
    .filter((line) => line.quantity > 0);

  const setQuantity = (product: TSingleProduct, delta: number) => {
    setSelections((current) => {
      const selection = current[product._id] || { quantity: 0 };
      const variation = selectedVariation(product, selection);
      const inventory = variation?.inventory || product.inventory;
      const maximum = inventory?.manageStock
        ? inventory.stockAvailable
        : Infinity;
      return {
        ...current,
        [product._id]: {
          ...selection,
          quantity: Math.max(0, Math.min(maximum, selection.quantity + delta)),
        },
      };
    });
  };

  const setProductSelected = (product: TSingleProduct, selected: boolean) => {
    setSelections((current) => {
      const previous = current[product._id] || { quantity: 0 };
      return {
        ...current,
        [product._id]: {
          ...previous,
          quantity: selected ? Math.max(1, previous.quantity) : 0,
        },
      };
    });
  };

  const removeProduct = (productId: string) => {
    setSelections((current) => ({
      ...current,
      [productId]: { ...current[productId], quantity: 0 },
    }));
  };

  useEffect(() => {
    if (!primary) return;
    const variation = selectedVariation(
      primary,
      selections[primary._id] || { quantity: 1 }
    );
    void eventHandler({
      event_name: "view_content",
      content_name: primary.title,
      content_type: "product",
      content_ids: [getTrackingItemId(primary._id, variation?._id)],
      contents: [
        {
          id: getTrackingItemId(primary._id, variation?._id),
          name: primary.title,
          brand: primary.brand?.name,
          category: primary.category?.[0]?.name,
          variant: getVariantLabel(variation),
          quantity: 1,
          item_price:
            variation?.price?.salePrice ||
            primary.price?.salePrice ||
            primary.price?.regularPrice ||
            0,
        },
      ],
    });
    // The initial primary product view is emitted once per page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primary?._id]);

  const scrollToOrder = () =>
    orderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main className="dark min-h-screen bg-[#031b2e] text-white">
      <div className="border-b border-sky-300/20 bg-[#021322] px-4 py-2 text-center text-sm font-semibold text-sky-100">
        সরাসরি অর্ডার করুন · সারাদেশে ডেলিভারি
      </div>
      <header className="border-b border-sky-300/20 bg-[#031b2e]">
        <ContainerMax className="flex items-center justify-between gap-4 py-3">
          <a
            href="/"
            aria-label="Oneself হোম"
            className="rounded-xl bg-white px-3 py-1"
          >
            <Image
              src="/logo/logo.png"
              alt="Oneself"
              width={140}
              height={48}
              className="h-11 w-auto object-contain"
              priority
            />
          </a>
          <a
            href={`tel:${SITE.phone}`}
            className="text-sm font-bold text-sky-300 hover:underline"
          >
            {SITE.phoneDisplay}
          </a>
        </ContainerMax>
      </header>

      <section className="overflow-hidden bg-gradient-to-br from-[#031b2e] via-[#053b66] to-[#0ba9d6] py-12 sm:py-16">
        <ContainerMax className="text-center">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-sky-300/25 bg-[#021322] px-5 py-10 shadow-2xl sm:px-10 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.18),transparent_65%)]" />
            <div className="relative mx-auto mb-5 size-24 overflow-hidden rounded-full border border-amber-300/40 shadow-[0_0_45px_rgba(251,191,36,0.25)] sm:size-28">
              <ProductPhoto
                src={bulbFallback}
                alt=""
                fallback={bulbFallback}
                className="object-cover"
                sizes="112px"
              />
            </div>
            <p className="relative mb-4 text-sm font-bold uppercase tracking-widest text-sky-300">
              OneSelf BD · Smart PIR Motion Sensor LED Bulb
            </p>
            <h1 className="relative text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              মানুষ আসলেই{" "}
              <span className="text-amber-300">জ্বলে উঠবে লাইট,</span>
              <span className="mt-2 block">চলে গেলেই অটোমেটিক বন্ধ!</span>
            </h1>
          </div>
          <div className="mx-auto my-7 flex max-w-sm items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-300" />
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_0_28px_rgba(251,191,36,0.7)]">
              <Lightbulb className="size-5" aria-hidden />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-300" />
          </div>
          <p className="mx-auto max-w-3xl rounded-2xl border border-white/20 bg-[#021320]/50 px-5 py-5 text-base leading-8 text-sky-50 sm:text-xl">
            রাতে সিঁড়িঘর, বারান্দা, বাথরুম কিংবা গ্যারাজের সুইচ অন-অফ করার
            ঝামেলা ভুলে যান। OneSelf BD-এর স্মার্ট পিআইআর সেন্সর লাইট মানুষের
            উপস্থিতি শনাক্ত করে স্বয়ংক্রিয়ভাবে জ্বলে ওঠে এবং প্রয়োজন না হলে নিভে
            যায়। বিদ্যুৎ বিল কমাতে সাহায্য করে ৮৫% পর্যন্ত।
          </p>
          <div className="mx-auto mt-7 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Radar, text: "১৫ ফিটের ভেতর মানুষ এলে আলো জ্বলে" },
              { icon: SunMoon, text: "দিনের বেলা অটো বন্ধ" },
              { icon: Timer, text: "চলে গেলে ৩০ সেকেন্ড পর বন্ধ" },
              { icon: Lightbulb, text: "উপযুক্ত হোল্ডারে লাগান" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="rounded-2xl border border-sky-300/25 bg-gradient-to-b from-[#0c507a] to-[#031e30] p-4 shadow-lg"
              >
                <Icon className="mx-auto size-7 text-amber-300" aria-hidden />
                <p className="mt-2 text-sm font-semibold leading-5 text-white">
                  {text}
                </p>
              </div>
            ))}
          </div>
          {primary && (
            <p className="mt-7 text-2xl font-extrabold text-amber-300">
              {taka(
                lineFor(primary, selections[primary._id] || { quantity: 1 })
                  .salePrice
              )}{" "}
              থেকে শুরু
            </p>
          )}
          <Button
            onClick={scrollToOrder}
            size="lg"
            className="mt-6 min-h-12 rounded-xl bg-amber-400 px-8 text-base font-bold text-slate-950 shadow-lg hover:bg-amber-300"
            disabled={!products.length}
          >
            পণ্য বেছে অর্ডার করুন
          </Button>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-sky-100">
            <span className="inline-flex items-center gap-2">
              <BadgeCheck className="size-4 text-amber-300" aria-hidden /> সহজ
              অর্ডার
            </span>
            <span className="inline-flex items-center gap-2">
              <Truck className="size-4 text-amber-300" aria-hidden /> সারাদেশে
              ডেলিভারি
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4 text-amber-300" aria-hidden />{" "}
              নিরাপদ কেনাকাটা
            </span>
          </div>
        </ContainerMax>
      </section>

      <SensorBulbStorySections primary={primary} onOrderClick={scrollToOrder} />

      <section
        ref={orderRef}
        id="order"
        className="pir-checkout scroll-mt-6 bg-[#f8fafc] py-12 text-slate-900 sm:py-16"
      >
        <ContainerMax>
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-bold text-[#0369a1]">
              ক্যাশ অন ডেলিভারি অর্ডার ফর্ম · ১০০% নিরাপদ কেনাকাটা
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              পণ্য ও পরিমাণ নির্বাচন করুন
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              একাধিক পণ্য বেছে নিতে পারবেন। প্রথম পণ্যটি আগে থেকেই নির্বাচিত
              আছে। অগ্রিম মূল্য দেওয়ার প্রয়োজন নেই; ক্যাশ অন ডেলিভারি থাকলে পণ্য
              হাতে পেয়ে পরিশোধ করুন।
            </p>
          </div>
          {products.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => {
                const selection = selections[product._id] || { quantity: 0 };
                const line = lineFor(product, selection);
                const variations = productVariations(product);
                const hasStock =
                  product.type === PRODUCT_TYPE.VARIABLE
                    ? variations.some(
                        (variation) =>
                          isVariationInStock(variation) &&
                          inventoryAvailable(variation.inventory)
                      )
                    : inventoryAvailable(product.inventory);

                return (
                  <article
                    key={product._id}
                    className={`rounded-2xl border bg-background p-5 shadow-sm transition-colors ${selection.quantity ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
                  >
                    <div className="flex gap-4">
                      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                        <ProductPhoto
                          src={
                            product._id === primary?._id
                              ? bulbFallback
                              : line.variation?.image?.src ||
                                product.thumbnail?.src
                          }
                          alt={product.title}
                          fallback={
                            product._id === primary?._id
                              ? bulbFallback
                              : "/placeholder.webp"
                          }
                          className="object-contain p-2"
                          sizes="112px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selection.quantity > 0}
                            disabled={
                              selection.quantity === 0 &&
                              (!hasStock || !line.inStock)
                            }
                            onChange={(event) =>
                              setProductSelected(product, event.target.checked)
                            }
                            className="mt-1 size-5 shrink-0 accent-primary"
                          />
                          <span className="font-bold leading-6">
                            {product.title}
                          </span>
                        </label>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-lg font-extrabold text-primary">
                            {taka(line.salePrice)}
                          </span>
                          {line.regularPrice > line.salePrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              {taka(line.regularPrice)}
                            </span>
                          )}
                        </div>
                        {!hasStock && (
                          <p className="mt-1 text-xs font-semibold text-destructive">
                            স্টক শেষ
                          </p>
                        )}
                      </div>
                    </div>
                    {plainDescription(product.shortDescription) && (
                      <p className="mt-4 text-sm leading-6 text-muted-foreground">
                        {plainDescription(product.shortDescription)}
                      </p>
                    )}
                    {product.attribute?.length > 0 && (
                      <dl className="mt-4 grid gap-2 text-xs text-muted-foreground">
                        {product.attribute.map((attribute) => (
                          <div key={attribute.name} className="flex gap-2">
                            <dt className="shrink-0 font-bold text-foreground">
                              {attribute.name}:
                            </dt>
                            <dd>{attribute.values.join(", ")}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {variations.length > 0 && (
                      <div className="mt-4 border-t border-border pt-2">
                        <VariationSelector
                          key={product._id}
                          variations={variations}
                          initialPrice={{
                            regularPrice: line.regularPrice,
                            salePrice: line.salePrice,
                          }}
                          onVariationChange={(variation) => {
                            setSelections((current) => {
                              const previous = current[product._id] || {
                                quantity: 0,
                              };
                              if (previous.variationId === variation._id)
                                return current;
                              return {
                                ...current,
                                [product._id]: {
                                  ...previous,
                                  variationId: variation._id,
                                },
                              };
                            });
                          }}
                        />
                        {!line.inStock && (
                          <p className="text-xs font-semibold text-destructive">
                            এই ভ্যারিয়েন্টটি স্টকে নেই।
                          </p>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="text-sm font-semibold">পরিমাণ</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 rounded-lg"
                          aria-label={`${product.title} একটি কমান`}
                          onClick={() => setQuantity(product, -1)}
                          disabled={selection.quantity === 0}
                        >
                          <Minus aria-hidden />
                        </Button>
                        <span
                          className="w-8 text-center font-bold tabular-nums"
                          aria-live="polite"
                        >
                          {selection.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 rounded-lg"
                          aria-label={`${product.title} একটি বাড়ান`}
                          onClick={() => setQuantity(product, 1)}
                          disabled={!hasStock || !line.inStock}
                        >
                          <Plus aria-hidden />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background p-8 text-center text-muted-foreground">
              এই পেজে এখনো কোনো পণ্য যুক্ত করা হয়নি।
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-10">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold sm:text-3xl">
                  অর্ডার কনফার্ম করুন
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  নাম, মোবাইল নম্বর ও ঠিকানা দিয়ে সরাসরি অর্ডার দিন।
                </p>
              </div>
              {shippingCharges.length && paymentMethods.length ? (
                <OrderForm
                  lines={lines}
                  shippingCharges={shippingCharges}
                  paymentMethods={paymentMethods}
                  onRemoveProduct={removeProduct}
                />
              ) : (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-background p-5 text-center text-destructive"
                >
                  অর্ডার সেবা সাময়িকভাবে পাওয়া যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ
                  পর আবার চেষ্টা করুন।
                </p>
              )}
            </div>
          )}
        </ContainerMax>
      </section>
      <footer className="border-t border-sky-300/20 bg-[#021322] py-6 text-center text-sm text-sky-100/75">
        © {new Date().getFullYear()} {SITE.nameEn} ·{" "}
        <a
          href={`tel:${SITE.phone}`}
          className="font-semibold text-sky-300 hover:underline"
        >
          {SITE.phoneDisplay}
        </a>
      </footer>
    </main>
  );
}
