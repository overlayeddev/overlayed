import { RPCCommand } from "./command";
import { fetch, Body } from "@tauri-apps/api/http";
import { RPCEvent } from "./event";
import * as uuid from "uuid";
import WebSocket, { Message } from "tauri-plugin-websocket-api";
import { AppActions, AppState, useAppStore as appStore } from "../store";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useEffect, useState } from "react";

interface TokenResponse {
  access_token: string;
}

// create a thin wrapper around local storage to save and load an access token
class TokenStore {
  private store = window.localStorage;
  private key = "discord_access_token";

  get accessToken() {
    return this.store.getItem(this.key);
  }

  setAccessToken(token: string) {
    this.store.setItem(this.key, token);
  }

  removeAccessToken() {
    this.store.removeItem(this.key);
  }
}

/**
 * Collection of events that are needed to sub to for voice states
 */
const SUBSCRIBABLE_EVENTS = [
  RPCEvent.SPEAKING_START,
  RPCEvent.SPEAKING_STOP,
  RPCEvent.VOICE_STATE_CREATE,
  RPCEvent.VOICE_STATE_DELETE,
  RPCEvent.VOICE_STATE_UPDATE,
];

const STREAM_KIT_APP_ID = "207646673902501888";
const WEBSOCKET_URL = "ws://127.0.0.1:6463";
const STREAMKIT_URL = "https://streamkit.discord.com";

interface DiscordPayload {
  cmd: `${RPCCommand}`;
  // TODO: how do i type this properly?
  args?: any;
  data?: any;
  evt?: `${RPCEvent}` | null;
  nonce?: string;
}

/**
 * A generic manager the socket
 */
class SocketManager {
  public socket: WebSocket | null = null;
  public currentChannelId = null;
  public tokenStore: TokenStore | null = null;
  public navigate: NavigateFunction | null = null;
  public isConnected = false;

  /**
   * Setup the websocket connection and listen for messages
   */
  async init(navigate: NavigateFunction) {
    this.disconnect();

    this.tokenStore = new TokenStore();
    this.navigate = navigate;

    const connectionUrl = `${WEBSOCKET_URL}/?v=1&client_id=${STREAM_KIT_APP_ID}`;
    try {
      this.socket = await WebSocket.connect(connectionUrl, {
        headers: {
          // we need to set the origin header to the discord streamkit domain
          origin: STREAMKIT_URL,
        },
      });

      this.isConnected = true;

      this.socket.addListener(this.onMessage.bind(this));
    } catch (e) {
      console.log(e);
      this.isConnected = false;
      this.navigate?.("/error");
    }
  }

  public disconnect() {
    this.socket?.disconnect();
    this.isConnected = false;
  }

  // we have to call the store to get the latest values
  private get store(): AppState & AppActions {
    return appStore.getState();
  }

  /**
   * Authenticate with discord by having the user approve the app
   */
  private authenticate() {
    this.send({
      args: {
        client_id: STREAM_KIT_APP_ID,
        scopes: ["rpc", "identify"],
      },
      cmd: RPCCommand.AUTHORIZE,
    });
  }

  private login(accessToken: string) {
    this.send({
      cmd: RPCCommand.AUTHENTICATE,
      args: { access_token: accessToken },
    });
  }

  /**
   * Message listener when we get message from discord
   * @param payload a JSON object of the parsed message
   */
  private async onMessage(event: Message) {
    // TODO: this has to be a bug in the upstream lib, we should get a proper code
    // and not have to check the raw dawg string to see if something is wrong
    if (
      typeof event === "string" &&
      (event as string).includes("Connection reset without closing handshake")
    ) {
      this.navigate?.("/error");
    }

    // TODO: does this ever happen?
    if (event.type === "Close") this.navigate?.("/error");

    if (event.type !== "Text") {
      return;
    }

    const payload: DiscordPayload = JSON.parse(event.data);

    // console.log(payload);
    // either the token is good and valid and we can login otherwise prompt them approve
    if (payload.evt === RPCEvent.READY) {
      const acessToken = this.tokenStore?.accessToken;
      if (acessToken) {
        this.login(acessToken);
      } else {
        this.authenticate();
      }
    }

    if (payload.evt === RPCEvent.VOICE_STATE_DELETE) {
      // if its my user clear the channel
      if (payload.data.user.id === this.store.me?.id) {
        this.store.clearUsers();
      }

      this.store.removeUser(payload.data.user.id);
    }

    if (payload.evt === RPCEvent.VOICE_STATE_CREATE) {
      this.store.addUser(payload.data);
    }

    if (payload.evt === RPCEvent.VOICE_STATE_UPDATE) {
      this.store.updateUser(payload.data);
    }

    // VOICE_CHANNEL_SELECT	sent when the client joins a voice channel
    if (payload.evt === RPCEvent.VOICE_CHANNEL_SELECT) {
      if (payload.data.channel_id === null) {
        this.store.clearUsers();

        if (this.store.currentChannel) {
          console.log("unsub from channel", this.store.currentChannel);
          this.channelEvents(RPCCommand.UNSUBSCRIBE, this.store.currentChannel);
        }

        // after unsub we clear the channel
        this.store.setCurrentChannel(null);
      }

      // try to find the user
      this.requestUserChannel();

      this.store.setCurrentChannel(payload.data.channel_id);
      if (payload.data?.channel_id) {
        this.send({
          cmd: RPCCommand.GET_CHANNEL,
          args: {
            channel_id: payload.data.channel_id,
          },
        });
      }
    }

    // we got a token back from discord let's fetch an access token
    if (payload.cmd === RPCCommand.AUTHORIZE) {
      const { code } = payload.data;
      const res = await fetch<TokenResponse>(`${STREAMKIT_URL}/overlay/token`, {
        method: "POST",
        body: Body.json({ code }),
      });

      // we need send the token to discord
      this.tokenStore?.setAccessToken(res.data.access_token);

      // login with the token
      this.login(res.data.access_token);
    }

    // GET_SELECTED_VOICE_CHANNEL	used to get the current voice channel the client is in
    if (payload.cmd === RPCCommand.GET_SELECTED_VOICE_CHANNEL) {
      if (payload.data?.id) {
        // sub to channel events
        this.channelEvents(RPCCommand.SUBSCRIBE, payload.data.id);
        // set all the user in the channel
        this.store.setUsers(payload.data.voice_states);
        console.log(payload.data.voice_states)

        this.store.setCurrentChannel(payload.data.id);
      }
    }

    // we are ready to do things cause we are fully authed
    if (
      payload.cmd === RPCCommand.AUTHENTICATE &&
      payload.evt === RPCEvent.ERROR
    ) {
      if (payload.data.code === 5000) {
      }

      if (payload.data.code === 4009) {
        this.tokenStore?.removeAccessToken();
      }

      // TODO: handle saving the last error message(s) so we can display then on the error view

      this.navigate?.("/error");
    } else if (payload?.cmd === RPCCommand.AUTHENTICATE) {
      // try to find the user
      this.requestUserChannel();

      // subscribe to get notified when the user changes channels
      this.send({
        cmd: RPCCommand.SUBSCRIBE,
        evt: RPCEvent.VOICE_CHANNEL_SELECT,
      });

      this.store.setMe(payload.data.user);

      // move the view to /channel
      this.navigate?.("/channel");
    }

    if (
      payload.evt === RPCEvent.SPEAKING_START ||
      payload.evt === RPCEvent.SPEAKING_STOP
    ) {
      const isSpeaking = payload.evt !== RPCEvent.SPEAKING_START;
      this.store.setTalking(payload.data.user_id, !isSpeaking);
    }

    // when we move channels we get a new list of users
    if (payload.cmd === RPCCommand.GET_CHANNEL) {
      this.requestUserChannel();
    }
  }

  /**
   * Request to get the current channel the user is in
   * The client will respond with the GET_SELECTED_VOICE_CHANNEL event
   *
   */
  private requestUserChannel() {
    this.send({
      cmd: RPCCommand.GET_SELECTED_VOICE_CHANNEL,
    });
  }

  /**
   * Send a message to discord
   * @param payload {DiscordPayload} the payload to send
   */
  private send(payload: DiscordPayload) {
    this.socket?.send(
      JSON.stringify({
        ...payload,
        nonce: uuid.v4(),
      }),
    );
  }

  /**
   * These method will allow you to sub/unsub to channel events
   * that are defined in SUBSCRIBABLE_EVENTS
   * @param cmd {RPCCommand} SUBSCRIBE or SUBSCRIBE
   * @param channelId The channel to subscribe to events in
   */
  channelEvents(
    cmd: RPCCommand.SUBSCRIBE | RPCCommand.UNSUBSCRIBE,
    channelId: string,
  ) {
    SUBSCRIBABLE_EVENTS.forEach((eventName) =>
      this.send({
        cmd,
        args: { channel_id: channelId },
        evt: eventName,
        nonce: uuid.v4(),
      }),
    );
  }
}

// hook to get the socket SocketManager
export const useSocket = () => {
  const navigate = useNavigate();
  //TODO: should this be a ref instead?
  const [socket, setSocket] = useState<SocketManager | null>(null);

  useEffect(() => {
    console.log("Initializing websocket...");
    const socketManager = new SocketManager();
    socketManager.init(navigate);
    setSocket(socketManager);
  }, []);

  return socket;
};
