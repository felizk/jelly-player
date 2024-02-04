import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { ref, watch } from 'vue';

export const useAuthStore = defineStore('authStore', () => {
  const server = ref<string>(LocalStorage.getItem('login_server') ?? '');
  const userName = ref<string>(LocalStorage.getItem('login_user') ?? '');
  const token = ref<string>(LocalStorage.getItem('login_token') ?? '');

  watch(server, save);
  watch(userName, save);
  watch(token, save);

  function save() {
    LocalStorage.set('login_server', server.value);
    LocalStorage.set('login_user', userName.value);
    LocalStorage.set('login_token', token.value);
  }

  function reset() {
    userName.value = '';
    token.value = '';
    save();
  }

  return {
    server,
    userName,
    token,
    save,
    reset,
  };
});
