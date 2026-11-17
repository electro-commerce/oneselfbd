# Oneself GTM tracking

The storefront loads GTM only when `NEXT_PUBLIC_FRONT_GTM_ID` is set. The exported web template routes GA4 event requests to `https://tracking.oneselfbd.com`, where the GA4 client in the exported server template receives them. Server Facebook Conversions API tags send matching events to Meta once the Oneself credentials are installed. The currently published `GTM-N4LB4ZLQ` script still points at TechMela and must not be used for Oneself checkout traffic.

## Landing page funnel

The Smart PIR Motion Sensor LED Bulb page uses the shared tracking handler and direct order API:

| Action | dataLayer event | GA4 event | Meta event |
| --- | --- | --- | --- |
| Page visit | `custom_page_view` | `page_view` | `PageView` |
| Product view | `view_content` | `view_item` | `ViewContent` |
| Name and valid phone entered | `initiate_checkout` | `begin_checkout` | `InitiateCheckout` |
| Valid form submitted | `add_payment_info` | `add_payment_info` | `AddPaymentInfo` |
| Order API succeeds | `purchase` | `purchase` | `Purchase` |

The page intentionally has no cart event. The order hook sends payment information once for each selected payment method and product combination. Purchase is sent only after a successful order response, with its order ID, actual line items and variant IDs, item value after discount, currency, shipping, tax when present, coupon, and payment method.

Every event has one `event_id` shared by the web Meta Pixel tag and the GA4 request forwarded to the server container. The server Meta tag uses that ID for browser/server deduplication. The browser data layer holds raw customer data for Pixel advanced matching; the web GA4 tags forward **SHA-256 matching values** as `meta_*` parameters instead of raw email, phone, or name. The server's `ED - User ...` variables read those parameters. The Stape server template recognizes hashes and avoids hashing them twice. Facebook click/browser tokens (`fbc`, `fbp`) remain unmodified.

Product data uses GA4 `ecommerce.items` (`item_id`, `price`, `quantity`, name, brand, category, variant). The server Facebook template's automatic ecommerce mapping converts these to Meta `contents` (`id`, `item_price`, `quantity`). Browser Pixel tags use `eventModel.contents` directly. `value`, `currency`, `content_ids`, `content_type`, `num_items`, `shipping`, `tax`, `discount_value`, `coupon`, `payment_method`, `order_id`, `event_time`, `event_source_url`, and customer matching fields are mapped in the exported templates.

## Apply the container changes

Both JSON exports in the repository contain the event and variable mappings. They need Oneself account credentials before they can be published:

- `gtm-web-container-template.json` into the **Oneself web** container. Set the `GA4` measurement ID and `Meta Pixel =` constant to Oneself IDs.
- `gtm-server-container-template.json` into the **Oneself server** container. Set the `FB - Pixel ID - REPLACE ME` and `FB - Access Token - REPLACE ME` constants to Oneself credentials. Ensure the server URL is `https://tracking.oneselfbd.com` and points to this server container. Set `NEXT_PUBLIC_FRONT_GTM_ID` in the storefront to the published Oneself web container ID.

In each GTM container, use **Admin → Import Container → Merge → Overwrite conflicting items**, review the diff, then publish. Importing is necessary because editing repository JSON does not update the remote GTM workspace. The server's test event code is blank in the template so production events are not routed to Meta Test Events.

Use web and server Preview to verify one `event_id` on each browser/server event pair. A successful order should show `begin_checkout`, `add_payment_info`, then `purchase` with the same `transaction_id`/order ID in GA4 and the corresponding Meta events in both containers. The server URL's `/healthy` endpoint should return 200.

The old TechMela GA4, Pixel, and CAPI token values have been removed from these templates. The server template has Meta CAPI tags but no server-side GA4 forwarding tag; GA4 event requests reach the container, while GA4 reporting requires a GA4 server tag in the remote workspace.
