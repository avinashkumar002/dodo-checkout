export {};

declare global {
  interface Window {
    DodoCheckout: {
      open: (options: {
        productId: string;
        onSuccess?: (result: { sessionId: string }) => void;
        onClose?: (result: { reason: "user_closed" | "success" | "error" }) => void;
        onError?: (result: { code: string; message: string }) => void;
      }) => void;
    };
  }
}