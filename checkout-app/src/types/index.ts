export type CheckoutStep = "product" | "email" | "card" | "processing" | "success" | "error";

export type SessionParams = {
  productId: string;
  sessionId: string;
  parentOrigin: string;
};