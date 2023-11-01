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
      <pre>{JSON.stringify(users)}</pre>
    </div>
  );
}

export default App;
