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
const bookPlayer = setupBookPlayer(audioPlayer);

const settings = useSettings();
settings.$state = LocalStorage.getItem('settings') || {
  favoriteRatio: 50,
  listLength: 10,
};

const songLibrary = useSongLibrary();
songLibrary.favoritePercentage = settings.favoriteRatio;

watch(settings.$state, (state) => {
  LocalStorage.set('settings', state);
  if (settings.favoriteRatio !== songLibrary.favoritePercentage) {
    songLibrary.favoritePercentage = settings.favoriteRatio;
    songLibrary.updateWeights();
  }
  bookPlayer.rerollSongs(bookPlayer.currentSong.value);
});
</script>
