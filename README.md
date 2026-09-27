# Dodo Checkout

A tiny embeddable checkout: a script any site can drop in, a hosted checkout
app that opens in an overlay, and a demo store to try it.

## Live links
- Demo: https://demo-site-gamma-lyart.vercel.app
- Checkout app (opened by the SDK, not meant to be visited directly): https://checkout-app-iota-wheat.vercel.app

## How it's structured
- `sdk/` — plain TypeScript, no framework. Builds to a single IIFE script
  (`dist/dodo-checkout.global.js`) that exposes `window.DodoCheckout.open(...)`.
- `checkout-app/` — React + TS. The actual product → email → card → pay flow.
  Runs entirely client-side; payment is faked (see test cards below).
- `demo-site/` — React + TS. A pretend store with a Buy button and a live log
  of every callback the SDK fires.

## How the pieces talk to each other
The SDK never lets the host page touch card data. When `DodoCheckout.open()`
is called, the SDK opens the checkout app in an iframe on its own origin,
overlaid on the page. From there:

- The checkout app reads `productId`, a generated `sessionId`, and the host's
  `parentOrigin` from its URL query string.
- It sends `postMessage` events back to the parent — `dodo:ready`,
  `dodo:success`, `dodo:error`, `dodo:closed` — always targeted at the exact
  `parentOrigin`, never `"*"`.
- The SDK only accepts messages whose `event.origin` matches the checkout
  app's real origin and whose `sessionId` matches the session it opened —
  anything else is silently ignored.
- On `dodo:success`/`dodo:closed`, the SDK tears down the iframe and fires
  the host's `onSuccess`/`onClose`/`onError` callbacks. That's the entire
  API surface the host page ever sees.

## Running it locally
```bash
# SDK
cd sdk && npm install && npm run build

# Checkout app
cd checkout-app && npm install && npm run dev   # localhost:5173

# Demo site
cd demo-site && npm install && npm run dev      # localhost:5174
```
For local testing, point the demo site's SDK script tag at
`data-checkout-origin="http://localhost:5173"` instead of the deployed URL.

## Test cards
- `4242 4242 4242 4242` — succeeds
- `4000 0000 0000 0002` — declines (no retry offered)
- `4000 0000 0000 0341` — fails once, then succeeds on retrying the same card

## Two decisions I went back and forth on
1. **iframe vs. a same-origin injected form.** An injected form would've been
   less code, but it means the host page's JS shares a document with the
   card fields — one bad host script and card data is reachable. The iframe
   costs a bit more plumbing (the whole postMessage protocol) but is the only
   way to make "card details never touch the host page" actually true rather
   than just true in the happy path.
2. **Auto-retry vs. surfaced failure on the "fails once" card.** A silent
   auto-retry would look smoother in a demo, but it also means the customer
   never learns a charge attempt failed — which breaks trust the moment a
   real transient failure isn't the scripted one-time kind. I chose to show
   the failure honestly and let the customer click Pay again.

## What I'd explore next
- Real focus trapping inside the iframe overlay (currently Escape/backdrop-
  click work, but Tab doesn't loop within the modal).
- A visible "connecting…" state on the host side between `open()` and the
  iframe's `dodo:ready` signal, instead of a blank pause.
- Loading skeleton for the product step instead of an instant render (masks
  the product lookup as if it were a real API call).
- Configurable theming via a small, explicit prop (not open-ended CSS
  injection) — kept out for now to keep the API surface minimal.
