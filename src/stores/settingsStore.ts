import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettings = defineStore('settingsStore', () => {
  const favoriteRatio = ref(50);
  const listLength = ref(10);

  return {
    favoriteRatio,
    listLength,
  };
});
