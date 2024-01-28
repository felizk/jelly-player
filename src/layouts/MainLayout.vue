<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title> Quasar App </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered></q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer :model-value="footerOpen">
      <book-player :small="true" />
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { injectBookPlayer } from 'src/models/bookplayer';
import BookPlayer from 'components/BookPlayer.vue';

let bookPlayer = injectBookPlayer();
const leftDrawerOpen = ref(false);
const footerOpen = ref(false);

watch(bookPlayer.currentSong, (val) => {
  footerOpen.value = !!val;
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
