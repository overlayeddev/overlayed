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
      <div data-tauri-drag-region className="bg-black text-white">overlayed</div>
        {Object.entries(users).map(([_k, item]) => (
          <div className="flex items-center">
            <div
              className="rounded-full bg-black w-8 h-8 border-2 border-slate-800"
              style={{
                borderColor: item.talking ? "limegreen" : "inherit",
              }}
            />

            <div className="text-white">{item.username}</div>
          </div>
        ))}
    </div>
  );
}

export default App;
