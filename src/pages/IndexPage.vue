<template>
  <q-page class="row items-center justify-evenly">
    <q-list class="col-xs-12 col-sm-8">
      <song-item
        v-for="(song, index) in bookPlayer.playlist.value"
        :key="index"
        :song="song"
        :active="bookPlayer.state.value.currentTrackIndex == index"
        @playSong="playSong(index)"
        :showRating="true"
      >
      </song-item>
    </q-list>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="casino"
        color="primary"
        @click="bookPlayer.rerollSongs(bookPlayer.currentSong.value)"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { injectBookPlayer } from 'src/models/bookplayer';
import SongItem from 'src/components/SongItem.vue';
let bookPlayer = injectBookPlayer();

function playSong(songIndex: number) {
  bookPlayer.player.skip_to_track(songIndex);
}
</script>

<style lang="sass">
.my-menu-link
  background: $light-blue-2
</style>
