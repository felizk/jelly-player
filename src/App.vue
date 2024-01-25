<template>
  <router-view />
  <audio autoplay ref="audioPlayer"></audio>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue';
import { setupBookPlayer } from './models/bookplayer';

const audioPlayer = ref<HTMLAudioElement | null>(null);
setupBookPlayer(audioPlayer);
</script>
