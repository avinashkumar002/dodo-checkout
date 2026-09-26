import { useEffect, useState } from "react";
import { readSessionParams } from "./lib/session";
import { bridge } from "./lib/bridge";
import { getProduct } from "./lib/products";
import { ProductStep } from "./components/ProductStep";
import { EmailStep } from "./components/EmailStep";
import { CardStep } from "./components/CardStep";
import type { SessionParams, CheckoutStep } from "./types";
import "./index.css";

function App() {
  const [session, setSession] = useState<SessionParams | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("product");
  const [email, setEmail] = useState("");

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

  const product = getProduct(session.productId);

  if (!product) {
    return (
      <div className="checkout-shell checkout-shell--error">
        <p>Unknown product.</p>
      </div>
    );
  }

  return (
    <div className="checkout-shell">
      {step === "product" && (
        <ProductStep product={product} onContinue={() => setStep("email")} />
      )}
      {step === "email" && (
        <EmailStep
          onBack={() => setStep("product")}
          onContinue={(value) => {
            setEmail(value);
            setStep("card");
          }}
        />
      )}
      {step === "card" && (
        <CardStep
          onBack={() => setStep("email")}
          onSuccess={() => {
            bridge.success(session);
            setStep("success");
          }}
        />
      )}
      {step === "success" && <p>Payment successful for {email}. 🎉</p>}
    </div>
  );
}

export default App;