import "./App.css";
import { useAppStore } from "./store";
import socket from "./rpc/manager";
import { useEffect } from "react";

function App() {
  const { accessToken } = useAppStore();

  useEffect(() => {
    socket.init();
  }, []);

  return (
    <div className="container">
      <pre>{JSON.stringify(accessToken)}</pre>
    </div>
  );
}

export default App;
