import { MetaCAPIEventPayload } from "../capi/capi.types";
import { cleanObj } from "../event.helpers";
import { EventParameter } from "../event.types";
import {
  DLVCustomData,
  DLVEcommerce,
  DLVUserData,
  GA4Item,
  GTMEventPayload,
} from "./gtm.types";

/**
 * Builds GTM Event Payload supporting:
 * 1. Top-level DLV - * variables (custom_data, ecommerce, user_data, event_id, event_time, etc.)
 * 2. Standard GA4 eventModel structure
 *
 * @param payload The Meta CAPI Event Payload
 * @param rawEventData The raw, unhashed EventParameter payload
 * @returns A strictly typed GTMEventPayload for dataLayer
 */
export const buildGTMEventPayload = (
  payload: MetaCAPIEventPayload,
  rawEventData: EventParameter
): GTMEventPayload => {
  const isCommerceEvent = [
    "view_content",
    "add_to_cart",
    "add_to_wishlist",
    "initiate_checkout",
    "add_shipping_info",
    "add_payment_info",
    "purchase",
    "refund",
  ].includes(payload.event_name);

  const items: GA4Item[] | undefined =
    payload.custom_data?.contents && payload.custom_data.contents.length > 0
      ? payload.custom_data.contents.map((item) =>
          cleanObj({
            item_id: item.id,
            price: item.item_price,
            quantity: item.quantity,
            item_name: item.title || item.name,
            item_brand: item.brand,
            item_category: item.category,
            item_variant: item.variant,
          })
        )
      : undefined;

  const value = payload.custom_data?.value;
  const currency =
    payload.custom_data?.currency ||
    (payload.custom_data?.value || isCommerceEvent ? "BDT" : undefined);
  const transaction_id = payload.custom_data?.order_id;

  const userData: DLVUserData = cleanObj({
    first_name: rawEventData.fn,
    last_name: rawEventData.ln,
    email: rawEventData.em,
    phone_number: rawEventData.ph,
    address: cleanObj({
      street: undefined,
      first_name: rawEventData.fn,
      last_name: rawEventData.ln,
      city: rawEventData.ct,
      region: rawEventData.st,
      postal_code: rawEventData.zp,
      country: rawEventData.country,
    }),
    external_id: rawEventData.external_id,
    fbc: rawEventData.fbc,
    fbp: rawEventData.fbp,
    // Hashed array fallbacks for DLV - user_data.*.0
    em: payload.user_data?.em,
    ph: payload.user_data?.ph,
    fn: payload.user_data?.fn,
    ln: payload.user_data?.ln,
    ct: payload.user_data?.ct,
    st: payload.user_data?.st,
    zp: payload.user_data?.zp,
    country: payload.user_data?.country,
  });

  const customData: DLVCustomData | undefined = payload.custom_data
    ? cleanObj({
        ...payload.custom_data,
        currency,
      })
    : undefined;

  const ecommerce: DLVEcommerce = cleanObj({
    value,
    currency,
    transaction_id,
    shipping: payload.custom_data?.shipping,
    shipping_tier: payload.custom_data?.shipping_tier,
    tax: payload.custom_data?.tax,
    coupon: payload.custom_data?.coupon,
    items,
  });

  const event: GTMEventPayload = {
    event:
      payload.event_name === "page_view"
        ? "custom_page_view"
        : payload.event_name,
    event_id: payload.event_id,
    event_time: payload.event_time,
    event_source_url: payload.event_source_url,
    action_source: payload.action_source || "website",
    external_id: rawEventData.external_id,
    custom_data: customData,
    ecommerce,
    user_data: userData,
    eventModel: cleanObj({
      event_id: payload.event_id,
      event_time: payload.event_time,
      user_data: cleanObj({
        email_address: rawEventData.em,
        phone_number: rawEventData.ph,
        address: cleanObj({
          first_name: rawEventData.fn,
          last_name: rawEventData.ln,
          city: rawEventData.ct,
          region: rawEventData.st,
          postal_code: rawEventData.zp,
          country: rawEventData.country,
        }),
        // Advanced Matching Identifiers
        gender: rawEventData.ge,
        dob: rawEventData.db,
        external_id: rawEventData.external_id,
        fb_login_id: rawEventData.fb_login_id,
        fbc: rawEventData.fbc,
        fbp: rawEventData.fbp,
      }),
      match_data: cleanObj({
        em: payload.user_data?.em?.[0],
        ph: payload.user_data?.ph?.[0],
        fn: payload.user_data?.fn?.[0],
        ln: payload.user_data?.ln?.[0],
        ct: payload.user_data?.ct?.[0],
        st: payload.user_data?.st?.[0],
        zp: payload.user_data?.zp?.[0],
        country: payload.user_data?.country?.[0],
        external_id: payload.user_data?.external_id?.[0],
        ge: payload.user_data?.ge?.[0],
        db: payload.user_data?.db?.[0],
        fbp: payload.user_data?.fbp,
        fbc: payload.user_data?.fbc,
        fb_login_id: payload.user_data?.fb_login_id,
      }),
      items,
      contents: payload.custom_data?.contents?.map((item) =>
        cleanObj({
          id: item.id,
          quantity: item.quantity,
          item_price: item.item_price,
        })
      ),
      content_type:
        payload.custom_data?.content_type ||
        (isCommerceEvent ? "product" : undefined),
      content_ids: payload.custom_data?.content_ids,
      content_name: payload.custom_data?.content_name,
      content_category: payload.custom_data?.content_category,
      num_items: payload.custom_data?.num_items,
      value,
      currency,
      shipping: payload.custom_data?.shipping,
      shipping_tier: payload.custom_data?.shipping_tier,
      tax: payload.custom_data?.tax,
      discount_value: payload.custom_data?.discount_value,
      payment_method: payload.custom_data?.payment_method,
      payment_type: payload.custom_data?.payment_method,
      transaction_id,
      search_term: payload.custom_data?.search_string,
      coupon: payload.custom_data?.coupon,
      status: payload.custom_data?.status,
      order_id: payload.custom_data?.order_id,
      event_source_url: payload.event_source_url,
    }),
  };

  // GTM manages eventModel internally; its Data Layer Variables can lose
  // that value while Google tags process configuration and event commands.
  // Keep a separate copy for the Oneself container's variables.
  event.oneself_event = event.eventModel;
  return event;
};
