<template>
  <q-page class="row items-center justify-evenly">
    <div>
      <div class="row items-center justify-evenly">
        <q-input v-model="quickSearchText" label="Standard" />
      </div>
      <div class="row items-center justify-evenly">
        <q-list>
          <q-item-label header>Upcoming</q-item-label>
          <q-separator />
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
                <q-btn
                  color="primary"
                  flat
                  dense
                  round
                  :icon="song.isFavorite ? 'favorite' : 'favorite_border'"
                  @click.stop="songLibrary.favorite(song)"
                />
                <!--
                <q-btn
                  color="primary"
                  flat
                  dense
                  round
                  :icon="song.isLiked ? 'thumb_up_alt' : 'thumb_up_off_alt'"
                  @click.stop="onLiked(song)"
                /> -->
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </div>

    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="casino"
        color="primary"
        @click="bookPlayer.rerollSongs(true)"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { injectBookPlayer } from 'src/models/bookplayer';
import { ISong } from 'src/models/jellyitem';
import { useSongLibrary } from 'src/stores/songlibrary';
import { ref, watch } from 'vue';
import fuzzysort from 'fuzzysort';

let bookPlayer = injectBookPlayer();
let songLibrary = useSongLibrary();

const quickSearchText = ref<string>('');

watch(quickSearchText, (text) => {
  if (text) {
    const results = fuzzysort.go(text, songLibrary.songs, {
      keys: ['title', 'album', 'artist'],
      limit: 5,
    });
    songLibrary.nextSongs = results.map((x) => x.obj);
  } else {
    songLibrary.nextSongs = [];
  }
});

async function play() {
  // let items = songLibrary.songs;

  const newSongs: ISong[] = [];

  for (let i = 0; i < 20; i++) {
    const next = await songLibrary.getRandomSong();
    if (next) {
      newSongs.push(next);
    }
  }

  bookPlayer.updatePlaylist(newSongs, true);

  // songLibrary.nextSongs = newSongs;
  // let idx = (Math.random() * items.length) | 0;
  // let item = items[idx];

  //bookPlayer.loadSong(item);
}

function playSong(songIndex: number) {
  bookPlayer.player.skip_to_track(songIndex);
}
</script>

<style lang="sass">
.my-menu-link
  background: $light-blue-1
.test
  display: none
</style>
