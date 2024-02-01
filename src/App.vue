<template>
  <router-view />
  <audio autoplay ref="audioPlayer"></audio>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { setupBookPlayer } from './models/bookplayer';
import { useSettings } from './stores/settingsStore';
import { LocalStorage } from 'quasar';
import { useSongLibrary } from './stores/songlibrary';
const audioPlayer = ref<HTMLAudioElement | null>(null);
setupBookPlayer(audioPlayer);

const settings = useSettings();
settings.$state = LocalStorage.getItem('settings') || { favoriteRatio: 50 };

const songLibrary = useSongLibrary();
songLibrary.favoritePercentage = settings.favoriteRatio;

watch(settings.$state, (state) => {
  LocalStorage.set('settings', state);
  songLibrary.favoritePercentage = settings.favoriteRatio;
  songLibrary.updateWeights();
});
</script>
