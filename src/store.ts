import { create } from "zustand";
import { OverlayedUser, VoiceStateUser } from "./types";
import { immer } from "zustand/middleware/immer";

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
  clickThrough: boolean;
  me: OverlayedUser | null;
  currentChannel: string | null;
  users: Record<string, OverlayedUser>;
}

export interface AppActions {
  setClickThrough: (enbabled: boolean) => void;
  setTalking: (id: string, talking: boolean) => void;
  setUsers: (users: VoiceStateUser[]) => void;
  updateUser: (user: any) => void;
  clearUsers: () => void;
  removeUser: (id: string) => void;
  addUser: (user: any) => void;
  setCurrentChannel: (channel: string | null) => void;
  setMe: (user: OverlayedUser | null) => void;
}

const sortUserList = (myId: string | undefined, users: VoiceStateUser[]) => {
  const sortedUserArray = Object.entries(users).sort((a, b) => {
    if (a[1].user.id === myId) return -1;
    if (b[1].user.id === myId) return 1;

    // THIS Is for lexicographical sorting
    return a[1].nick.localeCompare(b[1].nick);
  });

  const userMapSorted: Record<string, OverlayedUser> = {};
  for (const [_, item] of sortedUserArray) {
    userMapSorted[item.user.id] = createUserStateItem(item);
  }

  return userMapSorted;
};

export const useAppStore = create<AppState & AppActions>()(
  // TODO: fix later
  // @ts-ignore
  immer((set) => ({
    me: null,
    clickThrough: false,
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
    updateUser: (item) =>
      set((state: AppState) => {
        state.users[item.user.id] = createUserStateItem(item);
      }),
    setUsers: (users) =>
      set((state) => {
        state.users = sortUserList(state.me?.id, users);
      }),
    clearUsers: () =>
      set((state) => {
        state.users = {};
      }),
    addUser: (event) =>
      set((state) => {
        state.users[event.user.id] = createUserStateItem(event);
      }),
    setCurrentChannel: (channelId: string | null) =>
      set((state) => {
        state.currentChannel = channelId;
      }),
    setClickThrough: (enabled: boolean) =>
      set((state) => {
        state.clickThrough = enabled;
      }),
  })),
);
