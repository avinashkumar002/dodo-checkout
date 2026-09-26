export type PaymentResult =
  | { ok: true }
  | { ok: false; code: string; message: string; canRetry: boolean };

const CARD_SUCCESS = "4242424242424242";
const CARD_DECLINE = "4000000000000002";
const CARD_FAIL_THEN_SUCCEED = "4000000000000341";

// Tracks cards that have already failed once, so a retry with the same
// number succeeds — simulates a transient-failure-then-idempotent-retry.
const failedOnce = new Set<string>();

function normalize(cardNumber: string): string {
  return cardNumber.replace(/\s+/g, "");
}

export async function chargeCard(cardNumber: string): Promise<PaymentResult> {
  const number = normalize(cardNumber);

  // Simulate network latency.
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (number === CARD_SUCCESS) {
    return { ok: true };
  }

  if (number === CARD_DECLINE) {
    return {
      ok: false,
      code: "card_declined",
      message: "Your card was declined.",
      canRetry: false, // a genuine decline — retrying the same card won't help
    };
  }

  if (number === CARD_FAIL_THEN_SUCCEED) {
    if (failedOnce.has(number)) {
      failedOnce.delete(number);
      return { ok: true };
    }
    failedOnce.add(number);
    return {
      ok: false,
      code: "processing_error",
      message: "Something went wrong on our end. Please try again.",
      canRetry: true,
    };
  }

  return {
    ok: false,
    code: "invalid_card",
    message: "Enter one of the test card numbers.",
    canRetry: true,
  };
}