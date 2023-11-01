import { useEffect, useRef, useState } from "react";
import { fetch, Body } from '@tauri-apps/api/http';
import "./App.css";
import { useLocalStorage } from "@uidotdev/usehooks";
import WebSocket from "tauri-plugin-websocket-api";
import { v4 as uuid } from "uuid";

interface TokenResponse {
  access_token: string;
}

const STREAM_KIT_APP_ID = "207646673902501888";
const WEBSOCKET_URL = "ws://127.0.0.1:6463";
function App() {
  const [accessToken, setAccesToken] = useLocalStorage<string | null>("accessToken", null);
  const [currentChannel, setCurrentChannel] = useState<any>(null);
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
              "nonce": uuid()
            }
          ));
        } else {

          // test AUTHENTICATE
          ws.send(JSON.stringify({
            "nonce": uuid(),
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

      if (payload?.cmd === "AUTHENTICATE") {
        // we are ready to do things
        ws.send(JSON.stringify({
          cmd: "GET_SELECTED_VOICE_CHANNEL",
          nonce: uuid()
        }))

        ws.send(JSON.stringify({
          cmd: "SUBSCRIBE",
          args: {},
          evt: "VOICE_CHANNEL_SELECT",
          nonce: uuid()
        }));

      }

      if (payload.evt === "VOICE_CHANNEL_SELECT") {
        setCurrentChannel(payload.data)
      }

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

      <pre>{JSON.stringify(currentChannel, null, 2)}</pre>
    </div>
  );
}

export default App;
