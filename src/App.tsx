import "./App.css";
import { useAppStore } from "./store";
import socket from "./rpc/manager";
import { useEffect } from "react";

function App() {
  const { users } = useAppStore();

  useEffect(() => {
    socket.init();
  }, []);

  return (
    <div className="container">
      <pre>
        {Object.entries(users).map(([_k, item]) => (
          <div style={{ color: item.talking ? "green" : "white" }}>
            {item.username}
          </div>
        ))}
      </pre>
    </div>
  );
}

export default App;
