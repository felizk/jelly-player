<template>
  <q-page class="row items-center justify-evenly">
    <q-list class="col-xs-12 col-sm-8">
      <q-item
        v-for="(song, index) in bookPlayer.playlist.value"
        :key="index"
        clickable
        :active="bookPlayer.state.value.currentTrackIndex == index"
        active-class="my-menu-link"
        @click="playSong(index)"
      >
        <q-item-section top avatar class="q-ml-none">
          <q-avatar size="50px" rounded>
            <img :src="song.thumbnailUrl" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ song.title }}</q-item-label>
          <q-item-label caption lines="1">
            {{ song.artist }} - {{ song.album }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <div class="row">
            <q-rating
              :model-value="song.rating"
              :max="5"
              size="sm"
              color="primary"
              icon="favorite_border"
              icon-selected="favorite"
              icon-half="favorite"
              @update:model-value="(value) => updateRating(song, value)"
              @click.stop
            />
            <!--
            <q-btn
              color="primary"
              flat
              dense
              round
              :icon="song.isFavorite ? 'favorite' : 'favorite_border'"
              @click.stop="
                JellyfinMusic.setFavorited(api, song, !song.isFavorite)
              "
            /> -->
          </div>
        </q-item-section>
      </q-item>
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
import { JellyfinAPI, JellyfinMusic } from 'src/models/jellyfin';
import { ISong } from 'src/models/jellyitem';

let bookPlayer = injectBookPlayer();
const api = JellyfinAPI.instance;

function playSong(songIndex: number) {
  bookPlayer.player.skip_to_track(songIndex);
}

function updateRating(song: ISong, newRating: number) {
  JellyfinMusic.updateRating(api, song, newRating);
}
</script>

<style lang="sass">
.my-menu-link
  background: $light-blue-2
</style>
