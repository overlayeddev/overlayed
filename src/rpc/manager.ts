import { RPCCommand } from "./command";
import { fetch, Body } from "@tauri-apps/api/http";
import { RPCEvent } from "./event";
import * as uuid from "uuid";
import WebSocket from "tauri-plugin-websocket-api";
import { AppActions, AppState, useAppStore as appStore } from "../store";

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
}

/**
 * Collection of events that are needed to sub to for voice states
 */
const SUBSCRIBABLE_EVENTS = [
  RPCEvent.SPEAKING_START,
  RPCEvent.SPEAKING_STOP,
  RPCEvent.VOICE_STATE_CREATE,
  RPCEvent.VOICE_STATE_DELETE,
  RPCEvent.VOICE_STATE_DELETE,
];

const STREAM_KIT_APP_ID = "207646673902501888";
const WEBSOCKET_URL = "ws://127.0.0.1:6463";

interface DiscordPayload {
  cmd?: `${RPCCommand}`;
  args?: any;
  evt?: `${RPCEvent}`;
  nonce?: string;
}

/**
 * A generic manager the socket
 */
class SocketManager {
  public socket: WebSocket | null = null;
  public currentChannelId = null;
  public store: (AppState & AppActions) | null = null;
  public tokenStore: TokenStore | null = null;

  /**
   * Setup the websocket connection and listen for messages
   */
  async init() {
    this.store = appStore.getState();
    this.tokenStore = new TokenStore();

    const connectionUrl = `${WEBSOCKET_URL}/?v=1&client_id=${STREAM_KIT_APP_ID}`;
    this.socket = await WebSocket.connect(connectionUrl, {
      headers: {
        // we need to set the origin header to the discord streamkit domain
        origin: "https://streamkit.discord.com",
      },
    });

    this.socket.addListener(this.onMessage.bind(this));

    // this.send(voiceChannelSelect());
    // this.send(getSelectedChannel());
  }

  /**
   * Authenticate with discord by having the user approve the app
   */
  private authenticate() {
    this.send({
      args: {
        client_id: STREAM_KIT_APP_ID,
        scopes: ["rpc"],
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
  private async onMessage(event: any) {
    const payload: any = JSON.parse(event.data);

    // either the token is good and valid and we can login otherwise prompt them approve
    if (payload.evt === RPCEvent.READY) {
      const acessToken = this.tokenStore?.accessToken;
      if (acessToken) {
        this.login(acessToken);
      } else {
        this.authenticate();
      }
    }

    // we got a token back from discord let's fetch an access token
    if (payload.cmd === RPCCommand.AUTHORIZE) {
      const { code } = payload.data;
      const res = await fetch<TokenResponse>(
        "https://streamkit.discord.com/overlay/token",
        {
          method: "POST",
          body: Body.json({ code }),
        },
      );

      // we need send the token to discord
      this.tokenStore?.setAccessToken(res.data.access_token);

      // login with the token
      this.login(res.data.access_token);
    }

    if (payload.cmd === RPCCommand.GET_SELECTED_VOICE_CHANNEL) {
      // sub to channel events
      // this.channelEvents(RPCCommand.SUBSCRIBE, payload.data.id);

      // set all the user in the channel
      this.store?.setUsers(payload.data.voice_states);

      this.store?.setCurrentChannel(payload.data.id);
    }

    // we are ready to do things
    if (payload?.cmd === RPCCommand.AUTHENTICATE) {
      // ask for the current channel
      this.send({
        cmd: RPCCommand.GET_SELECTED_VOICE_CHANNEL,
      });

      // subscribe to get notified when the user changes channels
      this.send({
        cmd: RPCCommand.SUBSCRIBE,
        evt: RPCEvent.VOICE_CHANNEL_SELECT,
      });

      this.store?.setMe(payload.data.user);
    }

    if (
      payload.evt === RPCEvent.SPEAKING_START ||
      payload.evt === RPCEvent.SPEAKING_STOP
    ) {
      const isSpeaking = payload.evt !== RPCEvent.SPEAKING_START;
      this.store?.setTalking(payload.data.user_id, !isSpeaking);
    }

    if (payload.evt === RPCEvent.VOICE_STATE_DELETE) {
      console.log("last channel i was in", this.store?.currentChannel);
      this.store?.removeUser(payload.data.user.id);
    }

    if (payload.evt === RPCEvent.VOICE_STATE_CREATE) {
      this.store?.addUser(payload.data);
    }

    if (payload.evt === RPCEvent.VOICE_CHANNEL_SELECT) {
      console.log("channel select", payload);

      this.store?.setCurrentChannel(payload.data.channel_id);
      if (payload.data?.channel_id) {
        this.send({
          cmd: RPCCommand.GET_CHANNEL,
          args: {
            channel_id: payload.data.channel_id,
          },
        });
        this.channelEvents(RPCCommand.SUBSCRIBE, payload.data.channel_id);
      }

      // we changed channels ask for the channel again
      // this.send({
      //   cmd: RPCCommand.GET_SELECTED_VOICE_CHANNEL,
      // });
    }

    console.log(payload);
  }

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
    channelId: String,
  ) {
    SUBSCRIBABLE_EVENTS.map((eventName) =>
      this.send({
        cmd,
        args: { channel_id: channelId },
        evt: eventName,
        nonce: uuid.v4(),
      }),
    );
  }
}

export default new SocketManager();
