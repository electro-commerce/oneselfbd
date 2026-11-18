# Oneself GTM tracking

The production storefront uses the published web container `GTM-5DN7NRZL`. Set `NEXT_PUBLIC_FRONT_GTM_ID` before building the frontend and `GTM_ID` in the VPS environment. The exported web container fires its Google Tag on **Initialization**, before the GA4 event tags, and configures `server_container_url` as `https://tracking.oneselfbd.com` (without a trailing slash). The server container's GA4 client receives those requests. A GA4 server tag forwards them to Analytics, while the Facebook Conversions API tags send matching events to Meta once the Oneself credentials are installed. Verify browser requests reach the tracking domain; the URL appearing in the published GTM script alone does not establish that events use the server container.

## Landing page funnel

The Smart PIR Motion Sensor LED Bulb page uses the shared tracking handler and direct order API:

| Action | dataLayer event | GA4 event | Meta event |
| --- | --- | --- | --- |
| Page visit | `custom_page_view` | `page_view` | `PageView` |
| Product view | `view_content` | `view_item` | `ViewContent` |
| Name and valid phone entered | `initiate_checkout` | `begin_checkout` | `InitiateCheckout` |
| Address and delivery selected | `add_shipping_info` | `add_shipping_info` | — |
| Valid form submitted | `add_payment_info` | `add_payment_info` | `AddPaymentInfo` |
| Order API succeeds | `purchase` | `purchase` | `Purchase` |

The page intentionally has no cart event. The order hook sends payment information once for each selected payment method and product combination. Purchase is sent only after a successful order response, with its order ID, actual line items and variant IDs, item value after discount, currency, shipping, tax when present, coupon, and payment method.

Every event has one `event_id` shared by the web Meta Pixel tag and the GA4 request sent to the server container. The server Meta tag uses that ID for browser/server deduplication. The browser data layer holds raw customer data for Pixel advanced matching; the web GA4 tags send **SHA-256 matching values** as `meta_*` parameters instead of raw email, phone, or name. The server's `ED - User ...` variables read those parameters. The Stape server template recognizes hashes and avoids hashing them twice. Facebook click/browser tokens (`fbc`, `fbp`) remain unmodified. The server GA4 tag excludes the Meta matching parameters, browser tokens, and `event_id` from requests forwarded to Analytics.

Product data uses GA4 `ecommerce.items` (`item_id`, `price`, `quantity`, name, brand, category, variant). The web GA4 tags explicitly map `items`, `value`, and `currency` from the `ecommerce` object, following Google's documented alternative to the Send Ecommerce Data switch. Purchase also maps `transaction_id`, `coupon`, `shipping`, and `tax`; payment maps `payment_type`; shipping maps `shipping_tier`. The server Facebook template's automatic ecommerce mapping converts GA4 items to Meta `contents` (`id`, `item_price`, `quantity`) and derives name/category/type. Browser Pixel tags use `eventModel.contents` directly. Each GA4 tag stays within 25 event parameters.

The browser Pixel tags disable automatic history PageViews because the app emits its own `custom_page_view` on navigation. They also disable Meta's separate automated CAPI integration; the server GTM container is the CAPI sender. Both browser and server tags use the same `event_id` for deduplication.

## Apply the container changes

Both JSON exports in this folder contain the event and variable mappings. They must be imported into the corresponding GTM workspaces; the Docker containers do not read these JSON files:

- `GTM-5DN7NRZL_WEB_CONTAINER.json` into the **Oneself web** container. Verify the `GA4` measurement ID and `Meta Pixel ID` constant match the Oneself accounts. The `Google Tag` must fire on Initialization, with `server_container_url` set to `https://tracking.oneselfbd.com`.
- `GTM-WP3WDF7L_SERVER_CONTAINER.json` into the **Oneself server** container. Verify `FB - Pixel ID - REPLACE ME` and replace `FB - Access Token - REPLACE ME` with the real Oneself Meta CAPI token. The export intentionally contains an obvious token placeholder. `FB - Test Event Code` reads the unused event-data key `meta_test_event_code_disabled`, so production events have no test code. Ensure the server container URL is `https://tracking.oneselfbd.com`.

In each GTM container, use **Admin → Import Container → Merge → Overwrite conflicting items**. Review the import diff and check all account IDs and the Meta CAPI token before publishing. Importing is necessary because editing repository JSON does not update the remote GTM workspace. Publish the web and server containers after both are ready.

Use web and server Preview to verify one `event_id` on each browser/server event pair. First check browser Network: GA4 `/g/collect` requests must go to `tracking.oneselfbd.com`, not directly to `google-analytics.com`. In server Preview, confirm the GA4 client claims the request and both the GA4 and matching Meta tags fire. A successful order should show `begin_checkout`, `add_payment_info`, then `purchase` with the same `transaction_id`/order ID. The server URL's `/healthy` endpoint should return 200.

The old TechMela GA4, Pixel, and CAPI token values have not been copied. The server export now includes `GA4 - All Events`, firing only for the GA4 client and excluding Meta matching fields from Analytics forwarding.

The supplied TECHMELLA web and server exports were used as structural references. Their IDs, domain, test code, and access token were not copied. See [Google's container import guide](https://support.google.com/tagmanager/answer/6106997), [GA4 ecommerce guide](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm), and [server-side data guide](https://developers.google.com/tag-platform/tag-manager/server-side/send-data).

Run `node scripts/verify-gtm-containers.mjs` after changing either export. It checks the cross-container event contract, credential placeholders, trigger/variable references, GA4 forwarding exclusions, and the web GA4 parameter limit.
