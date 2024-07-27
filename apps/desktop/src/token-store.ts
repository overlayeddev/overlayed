import { create } from "zustand";
import type { Authdata, OverlayedUser } from "./types";
import { immer } from "zustand/middleware/immer";

export interface TokenState {
  users: Record<
    string,
    {
      userdata: OverlayedUser | null;
      authdata: Authdata | null;
    }
  > | null;
}

export interface TokenActions {
  setUserdata: (id: string, userdata: OverlayedUser) => void;
  setAuth: (id: string, userdata: Authdata) => void;
  clear: (id: string) => void;
}

export const useTokenStore = create<TokenState & TokenActions>()(
  immer(set => ({
    users: null,
    setUserdata: (id, data) =>
      set(state => {
        state.users.userdata[id] = data;
      }),

    setAuth: (id, data) =>
      set(state => {
        state.users.authdata[id] = data;
      }),

    clear: id =>
      set(state => {
        // clear both
        state.users.userdata[id] = null;
        state.users.authdata[id] = null;
      }),
  }))
);
