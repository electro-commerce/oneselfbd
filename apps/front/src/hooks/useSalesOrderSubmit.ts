"use client";

import { toast } from "@/components/ui/use-toast";
import { resetCoupon } from "@/redux/features/order/couponInfo";
import { useCreateOrderMutation } from "@/redux/features/order/orderApi";
import {
  setPaymentInfo,
  setPaymentInfoError,
} from "@/redux/features/order/paymentInfo";
import { setShippingInfo } from "@/redux/features/order/shippingInfo";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import eventHandler from "@/tracking/eventHandler";
import { TShippingInfo } from "@/types/order/shippingInfo";
import { TPaymentMethod } from "@/types/paymentMethod";
import { TGenericErrorResponse } from "@/types/response";
import BdAddress from "@/utilities/bdAddress/bdAddress";
import { getTrackingItemId } from "@/lib/ec/variation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type TCheckoutFormData = {
  shipping: TShippingInfo;
  paymentMethod: string;
  paymentDetails?: Record<string, string | number>;
};

type TOrderItem = {
  product: string;
  variation?: string;
  quantity: number;
};

type TOrderedProductRes = TOrderItem & { unitPrice?: number };

type TTrackingProduct = {
  productId: string;
  name: string;
  category?: string;
  brand?: string;
  variant?: string;
  unitPrice: number;
};

type TOrderData = {
  payment: {
    paymentMethod: string;
    paymentDetails?: Record<string, string | number>;
  };
  shippingCharge: string;
  shipping: {
    fullName: string;
    phoneNumber: string;
    fullAddress: string;
    email?: string;
  };
  orderNotes?: string;
  orderSource: {
    name: string;
    url: string;
    lpNo?: string;
  };
  coupon?: string;
  salesPage: boolean;
  orderedProducts: TOrderItem[];
};

const useSalesOrderSubmit = ({
  paymentMethods,
  totalCost,
  orderedProducts,
  lpNo,
  productName,
  productCategory,
  productBrand,
  productVariant,
  unitPrice,
  trackingProducts,
}: {
  paymentMethods: TPaymentMethod[];
  totalCost: number;
  orderedProducts: TOrderItem[];
  lpNo: string;
  productName: string;
  productCategory?: string;
  productBrand?: string;
  productVariant?: string;
  unitPrice?: number; // Fallback unit price if the API response lacks orderedProducts
  trackingProducts?: TTrackingProduct[];
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [limitModalStatus, setLimitModalStatus] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const lastPaymentInfoKey = useRef<string | null>(null);

  const shippingClass = useAppSelector((state) => state.shippingClass);
  const couponInfo = useAppSelector((state) => state.coupon);
  const auth = useAppSelector((state) => state.auth);

  const trackingContents = (items: TOrderedProductRes[]) =>
    items.map((item) => {
      const tracked = trackingProducts?.find(
        (product) => product.productId === item.product
      );
      return {
        id: getTrackingItemId(item.product, item.variation),
        name: tracked?.name || productName,
        brand: tracked?.brand || productBrand,
        category: tracked?.category || productCategory,
        variant: item.variation
          ? tracked?.variant || productVariant
          : undefined,
        quantity: item.quantity,
        item_price: item.unitPrice ?? tracked?.unitPrice ?? unitPrice,
      };
    });

  // Initial Setup: Set default payment method
  useEffect(() => {
    dispatch(setPaymentInfo({ selectedPaymentMethod: paymentMethods[0] }));
    dispatch(setPaymentInfoError({ errors: null }));

    return () => {
      dispatch(setPaymentInfoError({ errors: null }));
    };
  }, [dispatch, paymentMethods]);

  const handlePlaceOrder = async (data: TCheckoutFormData) => {
    setErrorMessages([]);

    // 1. Construct Shipping Data
    const shippingData = {
      fullName: data.shipping.fullName,
      phoneNumber: data.shipping.phoneNumber,
      fullAddress: data.shipping.fullAddress,
      email: data.shipping.email,
      notes: data.shipping.notes,
      division: data.shipping.division,
      district: data.shipping.district,
      upazila: data.shipping.upazila,
    };

    // Update Redux & LocalStorage (for persistence in future visits)
    dispatch(setShippingInfo(shippingData));
    localStorage.setItem("shippingAddress", JSON.stringify(shippingData));

    // 2. Local Validation
    if (
      !shippingData.phoneNumber ||
      !shippingData.fullName ||
      !shippingData.fullAddress
    ) {
      setErrorMessages([
        "অনুগ্রহ করে শিপিংয়ের প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন।",
      ]);
      return;
    }

    // 3. Construct Order Data (Bypassing Cart API)
    const orderData: TOrderData = {
      payment: {
        paymentMethod: data.paymentMethod,
        paymentDetails: data.paymentDetails,
      },
      shippingCharge: shippingClass._id,
      shipping: {
        fullName: shippingData.fullName,
        phoneNumber: shippingData.phoneNumber,
        fullAddress: shippingData.fullAddress,
        email: shippingData.email || undefined,
      },
      orderNotes: shippingData.notes,
      orderSource: {
        name: "Landing Page",
        url: typeof window !== "undefined" ? window.location.href : "",
        lpNo: lpNo,
      },
      coupon: couponInfo.coupon === null ? undefined : couponInfo.coupon,
      salesPage: true,
      orderedProducts: orderedProducts,
    };

    const divisionName = shippingData.division
      ? BdAddress.divisionNameById(shippingData.division, "en").name
      : undefined;
    const districtName = shippingData.district
      ? BdAddress.districtNameById(shippingData.district, "en").name
      : undefined;
    const selectedPaymentMethod = paymentMethods.find(
      (method) => method._id === data.paymentMethod
    );
    const paymentMethodName = selectedPaymentMethod?.name || data.paymentMethod;
    const paymentInfoKey = JSON.stringify({
      paymentMethod: data.paymentMethod,
      orderedProducts,
      shippingAmount: shippingClass.amount,
      coupon: couponInfo.coupon,
      couponDiscount: couponInfo.couponDiscount,
    });

    if (lastPaymentInfoKey.current !== paymentInfoKey) {
      lastPaymentInfoKey.current = paymentInfoKey;
      await eventHandler({
        event_name: "add_payment_info",
        fullName: shippingData.fullName,
        ph: shippingData.phoneNumber,
        em: shippingData.email,
        st: divisionName,
        ct: districtName,
        upazila_id: shippingData.upazila,
        content_type: "product",
        contents: trackingContents(orderedProducts),
        value: Math.max(0, totalCost - (couponInfo.couponDiscount || 0)),
        shipping: shippingClass.amount,
        discount_value: couponInfo.couponDiscount || 0,
        coupon: couponInfo.coupon ?? undefined,
        payment_method: paymentMethodName,
        external_id: auth.user?.userId,
      }).catch(() => undefined);
    }

    // 4. Create Order Mutation
    try {
      const result = await createOrder(orderData).unwrap();
      if (result.success) {
        setIsSuccess(true);
        // GTM Event
        await eventHandler({
          event_name: "purchase",
          fullName: shippingData.fullName,
          ph: shippingData.phoneNumber,
          em: shippingData.email,
          st: divisionName,
          ct: districtName,
          upazila_id: shippingData.upazila,
          order_id: result?.data?.orderId || result?.data?._id,
          content_type: "product",
          content_category: productCategory,
          contents: trackingContents(
            (result?.data?.orderedProducts as TOrderedProductRes[]) ||
              orderedProducts.map((item) => ({ ...item, unitPrice }))
          ),
          value: Math.max(
            0,
            (result?.data?.subtotal ?? totalCost) - (result?.data?.discount || 0)
          ),
          shipping: result?.data?.shippingCharge?.amount ?? shippingClass.amount,
          tax: result?.data?.tax,
          discount_value: result?.data?.discount ?? 0,
          coupon: couponInfo.coupon ?? undefined,
          payment_method: paymentMethodName,
          status: "completed",
          external_id: auth.user?.userId,
        }).catch(() => undefined);

        toast({
          title: "ধন্যবাদ! আপনার অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।",
          className: "bg-success text-primary-foreground",
        });

        dispatch(resetCoupon());
        router.push(`/thank-you/${result?.data?._id}`);
      }
    } catch (error) {
      const res = (error as { data: TGenericErrorResponse }).data;
      const messages = res?.errorMessages?.map((error) => error.message) || [];
      setErrorMessages(messages);

      if (res?.message === "Reached order limit") {
        setLimitModalStatus(true);
      }
    }
  };

  return {
    handlePlaceOrder,
    isLoading,
    errorMessages,
    isSuccess,
    limitModalStatus,
    setLimitModalStatus,
  };
};

export default useSalesOrderSubmit;
