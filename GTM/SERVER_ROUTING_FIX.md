# Server event routing fix

On 2026-11-23, a clean Chrome visit to `https://oneselfbd.com/` loaded web
container `GTM-5DN7NRZL` but sent GA4 page views to
`www.google-analytics.com/g/collect`. No GA4 request reached the tagging domain.
Both tagging and preview `/healthy` endpoints returned 200, and the supplied
preview-header curl returned 200. This isolates the observed failure to the
browser-to-server path; those responses do not establish downstream tag success.

The published web container already contained the clean import's Google Tag
configuration and event setup sequencing, while browser hits still went directly
to Google. Queuing `gtag('set', ...)` before GTM initialization
sent browser hits to `tracking.oneselfbd.com` instead.

The live app also pushed a complete `eventModel`, while GTM's Data Layer Variables
returned that namespace as undefined. The revised app retains `eventModel` for
compatibility and adds the same data under `oneself_event`, which GTM does not
manage internally. The new web import reads that field and preserves explicit
GA4 ecommerce parameters, hashed Meta matching fields, and browser/server event
IDs. It also sequences the Google Tag before each GA4 event. Its variable display
names remain unchanged so existing tag references resolve.

## Apply

1. Deploy the updated storefront. Its `beforeInteractive` script queues the
   transport URL and disables the automatic page view before GTM loads.
   For another deployment, set `NEXT_PUBLIC_FRONT_GTM_SERVER_URL` to that
   deployment's tagging URL **before building**. The default is
   `https://tracking.oneselfbd.com`. Keep `NEXT_PUBLIC_FRONT_GTM_ID` set to the
   intended web container.
2. Import the full `ONESELF_WEB_SERVER_ROUTING_FIX.json` into web container
   `GTM-5DN7NRZL` using **Admin → Import Container → Overwrite**. Review the import
   diff, Google measurement ID, and Meta Pixel ID, then publish the web container. Deploying
   the app before importing also keeps the previous exports compatible.
3. Keep the existing server container and Docker configuration. This fix does
   not require a new server export. The server's GA4 client must still claim
   `/g/collect`; Meta CAPI needs a real access token, because the repository
   server exports contain `REPLACE_WITH_META_CAPI_ACCESS_TOKEN`.

## Verify

The storefront type check and focused ESLint checks passed, along with both
container contract checks and two regression tests. A browser simulation used
the revised bootstrap, payload namespace, and container event parameters against
the live tagging endpoint. It sent `page_view`, `view_item`, and `add_to_cart`
with HTTP 200 responses; event IDs, item ID, quantity 2, price 250, value 500 BDT,
and hashed matching data were preserved. The capture included Google's service
worker, which sends later hits outside the page's own network session. This
verifies the prepared browser-to-server flow; the actual storefront deployment,
GTM publication, and outgoing GA4/Meta tag success still need live verification.

Open web and server Preview in the same browser, then visit a product page.
Browser Network must show `/g/collect` going to `tracking.oneselfbd.com` with
`tid=G-XXFGJETYXG`. Server Preview should show the GA4 client claiming `page_view`
and `view_item`, with `GA4 - All Events` and the corresponding Meta tag firing.
Check the event ID and ecommerce items in server Event Data; a 200 response
alone does not prove forwarding to GA4 or Meta succeeded.

Run both repository contract checks:

```sh
node scripts/verify-gtm-containers.mjs
node scripts/verify-gtm-containers.mjs GTM/ONESELF_WEB_SERVER_ROUTING_FIX.json
node --test tests/gtm-server-routing.test.mjs
```

References: [Google tag parameter scope and `set`](https://developers.google.com/tag-platform/gtagjs/reference),
[server-side routing](https://developers.google.com/tag-platform/tag-manager/server-side/send-data?option=GTM),
[server Preview verification](https://developers.google.com/tag-platform/tag-manager/server-side/debug).
