import type { SessionParams } from "../types";

export function readSessionParams(): SessionParams | null {
  const url = new URL(window.location.href);
  const productId = url.searchParams.get("productId");
  const sessionId = url.searchParams.get("sessionId");
  const parentOrigin = url.searchParams.get("parentOrigin");

  if (!productId || !sessionId || !parentOrigin) return null;
  return { productId, sessionId, parentOrigin };
}