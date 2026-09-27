type Props = {
  status: "success" | "error";
  email: string;
  errorMessage?: string;
  onClose: () => void;
};

export function ResultStep({ status, email, errorMessage, onClose }: Props) {
  if (status === "success") {
    return (
      <div className="step step--result">
        <div className="result-icon result-icon--success">✓</div>
        <h2>Payment successful</h2>
        <p>A receipt was sent to {email}.</p>
        <button className="btn btn--primary" onClick={onClose}>
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="step step--result">
      <div className="result-icon result-icon--error">✕</div>
      <h2>Something went wrong</h2>
      <p>{errorMessage ?? "The payment could not be completed."}</p>
      <button className="btn btn--primary" onClick={onClose}>
        Close
      </button>
    </div>
  );
}