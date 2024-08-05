import { create, type StateCreator } from "zustand";
import type { Authdata, OverlayedUser } from "./types";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

export interface TokenState {
  users: Record<
    string,
    {
      userdata: OverlayedUser;
      authdata: Authdata;
    }
  >;
}

export interface TokenActions {
  setUserdata: (id: string, userdata: OverlayedUser) => void;
  setAuth: (id: string, userdata: Authdata) => void;
}

const storeInit: StateCreator<TokenState, [["zustand/persist", unknown], ["zustand/immer", never]], [], TokenState> = (
  set,
  get
) => ({
  users: {},
  setUserdata: (id, data) =>
    set(state => {
      console.log("setting userdata", id, data);
      // @ts-ignore
      state.users = {
        ...state.users,
        [id]: {
          ...state.users[id],
          userdata: data,
        },
      };
    }),
  setAuth: (id, data) =>
    set(state => {
      console.log("setting authdata", id, data);
    }),
});

export const useTokenStore = create<TokenState & TokenActions>()(immer(persist(storeInit, { nam : "token-store" })));
