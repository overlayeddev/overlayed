import { useEffect, useRef } from "react";
import { fetch, Body } from '@tauri-apps/api/http';
import "./App.css";
import { useLocalStorage } from "@uidotdev/usehooks";
import WebSocket from "tauri-plugin-websocket-api";

interface TokenResponse {
  access_token: string;
}

const STREAM_KIT_APP_ID = "207646673902501888";
const WEBSOCKET_URL = "ws://127.0.0.1:6463";
function App() {
  const [accessToken, setAccesToken] = useLocalStorage<string | null>("accessToken", null);
  const socketRef = useRef<WebSocket>();

  async function setupSocket() {
    // we can use the local websocket server 
    const connectionUrl = `${WEBSOCKET_URL}/?v=1&client_id=${STREAM_KIT_APP_ID}`;
    socketRef.current = await WebSocket.connect(connectionUrl, {
      headers: {
        // we need to set the origin header to the discord streamkit domain
        origin: "https://streamkit.discord.com"
      }
    });

    // stable ref
    const ws = socketRef.current;

    // listen for messages
    ws.addListener(async (message) => {
      if (message.type !== "Text") return;

      const payload = JSON.parse(message.data.toString());

      // if we get a READY event, we can send the AUTHENTICATE command
      if (payload?.evt === "READY") {
        // if we have a token auth with that otherwise request one
        if (accessToken) {
          // send token
          socketRef.current?.send(JSON.stringify(
            {
              "cmd": "AUTHENTICATE",
              "args": { "access_token": accessToken },
              "nonce": "28955db0-ab2e-4bca-a3ae-c6d8701d8385"
            }
          ));
        } else {

          // test AUTHENTICATE
          ws.send(JSON.stringify({
            "nonce": "f48f6176-4afb-4c03-b1b8-d960861f5216",
            "args": {
              "client_id": STREAM_KIT_APP_ID,
              "scopes": ["rpc"]
            },
            "cmd": "AUTHORIZE"
          }))
        }

      }

      // get a token
      if (payload?.cmd === "AUTHORIZE" && !accessToken) {
        const { code } = payload.data;
        const res = await fetch<TokenResponse>("https://streamkit.discord.com/overlay/token", {
          method: "POST",
          body: Body.json({ code })
        });

        setAccesToken(res.data.access_token);
      };
      
      // log all messages
      console.log("payload", payload)

    });
  }

  useEffect(() => {
    setupSocket()
  }, [])

  return (
    <div className="container">
      hello

      {accessToken && <div>has token</div>}

    </div>
  );
}

export default App;
