/**
 * DodoCheckout SDK
 * -----------------
 * Drop this file into any site. It exposes a single global: `DodoCheckout`.
 *
 * Usage:
 *   DodoCheckout.open({
 *     productId: "prod_123",
 *     onSuccess: ({ sessionId }) => {},
 *     onClose:   ({ reason }) => {},
 *     onError:   ({ code, message }) => {},
 *   });
 *
 * Design notes (see README for the full reasoning):
 * - The checkout runs in an iframe on CHECKOUT_ORIGIN, never on the host's origin.
 *   The host page cannot read card data or session internals — only the three
 *   callbacks below ever fire, and only with the shapes declared here.
 * - All postMessage traffic is validated against CHECKOUT_ORIGIN and against a
 *   per-session id, so a stray message (from another tab, another script, or a
 *   malicious iframe) can never trigger a callback.
 * - open() is idempotent while a checkout is already open: a second call is
 *   ignored rather than stacking iframes or double-charging the "network".
 * - A connect timeout guards against the iframe failing to load (bad network,
 *   ad blocker, etc.) so the host is never left waiting forever.
 */

export type DodoOpenOptions = {
  productId: string;
  onSuccess?: (result: { sessionId: string }) => void;
  onClose?: (result: { reason: "user_closed" | "success" | "error" }) => void;
  onError?: (result: { code: string; message: string }) => void;
};

// In a real deployment this would be the fixed origin of the hosted checkout app.
// Left overridable via a data-attribute on the script tag for local/dev testing.
const DEFAULT_CHECKOUT_ORIGIN = "https://checkout-app-iota-wheat.vercel.app";

type InboundMessage =
  | { type: "dodo:ready"; sessionId: string }
  | { type: "dodo:success"; sessionId: string }
  | { type: "dodo:closed"; sessionId: string; reason: "user_closed" | "success" | "error" }
  | { type: "dodo:error"; sessionId: string; code: string; message: string };

function isInboundMessage(data: unknown): data is InboundMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { type?: unknown }).type === "string" &&
    (data as { type: string }).type.startsWith("dodo:")
  );
}

class DodoCheckoutController {
  private checkoutOrigin: string;
  private connectTimeoutMs = 8000;

  private isOpen = false;
  private sessionId: string | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private connectTimer: number | null = null;
  private lastFocusedEl: HTMLElement | null = null;
  private currentCallbacks: DodoOpenOptions | null = null;
  private messageListener: ((e: MessageEvent) => void) | null = null;
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(checkoutOrigin: string) {
    this.checkoutOrigin = checkoutOrigin;
  }

  open(options: DodoOpenOptions): void {
    if (!options || !options.productId) {
      options?.onError?.({ code: "invalid_input", message: "productId is required." });
      return;
    }

    // Idempotency: ignore a second open() while one is already in flight.
    if (this.isOpen) {
      return;
    }

    this.isOpen = true;
    this.currentCallbacks = options;
    this.sessionId = `sess_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    this.lastFocusedEl = (document.activeElement as HTMLElement) || null;

    this.buildDom(options.productId);
    this.attachListeners();
    this.startConnectTimeout();
  }

  // ---- DOM ----

  private buildDom(productId: string): void {
    const overlay = document.createElement("div");
    overlay.setAttribute("data-dodo-checkout-overlay", "true");
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      background: "rgba(15, 15, 20, 0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "2147483647",
      opacity: "0",
      transition: "opacity 160ms ease",
    } as CSSStyleDeclaration);

    const frameWrap = document.createElement("div");
    Object.assign(frameWrap.style, {
      width: "min(420px, 92vw)",
      height: "min(640px, 92vh)",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
      transform: "translateY(8px) scale(0.98)",
      transition: "transform 200ms ease",
      background: "#0b0b0f",
    } as CSSStyleDeclaration);

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Checkout");
    iframe.setAttribute("allow", "payment");
    Object.assign(iframe.style, {
      width: "100%",
      height: "100%",
      border: "0",
      display: "block",
    } as CSSStyleDeclaration);

    const url = new URL(this.checkoutOrigin);
    url.searchParams.set("productId", productId);
    url.searchParams.set("sessionId", this.sessionId!);
    url.searchParams.set("parentOrigin", window.location.origin);
    iframe.src = url.toString();

    frameWrap.appendChild(iframe);
    overlay.appendChild(frameWrap);
    document.body.appendChild(overlay);

    // Click on the dimmed backdrop = user_closed (not on the frame itself).
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close("user_closed");
    });

    // Animate in on next frame.
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      frameWrap.style.transform = "translateY(0) scale(1)";
    });

    this.overlay = overlay;
    this.iframe = iframe;
  }

  private attachListeners(): void {
    this.messageListener = (e: MessageEvent) => this.handleMessage(e);
    window.addEventListener("message", this.messageListener);

    this.keydownListener = (e: KeyboardEvent) => {
      if (e.key === "Escape") this.close("user_closed");
    };
    window.addEventListener("keydown", this.keydownListener);
  }

  private startConnectTimeout(): void {
    this.connectTimer = window.setTimeout(() => {
      if (this.isOpen) {
        this.fail("connect_timeout", "The checkout didn't respond in time. Check your connection and try again.");
      }
    }, this.connectTimeoutMs);
  }

  // ---- Message handling ----

  private handleMessage(e: MessageEvent): void {
    if (e.origin !== this.checkoutOrigin) return; // reject anything not from the checkout app
    if (!isInboundMessage(e.data)) return;
    if (e.data.sessionId !== this.sessionId) return; // reject stale/foreign sessions

    switch (e.data.type) {
      case "dodo:ready":
        if (this.connectTimer !== null) {
          window.clearTimeout(this.connectTimer);
          this.connectTimer = null;
        }
        break;
      case "dodo:success":
        this.currentCallbacks?.onSuccess?.({ sessionId: e.data.sessionId });
        this.close("success");
        break;
      case "dodo:error":
        this.currentCallbacks?.onError?.({ code: e.data.code, message: e.data.message });
        // An error is reported but does not necessarily close the checkout —
        // the checkout app itself decides whether to let the user retry.
        break;
      case "dodo:closed":
        this.close(e.data.reason);
        break;
    }
  }

  private fail(code: string, message: string): void {
    this.currentCallbacks?.onError?.({ code, message });
    this.close("error");
  }

  // ---- Teardown ----

  private close(reason: "user_closed" | "success" | "error"): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.connectTimer !== null) {
      window.clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
    if (this.messageListener) window.removeEventListener("message", this.messageListener);
    if (this.keydownListener) window.removeEventListener("keydown", this.keydownListener);

    const overlay = this.overlay;
    if (overlay) {
      overlay.style.opacity = "0";
      window.setTimeout(() => overlay.remove(), 160);
    }

    this.currentCallbacks?.onClose?.({ reason });

    // Restore focus to whatever triggered the checkout, for keyboard users.
    this.lastFocusedEl?.focus?.();

    this.overlay = null;
    this.iframe = null;
    this.currentCallbacks = null;
    this.sessionId = null;
  }
}

function resolveCheckoutOrigin(): string {
  const currentScript = document.currentScript as HTMLScriptElement | null;
  const override = currentScript?.getAttribute("data-checkout-origin");
  return override || DEFAULT_CHECKOUT_ORIGIN;
}

const instance = new DodoCheckoutController(resolveCheckoutOrigin());

export const DodoCheckout = {
  open: (options: DodoOpenOptions) => instance.open(options),
};

// Expose as a global for plain <script> usage.
(window as unknown as { DodoCheckout: typeof DodoCheckout }).DodoCheckout = DodoCheckout;