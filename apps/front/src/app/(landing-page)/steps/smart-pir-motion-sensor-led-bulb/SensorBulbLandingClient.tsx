"use client";

import PaymentMethods from "@/app/(public)/checkout/components/PaymentMethods";
import SelectShippingArea from "@/app/(public)/checkout/components/SelectShippingArea";
import ShippingAddress from "@/app/(public)/checkout/components/ShippingAddress";
import VariationSelector from "@/app/(public)/product/[slug]/components/VariationSelector";
import OrderLimit from "@/components/orderLimit/OrderLimit";
import ContainerMax from "@/components/shared/containerMax/ContainerMax";
import { Button } from "@/components/ui/button";
import { PRODUCT_TYPE } from "@/const/product.const";
import { isValidBdPhone } from "@/const/validation.const";
import useCheckoutLogic from "@/hooks/useCheckoutLogic";
import useSalesOrderSubmit from "@/hooks/useSalesOrderSubmit";
import { useAppSelector } from "@/redux/hooks";
import {
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
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import DemoLandingStory from "./DemoLandingStory";
import {
  firstAvailableVariation,
  inventoryAvailable,
  landingProductAvailable,
} from "./productAvailability";

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
    firstAvailableVariation(product)
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
  productSelection,
}: {
  lines: SelectedLine[];
  shippingCharges: TShippingCharges[];
  paymentMethods: TPaymentMethod[];
  // eslint-disable-next-line no-unused-vars
  onRemoveProduct: (productId: string) => void;
  productSelection: ReactNode;
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:col-span-2">
            <div className="mb-6 border-b border-slate-200 pb-5 text-center">
              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                অর্ডার কনফার্ম করতে নিচের ফর্মটি পূরণ করুন
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                অগ্রিম ১ টাকাও দিতে হবে না! পণ্য হাতে পেয়ে ডেলিভারি ম্যানের কাছে
                মূল্য পরিশোধ করবেন।
              </p>
            </div>
            {productSelection}
          </div>
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
  const availableProducts = useMemo(
    () => products.filter(landingProductAvailable),
    [products]
  );
  const [selections, setSelections] = useState<Record<string, Selection>>(() =>
    Object.fromEntries(
      availableProducts.map((product, index) => [
        product._id,
        {
          quantity: index === 0 ? 1 : 0,
          variationId: firstAvailableVariation(product)?._id,
        },
      ])
    )
  );
  const primary = availableProducts[0];

  const lines = availableProducts
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

  const productSelection = (
    <div className="grid gap-4 md:grid-cols-2">
      {availableProducts.map((product) => {
        const selection = selections[product._id] || { quantity: 0 };
        const line = lineFor(product, selection);
        const variations = productVariations(product).filter((variation) =>
          inventoryAvailable(variation.inventory)
        );
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
            className={`rounded-xl border bg-slate-50/60 p-4 transition-colors sm:p-5 ${selection.quantity ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
          >
            <div className="flex gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
                <ProductPhoto
                  src={
                    product._id === primary?._id
                      ? bulbFallback
                      : line.variation?.image?.src || product.thumbnail?.src
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
                      selection.quantity === 0 && (!hasStock || !line.inStock)
                    }
                    onChange={(event) =>
                      setProductSelected(product, event.target.checked)
                    }
                    className="mt-1 size-5 shrink-0 accent-primary"
                  />
                  <span className="font-bold leading-6">{product.title}</span>
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
  );

  return (
    <main className="dark min-h-screen bg-[#031b2e] text-white">
      <DemoLandingStory />

      <section
        id="order-checkout"
        className="pir-checkout scroll-mt-6 bg-[#f8fafc] py-12 text-slate-900 sm:py-16"
      >
        <ContainerMax>
          {availableProducts.length === 0 && (
            <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              এই মুহূর্তে অর্ডারের জন্য কোনো পণ্য পাওয়া যাচ্ছে না।
            </div>
          )}
          {availableProducts.length > 0 && (
            <div className="mx-auto max-w-5xl">
              {shippingCharges.length && paymentMethods.length ? (
                <OrderForm
                  lines={lines}
                  shippingCharges={shippingCharges}
                  paymentMethods={paymentMethods}
                  onRemoveProduct={removeProduct}
                  productSelection={productSelection}
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
    </main>
  );
}
