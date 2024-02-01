import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { ref, watch } from 'vue';

export const useSettings = defineStore('settingsStore', () => {
  const favoriteRatio = ref(50);

  return {
    favoriteRatio,
  };
});
