import { useState } from "react";
import { chargeCard } from "../lib/fakePayment";

type Props = {
  onSuccess: () => void;
  onBack: () => void;
  onFatalError: (message: string) => void;
};

type Phase = "idle" | "processing" | "error";

export function CardStep({ onSuccess, onBack, onFatalError }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(true);

  const isValidLength = cardNumber.replace(/\s+/g, "").length === 16;

  async function handlePay() {
    if (phase === "processing") return;

    setPhase("processing");
    setErrorMsg(null);

    const result = await chargeCard(cardNumber);

    if (result.ok) {
      onSuccess();
      return;
    }

    if (!result.canRetry) {
      onFatalError(result.message);
      return;
    }

    setPhase("error");
    setErrorMsg(result.message);
    setCanRetry(result.canRetry);
  }

  return (
    <div className="step">
      <button className="btn btn--ghost" onClick={onBack} disabled={phase === "processing"}>
        ← Back
      </button>
      <h2>Card details</h2>
      <input
        type="text"
        inputMode="numeric"
        placeholder="4242 4242 4242 4242"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        disabled={phase === "processing"}
        className="input"
        maxLength={19}
      />

      {phase === "error" && errorMsg && <p className="field-error">{errorMsg} You can try again.</p>}

      <button
        className="btn btn--primary"
        disabled={!isValidLength || phase === "processing"}
        onClick={handlePay}
      >
        {phase === "processing" ? "Processing…" : "Pay"}
      </button>
    </div>
  );
}