import { defineStore } from "pinia";
import { store } from "/@/store";
import { storageSession } from "/@/utils/storage";

interface SettingState {
  token: String;
  user: String;
}

const info = storageSession.getItem("token")

export const useUserStore = defineStore({
  id: "pure-user",
  state: (): SettingState => ({
    token: info?.token,
    user: info?.username
  }),
  getters: {
    getToken() {
      return this.token;
    },
    getUser() {
      return this.user;
    },
  },
  actions: {
    SET_TOKEN(token: String) {
      this.token = token;
    },
    SET_USER(user: String) {
      this.user = user;
    },
    setTokenAndUser(info: any) {
      const { token, user } = info
      this.SET_TOKEN(token);
      this.SET_USER(user);
    }
  },
});

export function useUserStoreHook() {
  return useUserStore(store);
}
