import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { ref, watch } from 'vue';

export const useAuthStore = defineStore('authStore', () => {
  const server = ref<string>(LocalStorage.getItem('login_server') ?? '');
  const token = ref<string>(LocalStorage.getItem('login_token') ?? '');

  watch(server, save);
  watch(token, save);

  function save() {
    LocalStorage.set('login_server', server.value);
    LocalStorage.set('login_token', token.value);
  }

  function reset() {
    token.value = '';
    save();
  }

  return {
    server,
    token,
    save,
    reset,
  };
});
