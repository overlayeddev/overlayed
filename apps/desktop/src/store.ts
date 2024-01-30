import { create } from "zustand";
import type { AuditLogUser, OverlayedUser, VoiceStateUser } from "./types";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";

enableMapSet();

export const createUserStateItem = (payload: VoiceStateUser) => {
  const data: OverlayedUser = {
    username: payload.nick,
    globalUsername: payload.user.global_name,
    avatarHash: payload.user.avatar,
    avatarDecorationData: payload.user.avatar_decoration_data,
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
  visible: boolean;
  userLog: AuditLogUser[];
  clickThrough: boolean;
  // TODO: type this better
  me: any | null;
  currentChannel: {
    id: string;
    name: string;
  } | null;
  users: Record<string, OverlayedUser>;
  discordErrors: Set<string>;
}

export interface AppActions {
  resetUserLog: () => void;
  logUser: (user: AuditLogUser) => void;
  setAppVisible: (value: boolean) => void;
  setClickThrough: (enbabled: boolean) => void;
  setTalking: (id: string, talking: boolean) => void;
  setUsers: (users: VoiceStateUser[]) => void;
  updateUser: (user: VoiceStateUser) => void;
  clearUsers: () => void;
  removeUser: (id: string) => void;
  addUser: (user: VoiceStateUser) => void;
  // TODO: type this
  setCurrentChannel: (channel: any) => void;
  setMe: (user: OverlayedUser | null) => void;
  pushError: (message: string) => void;
  resetErrors: () => void;
}

// sort discord users by name and myself on top
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

// sort internal app state users by name and me on top
const sortOverlayedUsers = (myId: string | undefined, users: Record<string, OverlayedUser>) => {
  const sortedUserArray = Object.entries(users).sort((a, b) => {
    if (a[1].id === myId) return -1;
    if (b[1].id === myId) return 1;

    // THIS Is for lexicographical sorting
    return a[1].username.localeCompare(b[1].username);
  });

  const userMapSorted: Record<string, OverlayedUser> = {};
  for (const [_, item] of sortedUserArray) {
    userMapSorted[item.id] = item;
  }

  return userMapSorted;
};

// TODO: split this into multiple stores
export const useAppStore = create<AppState & AppActions>()(
  // TODO: fix later
  // @ts-ignore
  immer(set => ({
    visible: true,
    userLog: [],
    me: null,
    discordErrors: new Set(),
    clickThrough: false,
    currentChannel: null,
    users: {},
    setAppVisible: value =>
      set(state => {
        state.visible = value;
      }),
    setMe: data =>
      set(state => {
        console.log("setting me", data)
        state.me = data;
      }),
    setTalking: (id, talking) =>
      set(state => {
        state.users[id]!.talking = talking;
      }),
    removeUser: id =>
      set((state: AppState) => {
        delete state.users[id];
      }),
    updateUser: item =>
      set((state: AppState) => {
        state.users[item.user.id] = createUserStateItem(item);
      }),
    setUsers: users =>
      set(state => {
        state.users = sortUserList(state.me?.id, users);
      }),
    clearUsers: () =>
      set(state => {
        state.users = {};
      }),
    addUser: item =>
      set(state => {
        const tempUsers = { ...state.users };
        tempUsers[item.user.id] = createUserStateItem(item);
        state.users = sortOverlayedUsers(state.me?.id, tempUsers);
      }),
    setCurrentChannel: channel =>
      set(state => {
        state.currentChannel = channel;
      }),
    setClickThrough: (enabled: boolean) =>
      set(state => {
        state.clickThrough = enabled;
      }),
    pushError: error =>
      set(state => {
        state.discordErrors.add(error);
      }),
    resetErrors: () =>
      set(state => {
        state.discordErrors.clear();
      }),
    logUser: user =>
      set(state => {
        state.userLog.push(user);
      }),
    resetUserLog: () =>
      set(state => {
        state.userLog = [];
      }),
  }))
);
