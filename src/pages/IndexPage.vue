<template>
  <q-page class="row items-top justify-evenly">
    <div class="col-xs-12 col-sm-8">
      <q-list>
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
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { injectBookPlayer } from 'src/models/bookplayer';
import SongItem from 'src/components/SongItem.vue';
import { QList } from 'quasar';

let bookPlayer = injectBookPlayer();

function playSong(songIndex: number) {
  bookPlayer.player.skip_to_track(songIndex);
}
</script>
