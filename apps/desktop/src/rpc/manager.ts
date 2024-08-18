import { RPCCommand } from "./command";
import { fetch } from "@tauri-apps/plugin-http";
import { type } from "@tauri-apps/plugin-os";
import { RPCEvent } from "./event";
import * as uuid from "uuid";
import WebSocket from "@tauri-apps/plugin-websocket";
import type { Message } from "@tauri-apps/plugin-websocket";
import { useAppStore as appStore, createUserStateItem } from "../store";
import type { AppActions, AppState } from "../store";
import { useNavigate, type NavigateFunction, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { RPCErrors } from "./errors";
import { Metric, track, trackEvent } from "@/metrics";
import { emit } from "@tauri-apps/api/event";
import { Event } from "@/constants";
import type { VoiceUser } from "@/types";
import { getVersion } from "@tauri-apps/api/app";
import { hash } from "@/utils/crypto";
import { invoke } from "@tauri-apps/api/core";

interface TokenResponse {
  access_token: string;
}

// create a thin wrapper around local storage to save and load an access token
class UserdataStore {
  private store = window.localStorage;

  private keys = {
    accessToken: "discord_access_token",
    accessTokenExpiry: "discord_access_token_expiry",
    userData: "user_data",
  } as const;

  get accessToken() {
    return this.store.getItem(this.keys.accessToken);
  }

  setAccessToken(token: string) {
    this.store.setItem(this.keys.accessToken, token);
  }

  setAccessTokenExpiry(dateString: string) {
    this.store.setItem(this.keys.accessTokenExpiry, dateString);
  }

  setUserdata(userdata: VoiceUser) {
    this.store.setItem(this.keys.userData, JSON.stringify(userdata));
  }

  removeAccessToken() {
    this.store.removeItem(this.keys.accessToken);
    this.store.removeItem(this.keys.accessTokenExpiry);
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

export const APP_ID = "905987126099836938";
const WEBSOCKET_URL = "ws://127.0.0.1:6463";
const API_URL = "https://api.overlayed.dev";

interface DiscordPayload {
  cmd: `${RPCCommand}`;
  // TODO: how do i type this properly?
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // TODO: move this so we can use it in settings too
  public userdataStore: UserdataStore = new UserdataStore();
  public _navigate: NavigateFunction | null = null;
  public isConnected = false;
  public version: string | undefined;

  private navigate(url: string) {
    if (window.location.hash.includes("#settings")) return;
    this._navigate?.(url);
  }

  /**
   * Setup the websocket connection and listen for messages
   */
  async init(navigate: NavigateFunction) {
    console.log("Init web socket manager");
    this.disconnect();

    this._navigate = navigate;
    this.version = await getVersion();

    const connectionUrl = `${WEBSOCKET_URL}/?v=1&client_id=${APP_ID}`;
    try {
      this.socket = await WebSocket.connect(connectionUrl, {
        headers: {
          origin: API_URL,
        },
      });

      this.isConnected = true;

      this.socket.addListener(this.onMessage.bind(this));
    } catch (e) {
      console.log(e);
      this.isConnected = false;
      this.navigate("/error");

      await this.unpin();
    }

    // subscribe to local storage events to see if we need to move the user to the auth page
    window.addEventListener("storage", e => {
      if (e.key === "discord_access_token" && !e.newValue) {
        this.navigate("/");
      }
    });
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
        client_id: APP_ID,
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

  // TODO: this could live as a generic util and not on this class if we ever need it elsewhere
  private async unpin() {
    // unpin the overlay if there is an error
    return invoke("set_pin", {
      value: false,
    });
  }

  /**
   * Message listener when we get message from discord
   * @param payload a JSON object of the parsed message
   */
  private async onMessage(event: Message) {
    // TODO: this has to be a bug in the upstream lib, we should get a proper code
    // and not have to check the raw dawg string to see if something is wrong
    if (typeof event === "string" && (event as string).includes("Connection reset without closing handshake")) {
      this.navigate("/error");

      await this.unpin();
    }

    // TODO: does this ever happen?
    if (event.type === "Close") this.navigate?.("/error");

    if (event.type !== "Text") {
      return;
    }

    const payload: DiscordPayload = JSON.parse(event.data);

    // either the token is good and valid and we can login otherwise prompt them approve
    if (payload.evt === RPCEvent.READY) {
      const acessToken = this.userdataStore.accessToken;

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

        // we left the channel so we need to unsub for events
        if (this.store.currentChannel) {
          this.channelEvents(RPCCommand.UNSUBSCRIBE, this.store.currentChannel.id);
        }
      }

      this.store.removeUser(payload.data.user.id);

      // inform settings window for events other than me
      if (this.store.me?.id !== payload.data.user.id) {
        await emit(Event.UserLogUpdate, {
          ...createUserStateItem(payload.data),
          event: "leave",
          timestamp: Date.now(),
        });
      }
    }

    if (payload.evt === RPCEvent.VOICE_STATE_CREATE) {
      this.store.addUser(payload.data);

      // inform settings window for events other than me
      if (this.store.me?.id !== payload.data.user.id) {
        await emit(Event.UserLogUpdate, { ...createUserStateItem(payload.data), event: "join", timestamp: Date.now() });
      }
    }

    if (payload.evt === RPCEvent.VOICE_STATE_UPDATE) {
      this.store.updateUser(payload.data);
    }

    // VOICE_CHANNEL_SELECT	sent when the client joins a voice channel
    if (payload.evt === RPCEvent.VOICE_CHANNEL_SELECT) {
      if (payload.data.channel_id === null) {
        this.store.clearUsers();

        if (this.store.currentChannel) {
          this.channelEvents(RPCCommand.UNSUBSCRIBE, this.store.currentChannel.id);
        }

        // after unsub we clear the channel
        this.store.setCurrentChannel(null);
      }

      // try to find the user
      this.requestUserChannel();

      // TODO: is this needed cause it's just the id for some reason
      this.store.setCurrentChannel(payload.data.channel_id);
      if (payload.data?.channel_id) {
        this.send({
          cmd: RPCCommand.GET_CHANNEL,
          args: {
            channel_id: payload.data.channel_id,
          },
        });
      }

      // track user joining a channel
      track(Metric.ChannelJoin, 1);
    }

    // we got a token back from discord let's fetch an access token
    if (payload.cmd === RPCCommand.AUTHORIZE) {
      const { code } = payload.data;
      const res = await fetch(`${API_URL}/token`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      const text: TokenResponse = await res.json();
      // we need send the token to discord
      this.userdataStore.setAccessToken(text.access_token);

      // login with the token
      this.login(text.access_token);
    }

    // GET_SELECTED_VOICE_CHANNEL	used to get the current voice channel the client is in
    if (payload.cmd === RPCCommand.GET_SELECTED_VOICE_CHANNEL) {
      if (payload.data?.id) {
        // sub to channel events
        this.channelEvents(RPCCommand.SUBSCRIBE, payload.data.id);
        // set all the user in the channel
        this.store.setUsers(payload.data.voice_states);

        // set the current channel
        this.store.setCurrentChannel(payload.data);
      }
    }

    // console.log(payload);
    // we are ready to do things cause we are fully authed
    if (payload.cmd === RPCCommand.AUTHENTICATE && payload.evt === RPCEvent.ERROR) {
      // they have a token from the old client id
      if (payload.data.code === RPCErrors.INVALID_CLIENTID) {
        this.userdataStore.removeAccessToken();
      }

      // they have an invalid token
      if (payload.data.code === RPCErrors.INVALID_TOKEN) {
        this.userdataStore.removeAccessToken();
      }

      this.store.pushError(payload.data.message);

      // move to the error page
      this.navigate("/error");

      // track error metric
      track(Metric.DiscordAuthed, 0);
    } else if (payload?.cmd === RPCCommand.AUTHENTICATE) {
      // track success metric
      track(Metric.DiscordAuthed, 1);

      // track user session anonymously for sensitive bits
      // TODO: we should allSettled these promises?
      trackEvent(Metric.DiscordUser, {
        id: await hash(payload.data.user.id),
        username: await hash(payload.data.user.username),
        discordAppId: APP_ID,
        os: await type(),
        version: this.version,
      });

      // try to find the user
      this.requestUserChannel();

      // subscribe to get notified when the user changes channels
      this.send({
        cmd: RPCCommand.SUBSCRIBE,
        evt: RPCEvent.VOICE_CHANNEL_SELECT,
      });

      this.userdataStore.setAccessTokenExpiry(payload.data.expires);
      this.store.setMe(payload.data.user);

      // store in localstorage that we have auth
      this.userdataStore.setUserdata(payload.data.user);

      // move the view to /channel
      this.navigate("/channel");
    }

    if (payload.evt === RPCEvent.SPEAKING_START || payload.evt === RPCEvent.SPEAKING_STOP) {
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
      })
    );
  }

  /**
   * These method will allow you to sub/unsub to channel events
   * that are defined in SUBSCRIBABLE_EVENTS
   * @param cmd {RPCCommand} SUBSCRIBE or SUBSCRIBE
   * @param channelId The channel to subscribe to events in
   */
  channelEvents(cmd: RPCCommand.SUBSCRIBE | RPCCommand.UNSUBSCRIBE, channelId: string) {
    SUBSCRIBABLE_EVENTS.forEach(eventName =>
      this.send({
        cmd,
        args: { channel_id: channelId },
        evt: eventName,
        nonce: uuid.v4(),
      })
    );
  }
}

// hook to get the socket SocketManager
export const useSocket = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef<SocketManager | null>(null);

  useEffect(() => {
    if (location.pathname === "/settings") {
      return;
    }

    if (socketRef.current) {
      console.log("Socket already initialized");
      return;
    }

    console.log("Initializing websocket...");
    const socketManager = new SocketManager();
    socketManager.init(navigate);

    socketRef.current = socketManager;
  }, []);

  return socketRef.current;
};
