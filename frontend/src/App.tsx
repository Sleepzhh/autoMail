// frontend/src/App.tsx (React example)
import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message));
  }, []);

  return <div className="bg-amber-400">{message || "Loading..."}</div>;
}

export default App;
