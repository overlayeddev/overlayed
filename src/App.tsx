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
      <div data-tauri-drag-region className="titlebar">
        Title
      </div>
      <pre>
        {Object.entries(users).map(([_k, item]) => (
          <div style={{ display: "flex" }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "black",
                borderRadius: 40,
                border: "3px solid #fff",
                borderColor: item.talking ? "limegreen" : "white",
              }}
            ></div>

            <div>{item.username}</div>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default App;
