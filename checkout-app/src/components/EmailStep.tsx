import { useState } from "react";

type Props = {
  onContinue: (email: string) => void;
  onBack: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailStep({ onContinue, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const isValid = EMAIL_RE.test(email);

  return (
    <div className="step">
      <button className="btn btn--ghost" onClick={onBack}>
        ← Back
      </button>
      <h2>Enter your email</h2>
      <input
        type="email"
        inputMode="email"
        autoFocus
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched(true)}
        className="input"
      />
      {touched && !isValid && <p className="field-error">Enter a valid email address.</p>}
      <button
        className="btn btn--primary"
        disabled={!isValid}
        onClick={() => onContinue(email)}
      >
        Continue
      </button>
    </div>
  );
}