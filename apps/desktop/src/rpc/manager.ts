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
import type { CurrentChannel, VoiceStateUser, VoiceUser } from "@/types";
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

  removeUserdata() {
    this.store.removeItem(this.keys.userData);
  }

  clearAuth() {
    this.removeAccessToken();
    this.removeUserdata();
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
const RECONNECT_DELAYS = [2000, 5000, 15000, 30000];
const RESYNC_INTERVAL = 20000;
const RESYNC_TIMEOUT = 5000;

interface SelectedVoiceChannel extends CurrentChannel {
  voice_states: VoiceStateUser[];
}

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
  public currentChannelId: string | null = null;
  // TODO: move this so we can use it in settings too
  public userdataStore: UserdataStore = new UserdataStore();
  public _navigate: NavigateFunction | null = null;
  public isConnected = false;
  public version: string | undefined;
  // @ts-expect-error need better types
  public soundBoardItemsResolver = Promise.withResolvers();
  private initialized = false;
  private stopped = false;
  private connecting = false;
  private authenticated = false;
  private generation = 0;
  private removeListener: (() => void) | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;
  private resyncTimeout: ReturnType<typeof setTimeout> | null = null;
  private resyncNonce: string | null = null;
  private missedResyncs = 0;
  private reconnectAttempt = 0;
  private acceptedConnections: number[] = [];

  private navigate(url: string) {
    if (window.location.hash.includes("#settings")) return;
    this._navigate?.(url);
  }

  /**
   * Setup the websocket connection and listen for messages
   */
  async init(navigate: NavigateFunction) {
    if (this.initialized) return;
    this.initialized = true;
    this.stopped = false;
    console.log("Init web socket manager");
    this._navigate = navigate;
    window.addEventListener("storage", this.onStorage);
    const generation = this.generation;
    this.version = await getVersion();
    if (!this.isCurrent(generation)) return;
    await this.connect(true);
  }

  private isCurrent(generation: number) {
    return !this.stopped && generation === this.generation;
  }

  private async connect(initial = false) {
    if (this.stopped || this.connecting || this.socket) return;
    this.connecting = true;
    const generation = ++this.generation;
    const connectionUrl = `${WEBSOCKET_URL}/?v=1&client_id=${APP_ID}`;
    try {
      const socket = await WebSocket.connect(connectionUrl, {
        headers: {
          origin: API_URL,
        },
      });
      if (!this.isCurrent(generation)) {
        void socket.disconnect().catch(() => {});
        return;
      }
      this.socket = socket;
      this.isConnected = true;
      this.connecting = false;
      this.acceptedConnections.push(Date.now());
      this.removeListener = socket.addListener(event => {
        if (!this.isCurrent(generation)) return;
        void this.onMessage(event, generation).catch(error => {
          if (this.isCurrent(generation)) console.warn("Could not handle Discord RPC message", error);
        });
      });
    } catch (e) {
      if (!this.isCurrent(generation)) return;
      this.connectionLost("Connection attempt failed", generation);
      if (initial) {
        this.navigate("/error");
        await this.unpin().catch(error => console.warn("Could not unpin after initial RPC failure", error));
      }
    }
  }

  private onStorage = (e: StorageEvent) => {
    if (e.key === "discord_access_token" && !e.newValue) {
      this.authenticated = false;
      this.stopResync();
      this.store.setMe(null);
      this.store.setCurrentChannel(null);
      this.store.clearUsers();
      this.navigate("/");
    }

    if (e.key === "user_data" && !e.newValue) {
      this.store.setMe(null);
      this.store.setCurrentChannel(null);
      this.store.clearUsers();
    }
  };

  private stopResync() {
    if (this.resyncTimer !== null) clearTimeout(this.resyncTimer);
    if (this.resyncTimeout !== null) clearTimeout(this.resyncTimeout);
    this.resyncTimer = this.resyncTimeout = null;
    this.resyncNonce = null;
    this.missedResyncs = 0;
  }

  private closeSocket() {
    ++this.generation;
    this.isConnected = this.connecting = this.authenticated = false;
    this.removeListener?.();
    this.removeListener = null;
    this.stopResync();
    if (this.reconnectTimer !== null) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const socket = this.socket;
    this.socket = null;
    this.currentChannelId = null;
    this.store.clearUsers();
    this.store.setCurrentChannel(null);
    // The plugin can retain a writer after a read error. Release it best effort
    // without waiting for a dead connection or letting its rejection escape.
    void socket?.disconnect().catch(() => {});
  }

  private connectionLost(reason: string, generation: number) {
    if (!this.isCurrent(generation)) return;
    console.warn(`Discord RPC disconnected: ${reason}`);
    this.closeSocket();
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer !== null || this.isConnected) return;
    const now = Date.now();
    // Failed attempts while Discord is absent do not create RPC connections.
    // Limit accepted connections to two per minute, even across rapid losses.
    this.acceptedConnections = this.acceptedConnections.filter(time => now - time < 60000);
    const rateDelay = this.acceptedConnections.length >= 2 ? this.acceptedConnections[0]! + 60000 - now : 0;
    const delay = Math.max(
      RECONNECT_DELAYS[Math.min(this.reconnectAttempt++, RECONNECT_DELAYS.length - 1)]!,
      rateDelay
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  public disconnect() {
    this.stopped = true;
    this.closeSocket();
    window.removeEventListener("storage", this.onStorage);
  }

  private scheduleResync() {
    if (!this.authenticated || !this.isConnected || this.resyncTimer !== null) return;
    this.resyncTimer = setTimeout(() => {
      this.resyncTimer = null;
      this.resync();
    }, RESYNC_INTERVAL);
  }

  private resync() {
    if (!this.authenticated || !this.isConnected || this.resyncNonce !== null) return;
    const generation = this.generation;
    const nonce = `resync:${uuid.v4()}`;
    this.resyncNonce = nonce;
    this.resyncTimeout = setTimeout(() => {
      if (!this.isCurrent(generation) || this.resyncNonce !== nonce) return;
      this.resyncTimeout = null;
      this.resyncNonce = null;
      if (++this.missedResyncs >= 2) {
        this.connectionLost("Two selected-channel replies timed out", generation);
      } else {
        // Retry once immediately so a silent dead socket cannot leave stale
        // users displayed for another full twenty-second interval.
        this.resync();
      }
    }, RESYNC_TIMEOUT);
    void this.send({ cmd: RPCCommand.GET_SELECTED_VOICE_CHANNEL, nonce });
  }

  private reconcileChannel(channel: SelectedVoiceChannel | null) {
    const channelId = channel?.id ?? null;
    if (channelId !== this.currentChannelId) {
      if (this.currentChannelId) this.channelEvents(RPCCommand.UNSUBSCRIBE, this.currentChannelId);
      this.store.clearUsers();
      this.store.setCurrentChannel(null);
      if (channel) {
        this.channelEvents(RPCCommand.SUBSCRIBE, channel.id);
        this.store.setUsers(channel.voice_states);
        this.store.setCurrentChannel(channel);
      }
    } else if (channel) {
      // Apply the snapshot atomically. Existing speakers retain their flags;
      // newcomers start silent and users absent from the reply are removed.
      appStore.setState(state => ({
        currentChannel: channel,
        users: Object.fromEntries(
          [...channel.voice_states]
            .sort((a, b) => {
              if (a.user.id === state.me?.id) return -1;
              if (b.user.id === state.me?.id) return 1;
              return a.nick.localeCompare(b.nick);
            })
            .map(user => [
              user.user.id,
              {
                ...createUserStateItem(user),
                talking: state.users[user.user.id]?.talking ?? false,
                lastUpdate: state.users[user.user.id]?.lastUpdate ?? 0,
              },
            ])
        ),
      }));
    } else {
      this.store.clearUsers();
      this.store.setCurrentChannel(null);
    }
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
        scopes: [
          "identify",
          "rpc",
          // TODO: when we need soundboard we can enable these scopes
          // "guilds",
          // "rpc.notifications.read",
          // TODO: how do you use other scopes 🤔
          // "rpc.activities.write",
          // "rpc.voice.read",
          // "rpc.voice.write",
          // "rpc.video.read",
          // "rpc.video.write",
          // "rpc.screenshare.read",
          // "rpc.screenshare.write",
        ],
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
  private async onMessage(event: Message | string | null, generation: number) {
    if (!this.isCurrent(generation)) return;
    if (!event || typeof event === "string" || event.type !== "Text") {
      this.connectionLost(
        typeof event === "string" ? "Socket read error" : `Socket ${event?.type ?? "closed"}`,
        generation
      );
      return;
    }

    const payload: DiscordPayload = JSON.parse(event.data);

    if (payload.cmd === RPCCommand.GET_SELECTED_VOICE_CHANNEL && payload.nonce?.startsWith("resync:")) {
      // A delayed reply to a timed-out probe must not enter the normal handler.
      if (payload.nonce !== this.resyncNonce) return;
      if (payload.evt === RPCEvent.ERROR) {
        this.connectionLost("Selected-channel resync failed", generation);
        return;
      }
      if (this.resyncTimeout !== null) clearTimeout(this.resyncTimeout);
      this.resyncTimeout = null;
      this.resyncNonce = null;
      this.missedResyncs = 0;
      try {
        this.reconcileChannel(payload.data ?? null);
      } catch {
        this.connectionLost("Invalid selected-channel reply", generation);
        return;
      }
      this.scheduleResync();
      return;
    }

    // TODO: we need a client side logger with levels too so that we can enable this
    // console.log(payload);

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

    if (payload.cmd === RPCCommand.GET_SOUNDBOARD_SOUNDS) {
      // update the Promise
      this.soundBoardItemsResolver.resolve(payload.data);
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
      if (!this.isCurrent(generation)) return;
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
      this.authenticated = false;
      this.stopResync();
      // These are recoverable auth issues (e.g. expired/revoked token),
      // so clear auth state and send the user back to the reauth screen.
      const shouldReauth = [
        RPCErrors.INVALID_CLIENTID,
        RPCErrors.INVALID_TOKEN,
        RPCErrors.INVALID_USER,
        RPCErrors.OAUTH2_ERROR,
      ].includes(payload.data.code);

      if (shouldReauth) {
        this.userdataStore.clearAuth();
        this.store.setMe(null);
        this.store.setCurrentChannel(null);
        this.store.clearUsers();
        this.navigate("/");
        track(Metric.DiscordAuthed, 0);
        return;
      }

      this.store.pushError(payload.data.message);

      // move to the error page
      this.navigate("/error");

      // track error metric
      track(Metric.DiscordAuthed, 0);
    } else if (payload?.cmd === RPCCommand.AUTHENTICATE) {
      this.authenticated = true;
      this.reconnectAttempt = 0;
      this.stopResync();
      this.scheduleResync();
      // track success metric
      track(Metric.DiscordAuthed, 1);

      // track user session anonymously for sensitive bits
      // TODO: we should allSettled these promises?
      const session = {
        id: await hash(payload.data.user.id),
        username: await hash(payload.data.user.username),
        discordAppId: APP_ID,
        os: await type(),
        version: this.version,
      };
      if (!this.isCurrent(generation)) return;
      trackEvent(Metric.DiscordUser, session);

      // subscribe to channel select events
      this.send({
        cmd: RPCCommand.SUBSCRIBE,
        evt: RPCEvent.VOICE_CHANNEL_SELECT,
      });

      // try to find the user
      this.requestUserChannel();

      this.userdataStore.setAccessTokenExpiry(payload.data.expires);
      this.store.setMe(payload.data.user);

      // store in localstorage that we have auth
      this.userdataStore.setUserdata(payload.data.user);

      // move the view to /channel
      this.navigate("/channel");
    }

    if (payload.evt === RPCEvent.SPEAKING_START || payload.evt === RPCEvent.SPEAKING_STOP) {
      const isSpeaking = payload.evt !== RPCEvent.SPEAKING_START;
      if (this.store.users[payload.data.user_id]) this.store.setTalking(payload.data.user_id, !isSpeaking);
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

  /** Get the soundboard items */
  public async getSoundBoardItems() {
    await this.send({
      cmd: RPCCommand.GET_SOUNDBOARD_SOUNDS,
    });

    return this.soundBoardItemsResolver.promise;
  }

  /**
   * Send a message to discord
   * @param payload {DiscordPayload} the payload to send
   */
  public async send(payload: DiscordPayload) {
    const socket = this.socket;
    const generation = this.generation;
    if (!socket || !this.isConnected) return;
    try {
      await socket.send(JSON.stringify({ ...payload, nonce: payload.nonce ?? uuid.v4() }));
    } catch {
      this.connectionLost("Socket send failed", generation);
    }
  }

  /**
   * These method will allow you to sub/unsub to channel events
   * that are defined in SUBSCRIBABLE_EVENTS
   * @param cmd {RPCCommand} SUBSCRIBE or SUBSCRIBE
   * @param channelId The channel to subscribe to events in
   */
  channelEvents(cmd: RPCCommand.SUBSCRIBE | RPCCommand.UNSUBSCRIBE, channelId: string) {
    if (cmd === RPCCommand.SUBSCRIBE) this.currentChannelId = channelId;
    else if (this.currentChannelId === channelId) this.currentChannelId = null;
    SUBSCRIBABLE_EVENTS.forEach(eventName =>
      this.send({
        cmd,
        args: { channel_id: channelId },
        evt: eventName,
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
    return () => {
      socketManager.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef.current;
};
