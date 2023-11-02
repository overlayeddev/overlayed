import { create } from "zustand";
import { OverlayedUser, VoiceStateUser } from "./types";
import { immer } from "zustand/middleware/immer";

// TODO: move this?
const createUserStateItem = (payload: VoiceStateUser) => {
  const data = {
    username: payload.nick,
    avatarHash: payload.user.avatar,
    muted: payload.mute,
    deafened: payload.voice_state.deaf, // Probably only bots can deafen themselves
    selfDeafened: payload.voice_state.self_deaf,
    selfMuted: payload.voice_state.self_mute,
    suppress: payload.voice_state.suppress,
    talking: false,
    id: payload.user.id,
    volume: payload.volume,
    bot: payload.user.bot,
    flags: payload.user.flags,
    premium: payload.user.premium_type,
    discriminator: payload.user.discriminator,
    lastUpdate: 0,
  };

  return data;
};

export interface AppState {
  me: {};
  currentChannel: string | null;
  users: Record<string, OverlayedUser>;
}

export interface AppActions {
  setTalking: (id: string, talking: boolean) => void;
  setUsers: (users: any) => void;
  removeUser: (id: string) => void;
  addUser: (id: any) => void;
  setCurrentChannel: (channel: any) => void;
  setMe: (user: any) => void;
}

export const useAppStore = create < AppState & AppActions > ()(
  // @ts-ignore
  immer((set) => ({
    me: {},
    currentChannel: null,
    users: {},
    setMe: (data) =>
      set((state) => {
        state.me = data;
      }),
    setTalking: (id, talking) =>
      set((state) => {
        state.users[id].talking = talking;
      }),
    removeUser: (id) =>
      set((state: AppState) => {
        delete state.users[id];
      }),
    setUsers: (users) =>
      set((state) => {
        for (const item of users) {
          state.users[item.user.id] = createUserStateItem(item);
        }
      }),
    addUser: (user) =>
      set((state) => {
        state.users[user.id] = createUserStateItem(user);
      }),
    setCurrentChannel: (channelData: any) =>
      set((state) => {
        state.currentChannel = channelData;
      }),
  })),
);
