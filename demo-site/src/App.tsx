import { useState } from "react";
import "./index.css";

type LogEntry = { time: string; message: string };

function App() {
  const [log, setLog] = useState<LogEntry[]>([]);

  function addLog(message: string) {
    setLog((prev) => [{ time: new Date().toLocaleTimeString(), message }, ...prev]);
  }

  function handleBuy() {
    addLog("Buy clicked → opening checkout");
    window.DodoCheckout.open({
      productId: "prod_123",
      onSuccess: ({ sessionId }) => addLog(`onSuccess: sessionId=${sessionId}`),
      onClose: ({ reason }) => addLog(`onClose: reason=${reason}`),
      onError: ({ code, message }) => addLog(`onError: code=${code} message=${message}`),
    });
  }

  return (
    <div className="demo-shell">
      <h1>Acme Store</h1>
      <div className="demo-product">
        <p>Wireless Keyboard — $49.00</p>
        <button className="btn btn--primary" onClick={handleBuy}>
          Buy
        </button>
      </div>

      <h2>Callback log</h2>
      <ul className="demo-log">
        {log.map((entry, i) => (
          <li key={i}>
            <span className="demo-log__time">{entry.time}</span> {entry.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;