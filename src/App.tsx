import { useAppStore } from "./store";
import socket from "./rpc/manager";
import { useEffect } from "react";
import { appWindow } from "@tauri-apps/api/window";
import { User } from "./user";

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
        className="cursor-default rounded-t-md font-bold select-none p-2 bg-zinc-900 text-white"
      >
        overlayed
      </div>
      <div className="py-2">
        {Object.entries(users).map(([_k, item]) => (
          <User key={item.id} item={item} />
        ))}
      </div>
      {/* <pre className="text-white">{JSON.stringify({ currentChannel }, null, 2)}</pre> */}
    </div>
  );
}

export default App;
