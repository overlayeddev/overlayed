import { useAppStore } from "./store";
import socket from "./rpc/manager";
import { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";

function App() {
  const { users } = useAppStore();

  useEffect(() => {
    socket.init();
    appWindow.setAlwaysOnTop(true);
  }, []);

  return (
    <div className="container">
      <div
        data-tauri-drag-region
        className="cursor-default select-none p-2 bg-black text-white"
      >
        overlayed
      </div>
      <div className="py-2">
        {Object.entries(users).map(([_k, item]) => (
          <div key={item.id} className="flex py-1 items-center">
            <div
              className="rounded-full bg-black w-8 h-8 border-2 border-slate-800 mr-2"
              style={{
                borderColor: item.talking ? "limegreen" : "inherit",
              }}
            />

            <div className="text-white">{item.username}</div>
          </div>
        ))}
      </div>
      <pre className="text-white">
        {/* {JSON.stringify({ currentChannel, users }, null, 2)} */}
      </pre>
    </div>
  );
}

export default App;
