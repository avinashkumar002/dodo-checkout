import { useEffect, useState } from "react";
import { readSessionParams } from "./lib/session";
import { bridge } from "./lib/bridge";
import type { SessionParams, CheckoutStep } from "./types";
import "./index.css";

function App() {
  const [session, setSession] = useState<SessionParams | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("product");

  useEffect(() => {
    const parsed = readSessionParams();
    if (!parsed) {
      setInvalid(true);
      return;
    }
    setSession(parsed);
    bridge.ready(parsed);
  }, []);

  if (invalid) {
    return (
      <div className="checkout-shell checkout-shell--error">
        <p>This checkout can't be opened directly. Please start from the store.</p>
      </div>
    );
  }

  if (!session) {
    return <div className="checkout-shell checkout-shell--loading">Loading…</div>;
  }

  return (
    <div className="checkout-shell">
      {step === "product" && <p>Product: {session.productId}</p>}
      {/* ProductStep / EmailStep / CardStep / ResultStep wired in next steps */}
    </div>
  );
}

export default App;