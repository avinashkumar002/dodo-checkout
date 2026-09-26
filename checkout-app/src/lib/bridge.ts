import type { SessionParams } from "../types";

type OutboundMessage =
  | { type: "dodo:ready"; sessionId: string }
  | { type: "dodo:success"; sessionId: string }
  | { type: "dodo:closed"; sessionId: string; reason: "user_closed" | "success" | "error" }
  | { type: "dodo:error"; sessionId: string; code: string; message: string };

/**
 * Sends a message to the parent window (the host page's SDK instance).
 * Always targets the exact parentOrigin passed in via the URL — never "*" —
 * so a compromised or unrelated page embedding this iframe can't intercept it.
 */
function send(session: SessionParams, message: OutboundMessage): void {
  window.parent.postMessage(message, session.parentOrigin);
}

export const bridge = {
  ready: (session: SessionParams) =>
    send(session, { type: "dodo:ready", sessionId: session.sessionId }),

  success: (session: SessionParams) =>
    send(session, { type: "dodo:success", sessionId: session.sessionId }),

  closed: (session: SessionParams, reason: "user_closed" | "success" | "error") =>
    send(session, { type: "dodo:closed", sessionId: session.sessionId, reason }),

  error: (session: SessionParams, code: string, message: string) =>
    send(session, { type: "dodo:error", sessionId: session.sessionId, code, message }),
};