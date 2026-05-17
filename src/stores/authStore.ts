import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { ref, watch } from 'vue';

export const useAuthStore = defineStore('authStore', () => {
  const server = ref<string>(LocalStorage.getItem('login_server') ?? '');
  const token = ref<string>(LocalStorage.getItem('login_token') ?? '');
  const pw = ref<string>(LocalStorage.getItem('login_pw') ?? '');

  watch(server, save);
  watch(token, save);
  watch(pw, save);

  function save() {
    LocalStorage.set('login_server', server.value);
    LocalStorage.set('login_token', token.value);
    LocalStorage.set('login_pw', pw.value);
  }

  function reset() {
    token.value = '';
    pw.value = '';
    save();
  }

  return {
    server,
    token,
    pw,
    save,
    reset,
  };
});
