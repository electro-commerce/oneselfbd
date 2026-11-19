# Clean Oneself GTM imports

Use these two new files with the **existing** GTM containers:

| GTM container | Import file |
| --- | --- |
| Web `GTM-5DN7NRZL` | `ONESELF_WEB_CLEAN_IMPORT.json` |
| Server `GTM-WP3WDF7L` | `ONESELF_SERVER_CLEAN_IMPORT.json` |

These are full container exports. In each container, choose **Admin → Import Container → Overwrite** and review the import diff. Overwrite replaces old tags, triggers, and variables; there is no need to delete them one by one. Import the server file first, then the web file, and publish both after checking the settings below. Do not import the TECHMELLA files; those contain different account IDs, a different domain, and different data layer paths.

## Check before publishing

1. In the server container, verify the server URL is `https://tracking.oneselfbd.com`, the GA4 client is active, and `GA4 - All Events` fires on `GA4 Client`.
2. Replace `FB - Access Token - REPLACE ME` with the real Oneself Meta CAPI access token. Verify `FB - Pixel ID - REPLACE ME` matches the web container's `Meta Pixel ID`. The access token in the JSON is deliberately a nonfunctional placeholder. Keep `FB - Test Event Code` without a test code for live events.
3. In the web container, verify `GA4` is the intended measurement ID and `Google Tag - GA4 (server-side transport)` fires on **Initialization - All Pages**. Its `server_container_url` setting uses `Const - Server Container URL` (`https://tracking.oneselfbd.com`). Each GA4 Event tag also uses it as a setup tag, so configuration runs before its event. The default page view is disabled because the app sends `custom_page_view`.
4. Keep the existing web GTM ID `GTM-5DN7NRZL` in the storefront. The server Docker containers continue to use the existing server container config; the JSON imports do not get read by Docker.

The web GA4 event tags use **Send Ecommerce Data**, as in the working TECHMELLA container. The app sends `ecommerce.items`, value, currency, order ID, shipping, tax, and coupon. Additional event parameters carry event ID/time/source URL, search term, payment type, shipping tier, content details, and hashed `meta_*` matching fields when available. The server CAPI tags map those events to Meta and use the same event ID as the web Pixel tags. The server GA4 forwarding tag excludes Meta matching fields before forwarding to Analytics. Pixel tags leave their separate automated CAPI option off because the server container owns CAPI delivery.

## Verify the published flow

Preview both containers, open a product page, and add a product to the cart. In browser Network, the GA4 `g/collect` request must go to `tracking.oneselfbd.com`. In web Tag Assistant, the Google Tag should fire at **Initialization**; the `view_item` and `add_to_cart` GA4 tags should send hits. In server Preview, the GA4 client should claim each request, then `GA4 - All Events` and the matching Meta CAPI tag should fire. A web tag reporting “Succeeded” alone does not prove it reached the server container.

The first published import fired the Google Tag on Initialization with the correct URL, yet a clean browser still sent `g/collect` to `google-analytics.com`. This revised web file explicitly sequences the Google Tag before every GA4 Event tag. Re-import the revised **web** file and publish it to test this change; the server file is unchanged. If browser requests still go directly to Google, inspect the GA4 hit destination and effective Google Tag configuration in Tag Assistant before changing the server container. A healthy `/healthy` endpoint confirms the server is reachable, but does not prove that web hits are routed to it.

Sources: [Google container import](https://support.google.com/tagmanager/answer/6106997), [Google server-side data flow](https://developers.google.com/tag-platform/tag-manager/server-side/send-data?option=GTM).
